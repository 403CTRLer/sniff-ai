"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Shield,
  Bug,
  FileText,
  BarChart3,
} from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ResultsPage({ params }: { params: { id: string; runId: string } }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const { data: results, isLoading } = useQuery({
    queryKey: ["analysis-results", params.id, params.runId],
    queryFn: () => apiService.getAnalysisResults(params.id, params.runId),
  })

  const handleDownload = async () => {
    try {
      const blob = await apiService.downloadResults(params.id, params.runId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analysis-results-${params.runId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: "Download started",
        description: "Analysis results are being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download results. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleFinding = (findingId: string) => {
    const newExpanded = new Set(expandedFindings)
    if (newExpanded.has(findingId)) {
      newExpanded.delete(findingId)
    } else {
      newExpanded.add(findingId)
    }
    setExpandedFindings(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600/10 text-red-600 border-red-600/20"
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="w-4 h-4" />
      case "quality":
        return <Bug className="w-4 h-4" />
      case "performance":
        return <BarChart3 className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const filteredFindings =
    results?.findings?.filter((finding: any) => {
      const matchesSearch =
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.file.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter
      const matchesCategory = categoryFilter === "all" || finding.category === categoryFilter
      return matchesSearch && matchesSeverity && matchesCategory
    }) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Results not found</h1>
          <p className="text-muted-foreground mb-4">The analysis results could not be loaded.</p>
          <Button asChild>
            <Link href={`/projects/${params.id}`}>Back to Project</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${params.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analysis Results</h1>
              <p className="text-muted-foreground">Comprehensive code analysis report</p>
            </div>
          </div>
          <Button onClick={handleDownload} className="bg-gold text-black hover:bg-gold-light">
            <Download className="w-4 h-4 mr-2" />
            Download Results
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.summary.totalFindings}</div>
              <p className="text-xs text-muted-foreground">across {results.summary.filesAnalyzed} files</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{results.summary.highSeverity}</div>
              <p className="text-xs text-muted-foreground">critical issues found</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medium Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{results.summary.mediumSeverity}</div>
              <p className="text-xs text-muted-foreground">moderate issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{results.summary.lowSeverity}</div>
              <p className="text-xs text-muted-foreground">minor issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="findings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="findings">All Findings</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="api">API Schema</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>All Findings ({filteredFindings.length})</CardTitle>
                <CardDescription>Detailed list of all issues found during analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFindings.map((finding: any) => (
                    <Collapsible key={finding.id}>
                      <CollapsibleTrigger onClick={() => toggleFinding(finding.id)} className="w-full">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {expandedFindings.has(finding.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {getCategoryIcon(finding.category)}
                            <div className="text-left">
                              <h4 className="font-medium">{finding.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {finding.file}:{finding.line}
                              </p>
                            </div>
                          </div>
                          <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 border-l-4 border-l-gold ml-4 mt-2 bg-muted/20 rounded-r-lg">
                          <p className="text-sm mb-4">{finding.description}</p>
                          {finding.codeSnippet && (
                            <div className="mb-4">
                              <h5 className="font-medium mb-2">Code Snippet:</h5>
                              <pre className="bg-black p-3 rounded text-sm overflow-x-auto">
                                <code className="text-green-400">{finding.codeSnippet}</code>
                              </pre>
                            </div>
                          )}
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-l-blue-500">
                            <h5 className="font-medium mb-1 text-blue-700 dark:text-blue-300">Recommendation:</h5>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{finding.recommendation}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage">
            <Card>
              <CardHeader>
                <CardTitle>Test Coverage Report</CardTitle>
                <CardDescription>Code coverage analysis results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{results.coverage.overall}%</div>
                    <div className="text-sm text-muted-foreground">Overall Coverage</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{results.coverage.lines}%</div>
                    <div className="text-sm text-muted-foreground">Line Coverage</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{results.coverage.functions}%</div>
                    <div className="text-sm text-muted-foreground">Function Coverage</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">File Coverage</h4>
                  <div className="space-y-3">
                    {results.coverage.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{file.path}</div>
                          <div className="text-sm text-muted-foreground">
                            Lines: {file.lines}% • Functions: {file.functions}%
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={file.coverage} className="w-24" />
                          <span className="text-sm font-medium">{file.coverage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Schema Validation</CardTitle>
                <CardDescription>OpenAPI schema validation results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{results.apiSchema.validSchemas}</div>
                    <div className="text-sm text-muted-foreground">Valid Schemas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{results.apiSchema.invalidSchemas}</div>
                    <div className="text-sm text-muted-foreground">Invalid Schemas</div>
                  </div>
                </div>

                {results.apiSchema.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Schema Issues</h4>
                    <div className="space-y-3">
                      {results.apiSchema.issues.map((issue: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{issue.title}</h5>
                            <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                          <p className="text-xs text-muted-foreground">{issue.file}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Analysis</CardTitle>
                <CardDescription>Security vulnerabilities and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{results.security.critical}</div>
                    <div className="text-sm text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{results.security.high}</div>
                    <div className="text-sm text-muted-foreground">High</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-500">{results.security.medium}</div>
                    <div className="text-sm text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{results.security.low}</div>
                    <div className="text-sm text-muted-foreground">Low</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Security Vulnerabilities</h4>
                  <div className="space-y-4">
                    {results.security.vulnerabilities.map((vuln: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>{vuln.title}</span>
                          </h5>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(vuln.severity)}>{vuln.severity}</Badge>
                            <Badge variant="outline">CWE-{vuln.cweId}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {vuln.file}:{vuln.line}
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-l-blue-500">
                          <p className="text-sm text-blue-600 dark:text-blue-400">{vuln.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
