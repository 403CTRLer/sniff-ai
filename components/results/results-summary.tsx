import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Shield, Bug, TestTube, AlertTriangle, CheckCircle } from "lucide-react"

interface ResultsSummaryProps {
  results: any // broaden type to be resilient to differing shapes across the app
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const issues = results?.issues || []
  const aiDetection = results?.aiDetection || { likelihood: 0, confidence: 0, patterns: [] }

  // Support both 'security' and 'securityIssues'
  const securityIssues = results?.security || results?.securityIssues || []

  // Support coverage from either aggregated object or engine array
  const rawCoverage = results?.coverage ?? results?.testCoverage
  let coverageObj: { overall: number; byFile?: any; filesCovered?: number; totalFiles?: number } = {
    overall: 0,
    byFile: [],
  }

  if (rawCoverage && typeof rawCoverage === "object" && "overall" in rawCoverage) {
    coverageObj = rawCoverage
  } else if (Array.isArray(rawCoverage)) {
    const totalFiles = rawCoverage.length
    const overall =
      totalFiles > 0
        ? Math.round(
            rawCoverage.reduce((acc: number, c: any) => acc + Number(c.coveragePercentage ?? 0), 0) / totalFiles,
          )
        : 0
    coverageObj = {
      overall,
      byFile: rawCoverage,
      totalFiles,
    }
  }

  const coverage = {
    overall: Number(coverageObj.overall) || 0,
    byFile: coverageObj.byFile || [],
  }

  const apiIssues = results?.apiIssues || []

  const criticalIssues = issues.filter((issue) => issue.severity === "critical").length
  const highIssues = issues.filter((issue) => issue.severity === "high").length
  const mediumIssues = issues.filter((issue) => issue.severity === "medium").length
  const lowIssues = issues.filter((issue) => issue.severity === "low").length

  const getAiLikelihoodColor = (likelihood: number) => {
    if (likelihood >= 80) return "text-red-400"
    if (likelihood >= 60) return "text-yellow-400"
    if (likelihood >= 40) return "text-[#D4AF37]"
    return "text-green-400"
  }

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return "text-green-400"
    if (coverage >= 60) return "text-[#D4AF37]"
    if (coverage >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  const aiLikelihood = aiDetection.likelihood > 1 ? aiDetection.likelihood : Math.round(aiDetection.likelihood * 100)
  const aiConfidence = aiDetection.confidence > 1 ? aiDetection.confidence : Math.round(aiDetection.confidence * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* AI Detection */}
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">AI Detection</CardTitle>
          <Target className="h-4 w-4 text-[#D4AF37]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-2">{aiLikelihood}%</div>
          <div className="space-y-2">
            <Progress value={aiLikelihood} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className={getAiLikelihoodColor(aiLikelihood)}>
                {aiLikelihood >= 80
                  ? "High likelihood"
                  : aiLikelihood >= 60
                    ? "Medium likelihood"
                    : aiLikelihood >= 40
                      ? "Low likelihood"
                      : "Very low likelihood"}
              </span>
              <span className="text-muted-foreground">{aiConfidence}% confidence</span>
            </div>
          </div>
          {aiDetection.patterns && aiDetection.patterns.length > 0 && (
            <div className="mt-3">
              <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37] text-xs">
                {aiDetection.patterns.length} patterns detected
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues Summary */}
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Issues Found</CardTitle>
          <Bug className="h-4 w-4 text-[#D4AF37]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-2">{issues.length}</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs text-muted-foreground">Critical</span>
              </div>
              <span className="text-xs text-red-400 font-medium">{criticalIssues}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              <span className="text-xs text-orange-400 font-medium">{highIssues}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <span className="text-xs text-yellow-400 font-medium">{mediumIssues}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
              <span className="text-xs text-blue-400 font-medium">{lowIssues}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Coverage */}
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Test Coverage</CardTitle>
          <TestTube className="h-4 w-4 text-[#D4AF37]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-2">{coverage.overall}%</div>
          <div className="space-y-2">
            <Progress value={coverage.overall} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className={getCoverageColor(coverage.overall)}>
                {coverage.overall >= 80
                  ? "Excellent"
                  : coverage.overall >= 60
                    ? "Good"
                    : coverage.overall >= 40
                      ? "Fair"
                      : "Poor"}
              </span>
              <span className="text-muted-foreground">{coverage.byFile?.length || 0} files analyzed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Issues */}
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Security Issues</CardTitle>
          <Shield className="h-4 w-4 text-[#D4AF37]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-2">{securityIssues.length}</div>
          <div className="space-y-2">
            {securityIssues.length === 0 ? (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">No security issues found</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Security vulnerabilities detected</span>
              </div>
            )}
          </div>
          {apiIssues.length > 0 && (
            <div className="mt-3">
              <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37] text-xs">
                {apiIssues.length} API issues
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
