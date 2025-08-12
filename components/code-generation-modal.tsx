"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Loader2, CheckCircle, Copy, Download, Sparkles } from "lucide-react"
import { aiService, type CodeGenerationRequest, type GeneratedCode } from "@/lib/ai-service"

interface CodeGenerationModalProps {
  analysisResults?: any
  filename?: string
  trigger?: React.ReactNode
}

export function CodeGenerationModal({ analysisResults, filename, trigger }: CodeGenerationModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)

  // Form states
  const [fileType, setFileType] = useState("typescript")
  const [context, setContext] = useState("")
  const [requirements, setRequirements] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const request: CodeGenerationRequest = {
        context: context || `Generate code for ${filename || "the analyzed file"}`,
        fileType,
        requirements: requirements.split("\n").filter((r) => r.trim()),
        analysisResults,
      }

      const result = await aiService.generateCode(request)
      setGeneratedCode(result)
    } catch (error) {
      console.error("Code generation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCode = () => {
    if (!generatedCode) return

    const extension = fileType === "typescript" ? "ts" : fileType === "javascript" ? "js" : "py"
    const blob = new Blob([generatedCode.code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `generated-code.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gold text-black hover:bg-gold-light font-medium shadow-lg">
            <Code className="w-4 h-4 mr-2" />
            Generate Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-black border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span>AI Code Generation</span>
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Generate optimized code based on your analysis results and requirements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedCode ? (
            // Generation Form
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file-type" className="text-white">
                    Language/Framework
                  </Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger className="bg-black border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gray-700">
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="react">React Component</SelectItem>
                      <SelectItem value="nodejs">Node.js</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Based on Analysis</Label>
                  <div className="p-2 bg-gray-900 rounded border border-gray-700">
                    <span className="text-text-secondary text-sm">{filename || "Current analysis results"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context" className="text-white">
                  Context & Purpose
                </Label>
                <Input
                  id="context"
                  placeholder="e.g., User authentication service, Data processing utility..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-white">
                  Requirements (one per line)
                </Label>
                <Textarea
                  id="requirements"
                  placeholder={`Add error handling
Include input validation
Add logging
Create unit tests
Handle edge cases`}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500 h-32"
                />
              </div>

              {analysisResults && (
                <Alert className="bg-gold/10 border-gold/30">
                  <CheckCircle className="h-4 w-4 text-gold" />
                  <AlertDescription className="text-white">
                    <strong>Analysis Integration:</strong> The generated code will address the issues found in your
                    analysis, including security vulnerabilities, performance improvements, and missing test coverage.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading || !context.trim()}
                className="w-full bg-gold text-black hover:bg-gold-light font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Generated Code Results
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                <TabsTrigger value="code" className="text-white">
                  Generated Code
                </TabsTrigger>
                <TabsTrigger value="explanation" className="text-white">
                  Explanation
                </TabsTrigger>
                <TabsTrigger value="improvements" className="text-white">
                  Improvements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
                <Card className="bg-black border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Generated Code</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.code)}
                          className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadCode}
                          className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                      <code className="text-green-400">{generatedCode.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explanation" className="space-y-4">
                <Card className="bg-black border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Code Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary leading-relaxed">{generatedCode.explanation}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="improvements" className="space-y-4">
                <Card className="bg-black border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Applied Improvements</CardTitle>
                    <CardDescription className="text-text-secondary">
                      Based on your analysis results and requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {generatedCode.improvements.map((improvement, idx) => (
                        <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-white">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {generatedCode.testSuggestions && (
                  <Card className="bg-black border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Test Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {generatedCode.testSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-3 p-2 bg-blue-500/10 rounded border border-blue-500/30"
                          >
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Test</Badge>
                            <span className="text-white text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {generatedCode && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedCode(null)
                  setContext("")
                  setRequirements("")
                }}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Generate New Code
              </Button>
              <Button onClick={() => setOpen(false)} className="bg-gold text-black hover:bg-gold-light">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
