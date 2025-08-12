"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ArrowLeft,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Shield,
  Code,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { apiService } from "@/lib/api"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ResultsPage() {
  const params = useParams()
  const { toast } = useToast()
  const projectId = params.id as string
  const runId = params.runId as string

  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  const { data: results, isLoading } = useQuery({
    queryKey: ["analysis-results", projectId, runId],
    queryFn: () => apiService.getAnalysisResults(projectId, runId),
  })

  const toggleFinding = (findingId: string) => {
    setExpandedFindings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(findingId)) {
        newSet.delete(findingId)
      } else {
        newSet.add(findingId)
      }
      return newSet
    })
  }

  const downloadResults = async () => {
    try {
      const blob = await apiService.downloadResults(projectId, runId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analysis-results-${runId}.json`
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

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
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
    switch (category.toLowerCase()) {
      case "security":
        return <Shield className="w-4 h-4" />
      case "quality":
        return <Code className="w-4 h-4" />
      case "coverage":
        return <BarChart3 className="w-4 h-4" />
      case "api":
        return <FileText className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

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
            <Link href={`/projects/${projectId}/runs/${runId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Filter findings
  const filteredFindings =
    results.findings?.filter((finding: any) => {
      const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter
      const matchesCategory = categoryFilter === "all" || finding.category === categoryFilter
      const matchesSearch =
        searchQuery === "" ||
        finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        finding.file.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSeverity && matchesCategory && matchesSearch
    }) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${projectId}/runs/${runId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Analysis
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Analysis Results</h1>
                <p className="text-muted-foreground font-mono">{runId}</p>
              </div>
            </div>
            <Button onClick={downloadResults} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Results
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.summary?.totalFindings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{results.summary?.highSeverity || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{results.coverage?.overall || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Files Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.summary?.filesAnalyzed || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search findings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Severity</label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="quality">Code Quality</SelectItem>
                      <SelectItem value="coverage">Coverage</SelectItem>
                      <SelectItem value="api">API Schema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="findings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="findings">All Findings</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="api">API Schema</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* All Findings Tab */}
              <TabsContent value="findings">
                <Card>
                  <CardHeader>
                    <CardTitle>All Findings ({filteredFindings.length})</CardTitle>
                    <CardDescription>Comprehensive list of all analysis findings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredFindings.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium mb-2">No findings match your filters</h3>
                        <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
                      </div>
                    ) : (
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
                                <div className="flex items-center space-x-2">
                                  <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                                  <Badge variant="outline">{finding.category}</Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-4">
                                <p className="text-muted-foreground">{finding.description}</p>
                                {finding.codeSnippet && (
                                  <div>
                                    <h5 className="font-medium mb-2">Code Snippet</h5>
                                    <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                                      <code>{finding.codeSnippet}</code>
                                    </pre>
                                  </div>
                                )}
                                {finding.recommendation && (
                                  <div>
                                    <h5 className="font-medium mb-2">Recommendation</h5>
                                    <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coverage Tab */}
              <TabsContent value="coverage">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Coverage Report</CardTitle>
                    <CardDescription>Code coverage analysis results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.coverage ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-green-500">{results.coverage.overall}%</div>
                            <div className="text-sm text-muted-foreground">Overall Coverage</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-500">{results.coverage.lines}%</div>
                            <div className="text-sm text-muted-foreground">Line Coverage</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-purple-500">{results.coverage.functions}%</div>
                            <div className="text-sm text-muted-foreground">Function Coverage</div>
                          </div>
                        </div>

                        {results.coverage.files && (
                          <div>
                            <h4 className="font-medium mb-4">File Coverage</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>File</TableHead>
                                  <TableHead>Coverage</TableHead>
                                  <TableHead>Lines</TableHead>
                                  <TableHead>Functions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.coverage.files.map((file: any) => (
                                  <TableRow key={file.path}>
                                    <TableCell className="font-mono text-sm">{file.path}</TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          file.coverage >= 80
                                            ? "bg-green-500/10 text-green-500"
                                            : file.coverage >= 60
                                              ? "bg-yellow-500/10 text-yellow-500"
                                              : "bg-red-500/10 text-red-500"
                                        }
                                      >
                                        {file.coverage}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{file.lines}%</TableCell>
                                    <TableCell>{file.functions}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No coverage data available</h3>
                        <p className="text-muted-foreground">
                          Coverage analysis was not performed or no coverage reports were found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Schema Tab */}
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>API Schema Validation</CardTitle>
                    <CardDescription>OpenAPI and schema validation results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.apiSchema ? (
                      <div className="space-y-6">
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

                        {results.apiSchema.issues && results.apiSchema.issues.length > 0 && (
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
                                  <p className="text-xs font-mono text-muted-foreground">{issue.file}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No API schemas found</h3>
                        <p className="text-muted-foreground">
                          No OpenAPI or schema files were detected in the analyzed code
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Analysis</CardTitle>
                    <CardDescription>Security vulnerabilities and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.security ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-red-500">{results.security.critical}</div>
                            <div className="text-sm text-muted-foreground">Critical</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-orange-500">{results.security.high}</div>
                            <div className="text-sm text-muted-foreground">High</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-yellow-500">{results.security.medium}</div>
                            <div className="text-sm text-muted-foreground">Medium</div>
                          </div>
                        </div>

                        {results.security.vulnerabilities && (
                          <div>
                            <h4 className="font-medium mb-4">Security Vulnerabilities</h4>
                            <div className="space-y-3">
                              {results.security.vulnerabilities.map((vuln: any, index: number) => (
                                <div key={index} className="p-4 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Shield className="w-4 h-4 text-red-500" />
                                      <h5 className="font-medium">{vuln.title}</h5>
                                    </div>
                                    <Badge className={getSeverityColor(vuln.severity)}>{vuln.severity}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-muted-foreground">
                                      {vuln.file}:{vuln.line}
                                    </span>
                                    <span className="text-muted-foreground">CWE-{vuln.cweId}</span>
                                  </div>
                                  {vuln.recommendation && (
                                    <div className="mt-3 p-3 bg-muted rounded">
                                      <p className="text-sm">
                                        <strong>Recommendation:</strong> {vuln.recommendation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium mb-2">No security issues found</h3>
                        <p className="text-muted-foreground">
                          The security analysis did not identify any vulnerabilities
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
