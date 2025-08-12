"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Code,
  Play,
  Loader2,
  Bot,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Target,
} from "lucide-react"

interface AIDetectionResult {
  probability: number
  confidence: "low" | "medium" | "high"
  indicators: string[]
  reasoning: string
}

interface CodeIssue {
  type: "naming" | "complexity" | "length" | "structure" | "security" | "performance"
  severity: "low" | "medium" | "high" | "critical"
  line: number
  column?: number
  message: string
  rule: string
  suggestion: string
}

interface OptimizationSuggestion {
  type: "performance" | "readability" | "maintainability" | "security"
  priority: "low" | "medium" | "high"
  title: string
  description: string
  before: string
  after: string
  impact: string
  effort: "low" | "medium" | "high"
}

interface UnifiedAnalysisResult {
  success: boolean
  analysisId: string
  timestamp: string
  code: {
    language: string
    lines: number
    characters: number
    functions: number
    classes: number
  }
  aiDetection: AIDetectionResult
  issues: CodeIssue[]
  suggestions: OptimizationSuggestion[]
  overallScore: number
  summary: {
    totalIssues: number
    criticalIssues: number
    aiLikelihood: number
    optimizationPotential: number
  }
}

export function UnifiedCodeAnalyzer() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [filename, setFilename] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<UnifiedAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview"]))

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze")
      return
    }

    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/analyze/unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          filename: filename || `code.${getFileExtension(language)}`,
          options: {
            includeAiDetection: true,
            includeFlagging: true,
            includeSuggestions: true,
            includeOptimization: true,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setExpandedSections(new Set(["overview", "ai-detection"]))
      } else {
        setError(data.error || "Analysis failed")
      }
    } catch (err) {
      setError("Failed to analyze code. Please try again.")
      console.error("Analysis error:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  const getFileExtension = (lang: string) => {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
    }
    return extensions[lang] || "txt"
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-orange-400"
    return "text-red-400"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />
    if (score >= 60) return <Target className="w-5 h-5 text-yellow-400" />
    return <AlertTriangle className="w-5 h-5 text-red-400" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadResults = () => {
    if (!result) return

    const dataStr = JSON.stringify(result, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analysis-${result.analysisId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Code className="w-5 h-5" />
            <span>Unified Code Analyzer</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Submit code for AI detection, issue flagging, and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-white font-medium">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="javascript" className="text-white hover:bg-gray-800">
                    JavaScript
                  </SelectItem>
                  <SelectItem value="typescript" className="text-white hover:bg-gray-800">
                    TypeScript
                  </SelectItem>
                  <SelectItem value="python" className="text-white hover:bg-gray-800">
                    Python
                  </SelectItem>
                  <SelectItem value="java" className="text-white hover:bg-gray-800">
                    Java
                  </SelectItem>
                  <SelectItem value="cpp" className="text-white hover:bg-gray-800">
                    C++
                  </SelectItem>
                  <SelectItem value="c" className="text-white hover:bg-gray-800">
                    C
                  </SelectItem>
                  <SelectItem value="csharp" className="text-white hover:bg-gray-800">
                    C#
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-white font-medium">
                Filename (optional)
              </Label>
              <Input
                id="filename"
                placeholder={`code.${getFileExtension(language)}`}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-white font-medium">
              Code
            </Label>
            <Textarea
              id="code"
              placeholder="Paste your code here for analysis..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-64 font-mono text-sm focus:border-gold focus:ring-gold"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !code.trim()}
            className="w-full bg-gold text-black hover:bg-gold-light font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Code...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Overview */}
          <Card className="bg-black border-gray-800">
            <Collapsible open={expandedSections.has("overview")} onOpenChange={() => toggleSection("overview")}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Zap className="w-5 h-5" />
                      <span>Analysis Overview</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getScoreIcon(result.overallScore)}
                        <span className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
                          {result.overallScore}/100
                        </span>
                      </div>
                      {expandedSections.has("overview") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-white">{result.code.lines}</div>
                      <div className="text-sm text-gray-400">Lines</div>
                    </div>
                    <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-blue-400">{result.code.functions}</div>
                      <div className="text-sm text-gray-400">Functions</div>
                    </div>
                    <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-purple-400">{result.code.classes}</div>
                      <div className="text-sm text-gray-400">Classes</div>
                    </div>
                    <div className="text-center p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-gold">{result.code.language}</div>
                      <div className="text-sm text-gray-400">Language</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">AI Likelihood</span>
                        <span className="text-gold">{result.summary.aiLikelihood}%</span>
                      </div>
                      <Progress value={result.summary.aiLikelihood} className="h-2 bg-gray-800" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">Issues Found</span>
                        <span className="text-red-400">{result.summary.totalIssues}</span>
                      </div>
                      <Progress value={Math.min(result.summary.totalIssues * 10, 100)} className="h-2 bg-gray-800" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">Optimization Potential</span>
                        <span className="text-blue-400">{result.summary.optimizationPotential}</span>
                      </div>
                      <Progress
                        value={Math.min(result.summary.optimizationPotential * 15, 100)}
                        className="h-2 bg-gray-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* AI Detection */}
          <Card className="bg-black border-gray-800">
            <Collapsible open={expandedSections.has("ai-detection")} onOpenChange={() => toggleSection("ai-detection")}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Bot className="w-5 h-5" />
                      <span>AI Generation Detection</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-gold/20 text-gold border-gold/30">
                        {result.aiDetection.probability}% AI Likelihood
                      </Badge>
                      <Badge
                        className={`${result.aiDetection.confidence === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" : result.aiDetection.confidence === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}
                      >
                        {result.aiDetection.confidence} confidence
                      </Badge>
                      {expandedSections.has("ai-detection") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="bg-gold/10 border-gold/30">
                      <Bot className="h-4 w-4 text-gold" />
                      <AlertDescription className="text-white">
                        <strong>Analysis:</strong> {result.aiDetection.reasoning}
                      </AlertDescription>
                    </Alert>

                    {result.aiDetection.indicators.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-3">Detected Indicators:</h4>
                        <div className="space-y-2">
                          {result.aiDetection.indicators.map((indicator, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-gray-900 rounded-lg border border-gray-800"
                            >
                              <div className="w-2 h-2 bg-gold rounded-full" />
                              <span className="text-white">{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Issues */}
          <Card className="bg-black border-gray-800">
            <Collapsible open={expandedSections.has("issues")} onOpenChange={() => toggleSection("issues")}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Code Issues ({result.issues.length})</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      {result.summary.criticalIssues > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {result.summary.criticalIssues} Critical
                        </Badge>
                      )}
                      {expandedSections.has("issues") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.issues.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                      <h3 className="text-lg font-medium text-white mb-2">No Issues Found</h3>
                      <p className="text-gray-400">Your code looks clean!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.issues.map((issue, index) => (
                        <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <div>
                                <h4 className="font-medium text-white">{issue.message}</h4>
                                <p className="text-sm text-gray-400">
                                  Line {issue.line} • {issue.rule}
                                </p>
                              </div>
                            </div>
                            <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{issue.suggestion}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {issue.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Optimization Suggestions */}
          <Card className="bg-black border-gray-800">
            <Collapsible open={expandedSections.has("suggestions")} onOpenChange={() => toggleSection("suggestions")}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Lightbulb className="w-5 h-5" />
                      <span>Optimization Suggestions ({result.suggestions.length})</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      {expandedSections.has("suggestions") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                      <h3 className="text-lg font-medium text-white mb-2">No Suggestions</h3>
                      <p className="text-gray-400">Your code is well optimized!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {result.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                              <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-white">{suggestion.title}</h4>
                                <p className="text-sm text-gray-400 mt-1">{suggestion.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority} priority
                              </Badge>
                              <Badge variant="outline" className="border-gray-600 text-gray-400">
                                {suggestion.effort} effort
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-white mb-2">Before:</h5>
                              <pre className="bg-black p-3 rounded border border-gray-700 text-sm overflow-x-auto">
                                <code className="text-red-300">{suggestion.before}</code>
                              </pre>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-white mb-2">After:</h5>
                              <pre className="bg-black p-3 rounded border border-gray-700 text-sm overflow-x-auto">
                                <code className="text-green-300">{suggestion.after}</code>
                              </pre>
                            </div>
                          </div>

                          <Alert className="mt-3 bg-blue-500/10 border-blue-500/30">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                            <AlertDescription className="text-white">
                              <strong>Impact:</strong> {suggestion.impact}
                            </AlertDescription>
                          </Alert>

                          <div className="flex items-center space-x-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(suggestion.after)}
                              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Solution
                            </Button>
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {suggestion.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Analysis ID: {result.analysisId} • {new Date(result.timestamp).toLocaleString()}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
              <Button
                variant="outline"
                onClick={downloadResults}
                className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
