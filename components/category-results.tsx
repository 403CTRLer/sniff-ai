"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Shield,
  Bug,
  TestTube,
  Bot,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Code,
  Database,
  Sparkles,
  Lightbulb,
} from "lucide-react"
import { CodeGenerationModal } from "./code-generation-modal"
import { AISuggestionsModal } from "./ai-suggestions-modal"

interface CategoryResultsProps {
  results: any
  filename: string
}

interface CategoryData {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  count: number
  severity: string
  items: any[]
  score?: number
}

export function CategoryResults({ results, filename }: CategoryResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["security", "ai-detection"])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const categories: CategoryData[] = [
    {
      id: "security",
      title: "Security & Vulnerabilities",
      icon: <Shield className="w-5 h-5" />,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      count: results?.logicFlaws?.count || 0,
      severity: results?.logicFlaws?.severity || "Low",
      items: results?.logicFlaws?.issues || [],
    },
    {
      id: "performance",
      title: "Performance Issues",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      count: results?.apiMisuse?.count || 0,
      severity: "Medium",
      items: results?.apiMisuse?.issues || [],
    },
    {
      id: "ai-detection",
      title: "AI Generation Analysis",
      icon: <Bot className="w-5 h-5" />,
      color: "text-gold",
      bgColor: "bg-gold/10",
      borderColor: "border-gold/30",
      count: 1,
      severity: results?.aiGenerated?.confidence || "Medium",
      items: results?.aiGenerated?.patterns || [],
      score: results?.aiGenerated?.score,
    },
    {
      id: "code-quality",
      title: "Code Quality",
      icon: <Code className="w-5 h-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      count: 3,
      severity: "Medium",
      items: [
        { type: "Complexity", description: "Function complexity too high", line: 45 },
        { type: "Duplication", description: "Code duplication detected", line: 78 },
        { type: "Naming", description: "Inconsistent naming convention", line: 23 },
      ],
    },
    {
      id: "testing",
      title: "Test Coverage",
      icon: <TestTube className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      count: results?.testCoverage?.missing?.length || 0,
      severity: results?.testCoverage?.percentage > 80 ? "Good" : "Needs Improvement",
      items: results?.testCoverage?.missing || [],
      score: results?.testCoverage?.percentage,
    },
    {
      id: "api-usage",
      title: "API & Dependencies",
      icon: <Database className="w-5 h-5" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      count: results?.apiMisuse?.count || 0,
      severity: "Low",
      items: results?.apiMisuse?.issues || [],
    },
  ]

  const getSeverityBadge = (severity: string, count: number) => {
    if (count === 0) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Clean
        </Badge>
      )
    }

    const severityConfig = {
      Critical: "bg-red-500/20 text-red-400 border-red-500/30",
      High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Good: "bg-green-500/20 text-green-400 border-green-500/30",
      "Needs Improvement": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }

    return (
      <Badge className={severityConfig[severity] || severityConfig.Medium}>
        {count > 0 && <AlertTriangle className="w-3 h-3 mr-1" />}
        {severity}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Analysis Categories</h3>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-text-secondary">{filename}</div>
          <div className="flex space-x-2">
            <CodeGenerationModal
              analysisResults={results}
              filename={filename}
              trigger={
                <Button size="sm" className="bg-gold text-black hover:bg-gold-light font-medium shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
              }
            />
            <AISuggestionsModal
              analysisResults={results}
              filename={filename}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Get Suggestions
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {categories.map((category) => (
        <Card key={category.id} className={`border-l-4 ${category.borderColor} bg-black border-gray-800`}>
          <Collapsible open={expandedCategories.includes(category.id)} onOpenChange={() => toggleCategory(category.id)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-900 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <div className={category.color}>{category.icon}</div>
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{category.title}</CardTitle>
                      <CardDescription className="text-text-secondary">
                        {category.count} {category.count === 1 ? "issue" : "issues"} found
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {category.score !== undefined && (
                      <div className="text-right">
                        <div className={`text-lg font-bold ${category.color}`}>{category.score}%</div>
                        <Progress value={category.score} className="w-20 h-2 bg-dark-bg-tertiary" />
                      </div>
                    )}
                    {getSeverityBadge(category.severity, category.count)}
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                {category.count === 0 ? (
                  <div className="flex items-center justify-center py-8 text-green-400">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <span>No issues found in this category</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* AI Action Buttons for categories with issues */}
                    {category.count > 0 && (
                      <div className="flex space-x-2 mb-4">
                        <CodeGenerationModal
                          analysisResults={results}
                          filename={filename}
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gold/30 text-gold hover:bg-gold/10 bg-transparent font-medium"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Fix with AI
                            </Button>
                          }
                        />
                        <AISuggestionsModal
                          analysisResults={results}
                          filename={filename}
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-transparent font-medium"
                            >
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Get Help
                            </Button>
                          }
                        />
                      </div>
                    )}

                    {category.id === "ai-detection" && category.items.length > 0 && (
                      <div className="space-y-3">
                        <Alert className="bg-gold/10 border-gold/30">
                          <Bot className="h-4 w-4 text-gold" />
                          <AlertDescription className="text-white">
                            <strong>AI Detection Score: {category.score}%</strong> - Confidence: {category.severity}
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                          <h5 className="font-medium text-white">Detected Patterns:</h5>
                          <div className="grid gap-2">
                            {category.items.map((pattern, idx) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg border border-gray-700"
                              >
                                <div className="w-2 h-2 bg-gold rounded-full animate-subtle-pulse" />
                                <span className="text-text-primary">{pattern}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {category.id === "testing" && category.score !== undefined && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white">Test Coverage</span>
                          <span className="text-white font-bold">{category.score}%</span>
                        </div>
                        <Progress value={category.score} className="h-3 bg-dark-bg-tertiary" />
                        {category.items.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-white">Missing Coverage Areas:</h5>
                            <div className="flex flex-wrap gap-2">
                              {category.items.map((item, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-dark-border-light text-text-secondary"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(category.id === "security" || category.id === "performance" || category.id === "api-usage") &&
                      category.items.map((issue, idx) => (
                        <Alert
                          key={idx}
                          className={`${category.bgColor} border-l-4 ${category.borderColor} bg-black border-gray-800`}
                        >
                          <AlertTriangle className={`h-4 w-4 ${category.color}`} />
                          <AlertDescription className="text-white">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <strong className="text-white">
                                  {issue.type || issue.api || "Issue"}
                                  {issue.line && ` (Line ${issue.line})`}
                                </strong>
                                <Badge className={`${category.bgColor} ${category.color} border-0`}>
                                  {category.severity}
                                </Badge>
                              </div>
                              <p className="text-text-secondary">{issue.description || issue.issue}</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}

                    {category.id === "code-quality" &&
                      category.items.map((issue, idx) => (
                        <div key={idx} className="p-4 bg-gray-900 rounded-lg border border-blue-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Bug className="w-4 h-4 text-blue-400" />
                              <strong className="text-white">{issue.type}</strong>
                              {issue.line && (
                                <Badge variant="outline" className="border-dark-border-light text-text-secondary">
                                  Line {issue.line}
                                </Badge>
                              )}
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Medium</Badge>
                          </div>
                          <p className="text-text-secondary">{issue.description}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}
