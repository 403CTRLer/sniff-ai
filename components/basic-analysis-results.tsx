"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileCode, TrendingUp, AlertTriangle, CheckCircle, Code, Target } from "lucide-react"

interface BasicAnalysisResult {
  lines: number
  functions: number
  classes: number
  complexity: number
  issues: number
  score: number
  language: string
  imports: number
}

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  language?: string
  analysisResult?: BasicAnalysisResult
}

interface BasicAnalysisResultsProps {
  results: BasicAnalysisResult[]
  files: FileNode[]
}

export function BasicAnalysisResults({ results, files }: BasicAnalysisResultsProps) {
  if (results.length === 0) {
    return (
      <Card className="bg-black border-gray-800">
        <CardContent className="text-center py-12">
          <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">No Analysis Results</h3>
          <p className="text-text-secondary">Select files and run analysis to see results here</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary statistics
  const totalLines = results.reduce((sum, r) => sum + r.lines, 0)
  const totalFunctions = results.reduce((sum, r) => sum + r.functions, 0)
  const totalClasses = results.reduce((sum, r) => sum + r.classes, 0)
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0)
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
  const averageComplexity = Math.round(results.reduce((sum, r) => sum + r.complexity, 0) / results.length)

  // Language distribution
  const languageStats = results.reduce(
    (acc, result) => {
      acc[result.language] = (acc[result.language] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const languageData = Object.entries(languageStats).map(([language, count]) => ({
    name: language,
    value: count,
    percentage: Math.round((count / results.length) * 100),
  }))

  // Score distribution
  const scoreRanges = {
    Excellent: results.filter((r) => r.score >= 90).length,
    Good: results.filter((r) => r.score >= 70 && r.score < 90).length,
    Fair: results.filter((r) => r.score >= 50 && r.score < 70).length,
    Poor: results.filter((r) => r.score < 50).length,
  }

  const scoreData = Object.entries(scoreRanges)
    .filter(([, count]) => count > 0)
    .map(([range, count]) => ({
      name: range,
      value: count,
      percentage: Math.round((count / results.length) * 100),
    }))

  // File complexity data for chart
  const complexityData = files
    .filter((f) => f.analysisResult)
    .map((file) => ({
      name: file.name.length > 15 ? file.name.substring(0, 15) + "..." : file.name,
      complexity: file.analysisResult!.complexity,
      score: file.analysisResult!.score,
      issues: file.analysisResult!.issues,
    }))
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 10)

  const COLORS = ["#D4AF37", "#E6C547", "#B8941F", "#F4D03F", "#F7DC6F"]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 70) return "text-yellow-400"
    if (score >= 50) return "text-orange-400"
    return "text-red-400"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (score >= 70) return <Target className="w-4 h-4 text-yellow-400" />
    return <AlertTriangle className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4" />
              <span>Total Lines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalLines.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">{results.length} files analyzed</p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Functions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{totalFunctions}</div>
            <p className="text-xs text-text-secondary">{totalClasses} classes</p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Avg Complexity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{averageComplexity}</div>
            <p className="text-xs text-text-secondary">
              {averageComplexity <= 5 ? "Low" : averageComplexity <= 10 ? "Medium" : "High"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Issues Found</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{totalIssues}</div>
            <p className="text-xs text-text-secondary">
              {totalIssues === 0 ? "Clean code!" : `${Math.round(totalIssues / results.length)} avg per file`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Score */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            {getScoreIcon(averageScore)}
            <span>Overall Code Quality Score</span>
          </CardTitle>
          <CardDescription className="text-text-secondary">Average score across all analyzed files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}/100</div>
            <div className="flex-1">
              <Progress value={averageScore} className="h-4 bg-gray-800" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Language Distribution</CardTitle>
            <CardDescription className="text-text-secondary">Files by programming language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {languageData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-white">
                    {item.name} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Quality Score Distribution</CardTitle>
            <CardDescription className="text-text-secondary">Files by quality score range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(scoreRanges).map(([range, count]) => {
                const percentage = Math.round((count / results.length) * 100)
                const color =
                  range === "Excellent"
                    ? "bg-green-500"
                    : range === "Good"
                      ? "bg-yellow-500"
                      : range === "Fair"
                        ? "bg-orange-500"
                        : "bg-red-500"

                return (
                  <div key={range} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{range}</span>
                      <span className="text-gray-400">
                        {count} files ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complexity Chart */}
      {complexityData.length > 0 && (
        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">File Complexity Analysis</CardTitle>
            <CardDescription className="text-text-secondary">
              Top 10 most complex files (higher is more complex)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complexityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#9CA3AF" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="complexity" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Details */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">File Analysis Details</CardTitle>
          <CardDescription className="text-text-secondary">Detailed breakdown of each analyzed file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files
              .filter((f) => f.analysisResult)
              .map((file) => (
                <div key={file.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="font-medium text-white">{file.name}</h4>
                        <p className="text-sm text-gray-400">{file.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(file.analysisResult!.score)}
                      <span className={`font-bold ${getScoreColor(file.analysisResult!.score)}`}>
                        {file.analysisResult!.score}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-2 bg-black rounded border border-gray-700">
                      <div className="text-lg font-bold text-white">{file.analysisResult!.lines}</div>
                      <div className="text-xs text-gray-400">Lines</div>
                    </div>
                    <div className="text-center p-2 bg-black rounded border border-gray-700">
                      <div className="text-lg font-bold text-blue-400">{file.analysisResult!.functions}</div>
                      <div className="text-xs text-gray-400">Functions</div>
                    </div>
                    <div className="text-center p-2 bg-black rounded border border-gray-700">
                      <div className="text-lg font-bold text-purple-400">{file.analysisResult!.complexity}</div>
                      <div className="text-xs text-gray-400">Complexity</div>
                    </div>
                    <div className="text-center p-2 bg-black rounded border border-gray-700">
                      <div className="text-lg font-bold text-red-400">{file.analysisResult!.issues}</div>
                      <div className="text-xs text-gray-400">Issues</div>
                    </div>
                  </div>

                  {file.analysisResult!.issues > 0 && (
                    <Alert className="mt-3 bg-yellow-500/10 border-yellow-500/30">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <AlertDescription className="text-white">
                        <strong>{file.analysisResult!.issues} potential issues found.</strong> Consider reviewing this
                        file for improvements.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
