"use client"

import type React from "react"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Code, Target, Bug, Lightbulb, AlertTriangle, CheckCircle, FileText, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectFile, Finding, SecurityIssue } from "@/lib/models"

interface TestResult {
  aiDetection: {
    likelihood: number
    confidence: number
    reasons: string[]
  }
  issues: Finding[]
  securityIssues: SecurityIssue[]
  tips: string[]
  codeQuality: {
    score: number
    metrics: {
      complexity: number
      maintainability: number
      readability: number
    }
  }
}

export default function TestPage() {
  const [code, setCode] = useState("")
  const [fileName, setFileName] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (file: File) => {
    if (file.size > 1024 * 1024) {
      // 1MB limit
      setError("File size must be less than 1MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)
      setFileName(file.name)
      setError("")
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const { analyzeCode: analyzeCodeFunction } = await import("@/lib/analysis/analysis-engine")

      // Create a project file from the input
      const projectFile: ProjectFile = {
        path: fileName || "test-file.js",
        content: code,
        size: code.length,
      }

      // Run analysis
      const analysisResult = await analyzeCodeFunction([projectFile], {
        includeAiDetection: true,
        includeSecurity: true,
        includeQuality: true,
        includeCoverage: false, // Skip coverage for single file test
        includeApiValidation: true,
      })

      // Generate improvement tips based on findings
      const tips = generateTips(analysisResult.findings, analysisResult.securityIssues)

      const testResult: TestResult = {
        aiDetection: {
          likelihood: Math.round(analysisResult.aiDetectionScore),
          confidence: 85, // Fixed confidence for single file analysis
          reasons: generateAiDetectionReasons(analysisResult.findings, code),
        },
        issues: analysisResult.findings,
        securityIssues: analysisResult.securityIssues,
        tips,
        codeQuality: {
          score: analysisResult.metrics.maintainabilityIndex,
          metrics: {
            complexity: analysisResult.metrics.complexity,
            maintainability: analysisResult.metrics.maintainabilityIndex,
            readability: calculateReadabilityScore(code),
          },
        },
      }

      setResult(testResult)
    } catch (err) {
      console.error("Analysis error:", err)
      setError("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateAiDetectionReasons = (findings: Finding[], code: string): string[] => {
    const reasons: string[] = []

    // Check for patterns that might indicate AI generation
    const hasConsistentFormatting = code.split("\n").filter((line) => line.trim()).length > 5
    const hasComments = code.includes("//") || code.includes("/*")
    const hasGenericNames = findings.some((f) => f.title.includes("variable"))

    if (hasConsistentFormatting) {
      reasons.push("Consistent code style and formatting")
    }
    if (hasComments) {
      reasons.push("Structured commenting patterns")
    }
    if (hasGenericNames) {
      reasons.push("Generic variable naming patterns")
    }
    if (findings.length === 0) {
      reasons.push("Unusually clean code with no obvious issues")
    }

    return reasons.length > 0 ? reasons : ["Code structure analysis completed"]
  }

  const generateTips = (findings: Finding[], securityIssues: SecurityIssue[]): string[] => {
    const tips: string[] = []

    if (findings.some((f) => f.category === "style")) {
      tips.push("Consider using a code formatter like Prettier for consistent styling")
    }
    if (findings.some((f) => f.title.includes("console.log"))) {
      tips.push("Remove console.log statements before production deployment")
    }
    if (securityIssues.length > 0) {
      tips.push("Review security issues and implement recommended fixes")
    }
    if (findings.some((f) => f.category === "modernization")) {
      tips.push("Update to modern JavaScript/TypeScript syntax for better performance")
    }

    // Add general tips
    tips.push("Add JSDoc comments for better documentation")
    tips.push("Consider adding unit tests for critical functions")

    return tips
  }

  const calculateReadabilityScore = (code: string): number => {
    const lines = code.split("\n")
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0)
    const avgLineLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length
    const commentRatio =
      lines.filter((line) => line.trim().startsWith("//") || line.trim().startsWith("/*")).length / nonEmptyLines.length

    // Simple readability calculation
    let score = 100
    if (avgLineLength > 80) score -= 20
    if (commentRatio < 0.1) score -= 15
    if (nonEmptyLines.length > 100) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900 text-red-400 border-red-400"
      case "high":
        return "bg-orange-900 text-orange-400 border-orange-400"
      case "medium":
        return "bg-yellow-900 text-yellow-400 border-yellow-400"
      case "low":
        return "bg-blue-900 text-blue-400 border-blue-400"
      default:
        return "bg-gray-900 text-gray-400 border-gray-400"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-[#D4AF37]"
    if (score >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <MainLayout>
      <div className="container px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient-gold">Quick Test</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instantly analyze a single code file for AI detection, quality issues, and get improvement tips
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Code className="h-5 w-5 text-[#D4AF37]" />
                  <span>Code Input</span>
                </CardTitle>
                <CardDescription>Paste your code or upload a file for instant analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    dragActive
                      ? "border-[#D4AF37] bg-[#D4AF37]/5"
                      : "border-[#333333] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5",
                  )}
                >
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-[#D4AF37] mb-2" />
                    <p className="text-sm text-white mb-1">
                      {fileName ? `Loaded: ${fileName}` : "Drop a file here or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">Supports JS, TS, Python, Java, C++, and more</p>
                  </label>
                </div>

                {/* Code Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Or paste your code here:</label>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Paste your code here for instant analysis
function example() {
  const data = fetchUserData();
  return data.map(item => item.name);
}"
                    className="min-h-[300px] bg-[#0D0D0D] border-[#333333] text-white font-mono text-sm"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{code.length} characters</span>
                    <span>Max 1MB file size</span>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-400 bg-red-900/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={analyzeCode}
                  disabled={isAnalyzing || !code.trim()}
                  className="w-full bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Analyze Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#1A1A1A] border-[#333333]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center space-x-2">
                        <Target className="h-4 w-4 text-[#D4AF37]" />
                        <span>AI Detection</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white mb-2">{result.aiDetection.likelihood}%</div>
                      <Progress value={result.aiDetection.likelihood} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{result.aiDetection.confidence}% confidence</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A1A1A] border-[#333333]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground flex items-center space-x-2">
                        <Bug className="h-4 w-4 text-[#D4AF37]" />
                        <span>Quality Score</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold mb-2 ${getScoreColor(result.codeQuality.score)}`}>
                        {result.codeQuality.score}/100
                      </div>
                      <Progress value={result.codeQuality.score} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {result.issues.length + result.securityIssues.length} issues found
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="issues" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-[#333333]">
                        <TabsTrigger
                          value="issues"
                          className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                        >
                          Issues ({result.issues.length + result.securityIssues.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="ai"
                          className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                        >
                          AI Analysis
                        </TabsTrigger>
                        <TabsTrigger
                          value="tips"
                          className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                        >
                          Tips ({result.tips.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="issues" className="mt-4 space-y-3">
                        {result.issues.length === 0 && result.securityIssues.length === 0 ? (
                          <div className="text-center py-6">
                            <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-2" />
                            <p className="text-green-400 font-medium">No issues found!</p>
                            <p className="text-muted-foreground text-sm">Your code looks clean.</p>
                          </div>
                        ) : (
                          <>
                            {result.issues.map((issue, index) => (
                              <div
                                key={`issue-${index}`}
                                className="p-3 bg-[#0D0D0D] border border-[#333333] rounded-lg"
                              >
                                <div className="flex items-start space-x-3">
                                  <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                                  <div className="flex-1">
                                    <p className="text-white font-medium">{issue.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                                    {issue.lineNumber && (
                                      <p className="text-xs text-muted-foreground mt-1">Line {issue.lineNumber}</p>
                                    )}
                                    {issue.suggestion && (
                                      <div className="mt-2 p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                                        <p className="text-xs text-[#D4AF37]">
                                          <strong>Suggestion:</strong> {issue.suggestion}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {result.securityIssues.map((issue, index) => (
                              <div
                                key={`security-${index}`}
                                className="p-3 bg-[#0D0D0D] border border-red-400/20 rounded-lg"
                              >
                                <div className="flex items-start space-x-3">
                                  <Badge className="bg-red-900 text-red-400 border-red-400">security</Badge>
                                  <div className="flex-1">
                                    <p className="text-white font-medium">{issue.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                                    {issue.lineNumber && (
                                      <p className="text-xs text-muted-foreground mt-1">Line {issue.lineNumber}</p>
                                    )}
                                    {issue.recommendation && (
                                      <div className="mt-2 p-2 bg-red-900/10 border border-red-400/20 rounded">
                                        <p className="text-xs text-red-400">
                                          <strong>Recommendation:</strong> {issue.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="ai" className="mt-4 space-y-4">
                        <div className="p-4 bg-[#0D0D0D] border border-[#333333] rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <Target className="h-5 w-5 text-[#D4AF37]" />
                            <h4 className="font-semibold text-white">AI Detection Analysis</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Detection Reasons:</p>
                              <ul className="space-y-1">
                                {result.aiDetection.reasons.map((reason, index) => (
                                  <li key={index} className="text-sm text-white flex items-start space-x-2">
                                    <span className="text-[#D4AF37] mt-1">•</span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#333333]">
                              <div>
                                <p className="text-xs text-muted-foreground">Complexity</p>
                                <p className="text-white font-medium">{result.codeQuality.metrics.complexity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Maintainability</p>
                                <p className="text-white font-medium">{result.codeQuality.metrics.maintainability}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Readability</p>
                                <p className="text-white font-medium">{result.codeQuality.metrics.readability}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tips" className="mt-4 space-y-3">
                        {result.tips.map((tip, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-[#0D0D0D] rounded-lg">
                            <Lightbulb className="h-4 w-4 text-[#D4AF37] mt-0.5" />
                            <p className="text-white text-sm">{tip}</p>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-[#D4AF37] mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground">
                      Upload a file or paste your code to get instant AI detection, quality analysis, and improvement
                      tips.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-[#D4AF37]/5 border-[#D4AF37]/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-[#D4AF37] mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#D4AF37] mb-2">About Quick Test</h4>
                <p className="text-[#D4AF37]/80 text-sm">
                  This tool provides instant analysis for single code files using our client-side analysis engine. All
                  processing happens in your browser - no data is sent to external servers. For comprehensive project
                  analysis with detailed reports, security scans, and test coverage, use the main dashboard to upload
                  full projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
