"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Loader2, CheckCircle, Copy, ThumbsUp, Shield, Bug, TestTube, RefreshCw } from "lucide-react"
import { aiService, type SuggestionRequest, type AISuggestion } from "@/lib/ai-service"

interface AISuggestionsModalProps {
  analysisResults?: any
  filename?: string
  code?: string
  trigger?: React.ReactNode
}

export function AISuggestionsModal({ analysisResults, filename, code, trigger }: AISuggestionsModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const request: SuggestionRequest = {
        code: code || "// Code from analysis",
        issues: [...(analysisResults?.logicFlaws?.issues || []), ...(analysisResults?.apiMisuse?.issues || [])],
        fileType: getFileType(filename || ""),
        context: `Analysis results for ${filename || "uploaded file"}`,
      }

      const result = await aiService.getSuggestions(request)
      setSuggestions(result)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && suggestions.length === 0) {
      fetchSuggestions()
    }
  }, [open])

  const getFileType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const typeMap: { [key: string]: string } = {
      ts: "typescript",
      js: "javascript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
    }
    return typeMap[ext || ""] || "javascript"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fix":
        return <Bug className="w-4 h-4" />
      case "improvement":
        return <Lightbulb className="w-4 h-4" />
      case "refactor":
        return <RefreshCw className="w-4 h-4" />
      case "test":
        return <TestTube className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fix":
        return "text-red-400 bg-red-500/10 border-red-500/30"
      case "improvement":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30"
      case "refactor":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30"
      case "test":
        return "text-green-400 bg-green-500/10 border-green-500/30"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const applySuggestion = (suggestionId: string) => {
    setAppliedSuggestions((prev) => new Set([...prev, suggestionId]))
  }

  const groupedSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = []
      }
      acc[suggestion.type].push(suggestion)
      return acc
    },
    {} as Record<string, AISuggestion[]>,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium shadow-lg"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Get AI Suggestions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-black border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-gold" />
            <span>AI Code Suggestions</span>
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Smart suggestions to improve your code based on analysis results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
                <p className="text-white">Analyzing your code and generating suggestions...</p>
                <Progress value={75} className="w-64 mx-auto" />
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-text-muted" />
              <h3 className="text-lg font-medium text-white mb-2">No suggestions available</h3>
              <p className="text-text-secondary">Your code looks good! No immediate improvements needed.</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-900">
                <TabsTrigger value="all" className="text-white">
                  All ({suggestions.length})
                </TabsTrigger>
                <TabsTrigger value="fix" className="text-white">
                  Fixes ({groupedSuggestions.fix?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="improvement" className="text-white">
                  Improvements ({groupedSuggestions.improvement?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="refactor" className="text-white">
                  Refactor ({groupedSuggestions.refactor?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="test" className="text-white">
                  Tests ({groupedSuggestions.test?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    isApplied={appliedSuggestions.has(suggestion.id)}
                    onApply={() => applySuggestion(suggestion.id)}
                    onCopy={() => copyToClipboard(suggestion.code)}
                    getTypeIcon={getTypeIcon}
                    getTypeColor={getTypeColor}
                  />
                ))}
              </TabsContent>

              {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {typeSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isApplied={appliedSuggestions.has(suggestion.id)}
                      onApply={() => applySuggestion(suggestion.id)}
                      onCopy={() => copyToClipboard(suggestion.code)}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                    />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <div className="text-sm text-text-secondary">
              {appliedSuggestions.size} of {suggestions.length} suggestions applied
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={fetchSuggestions}
                disabled={loading}
                className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SuggestionCardProps {
  suggestion: AISuggestion
  isApplied: boolean
  onApply: () => void
  onCopy: () => void
  getTypeIcon: (type: string) => React.ReactNode
  getTypeColor: (type: string) => string
}

function SuggestionCard({ suggestion, isApplied, onApply, onCopy, getTypeIcon, getTypeColor }: SuggestionCardProps) {
  return (
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>{getTypeIcon(suggestion.type)}</div>
            <div className="flex-1">
              <CardTitle className="text-white text-base">{suggestion.title}</CardTitle>
              <CardDescription className="text-text-secondary mt-1">{suggestion.description}</CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getTypeColor(suggestion.type)}>{suggestion.type}</Badge>
                <Badge variant="outline" className="border-gray-700 text-text-secondary">
                  {suggestion.confidence}% confidence
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={onApply}
              disabled={isApplied}
              className={
                isApplied
                  ? "bg-green-500/20 text-green-400 border-green-500/30 font-medium"
                  : "bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
              }
            >
              {isApplied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Applied
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-white mb-2">Suggested Code:</h5>
            <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto text-sm">
              <code className="text-green-400">{suggestion.code}</code>
            </pre>
          </div>
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Lightbulb className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-white">
              <strong>Why this helps:</strong> {suggestion.explanation}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
