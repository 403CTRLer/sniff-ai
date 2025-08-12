"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitCommit, Shield, User, FileText, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react"

interface ProjectAnalysisProps {
  projectId: string
}

export function ProjectAnalysis({ projectId }: ProjectAnalysisProps) {
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalysis = async () => {
    try {
      setError(null)
      // Mock data for demo
      const mockData = {
        name: "Sample Project",
        source: "https://github.com/user/repo",
        totalFiles: 45,
        totalLines: 12500,
        language: "TypeScript",
        overallHealth: {
          score: 85,
          aiGeneratedPercentage: 15,
          testCoverage: 78,
          securityScore: 92,
        },
        lastCommit: {
          message: "Add user authentication system",
          author: "John Doe",
          date: "2024-01-15",
          riskScore: 35,
          filesChanged: 8,
          linesAdded: 245,
          linesRemoved: 67,
          suggestions: [
            {
              type: "security",
              severity: "high",
              title: "Missing input validation",
              description: "User input should be validated before processing",
              file: "src/auth/login.ts",
              line: 42,
              suggestion: "Add input validation using a schema validator",
              codeExample: "const schema = z.object({ email: z.string().email() })",
            },
          ],
        },
        fileAnalyses: [
          {
            id: "1",
            filename: "auth.ts",
            size: "2.3 KB",
            language: "TypeScript",
            results: {
              overallScore: 88,
              aiGenerated: { score: 12 },
              logicFlaws: { count: 1 },
              apiMisuse: { count: 0 },
              testCoverage: { percentage: 85 },
            },
          },
        ],
        trends: {
          commitFrequency: [5, 8, 12, 6, 9],
          qualityTrend: [75, 78, 82, 85],
          testCoverageTrend: [65, 70, 75, 78],
        },
      }
      setAnalysis(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analysis")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [projectId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalysis()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-bg-tertiary rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-dark-bg-tertiary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-white">{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{analysis.name}</h2>
          <p className="text-text-secondary">
            {analysis.totalFiles} files • {analysis.totalLines.toLocaleString()} lines • {analysis.language}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
          >
            <a href={analysis.source} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Source
            </a>
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500 bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{analysis.overallHealth.score}/100</div>
            <Progress value={analysis.overallHealth.score} className="mt-2 bg-dark-bg-tertiary" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gold bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">AI Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">{analysis.overallHealth.aiGeneratedPercentage}%</div>
            <Progress value={analysis.overallHealth.aiGeneratedPercentage} className="mt-2 bg-dark-bg-tertiary" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Test Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{analysis.overallHealth.testCoverage}%</div>
            <Progress value={analysis.overallHealth.testCoverage} className="mt-2 bg-dark-bg-tertiary" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{analysis.overallHealth.securityScore}/100</div>
            <Progress value={analysis.overallHealth.securityScore} className="mt-2 bg-dark-bg-tertiary" />
          </CardContent>
        </Card>
      </div>

      {/* Last Commit Analysis */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <GitCommit className="w-5 h-5" />
            <span>Latest Commit Analysis</span>
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Analysis of the most recent commit with suggested improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Commit Info */}
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gold-gradient rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="font-medium text-white">{analysis.lastCommit.message}</div>
                  <div className="text-sm text-text-secondary">
                    by {analysis.lastCommit.author} • {new Date(analysis.lastCommit.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-secondary">Risk Score</div>
                <div
                  className={`text-lg font-bold ${
                    analysis.lastCommit.riskScore > 70
                      ? "text-red-400"
                      : analysis.lastCommit.riskScore > 40
                        ? "text-yellow-400"
                        : "text-green-400"
                  }`}
                >
                  {analysis.lastCommit.riskScore}/100
                </div>
              </div>
            </div>

            {/* Commit Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="text-lg font-bold text-white">{analysis.lastCommit.filesChanged}</div>
                <div className="text-sm text-text-secondary">Files Changed</div>
              </div>
              <div className="text-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="text-lg font-bold text-green-400">+{analysis.lastCommit.linesAdded}</div>
                <div className="text-sm text-text-secondary">Lines Added</div>
              </div>
              <div className="text-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="text-lg font-bold text-red-400">-{analysis.lastCommit.linesRemoved}</div>
                <div className="text-sm text-text-secondary">Lines Removed</div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
              <h4 className="font-medium text-white">Suggested Improvements</h4>
              {analysis.lastCommit.suggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500 bg-black border-gray-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-4 h-4 text-orange-400 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-white">{suggestion.title}</h5>
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              {suggestion.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">{suggestion.description}</p>
                          <div className="text-xs text-text-muted mb-2">
                            {suggestion.file}:{suggestion.line}
                          </div>
                          <div className="bg-dark-bg-tertiary p-3 rounded text-sm border border-dark-border">
                            <strong className="text-white">Suggestion:</strong>{" "}
                            <span className="text-text-secondary">{suggestion.suggestion}</span>
                          </div>
                          {suggestion.codeExample && (
                            <div className="mt-2 bg-black p-3 rounded text-sm border border-gray-700">
                              <pre className="text-green-400">{suggestion.codeExample}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
                      >
                        Apply Fix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Analysis */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">File Analysis</CardTitle>
          <CardDescription className="text-text-secondary">Individual file analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.fileAnalyses.map((file) => (
              <Card key={file.id} className="border-l-4 border-l-blue-500 bg-black border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="font-medium text-white">{file.filename}</h4>
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <span>{file.size}</span>
                          <span>•</span>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{file.language}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="font-bold text-green-400">{file.results.overallScore}/100</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border">
                      <div className="text-lg font-bold text-gold">{file.results.aiGenerated.score}%</div>
                      <div className="text-xs text-text-secondary">AI Generated</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border">
                      <div className="text-lg font-bold text-red-400">{file.results.logicFlaws.count}</div>
                      <div className="text-xs text-text-secondary">Logic Flaws</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border">
                      <div className="text-lg font-bold text-orange-400">{file.results.apiMisuse.count}</div>
                      <div className="text-xs text-text-secondary">API Issues</div>
                    </div>
                    <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border">
                      <div className="text-lg font-bold text-green-400">{file.results.testCoverage.percentage}%</div>
                      <div className="text-xs text-text-secondary">Test Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
