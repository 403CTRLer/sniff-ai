"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultsSummary } from "@/components/results/results-summary"
import { FindingsTable } from "@/components/results/findings-table"
import { CoverageView } from "@/components/results/coverage-view"
import { SecurityView } from "@/components/results/security-view"
import { ApiIssuesView } from "@/components/results/api-issues-view"
import { ResultsFilters } from "@/components/results/results-filters"
import { ArrowLeft, Download, Share, RefreshCw, Save } from "lucide-react"
import type { Project, AnalysisRun, Issue, SecurityIssue, ApiIssue } from "@/lib/models"
import { ClientOperations } from "@/lib/client-operations"

type AnyIssue = any

function normalizeIssues(rawIssues: AnyIssue[] | undefined): import("@/lib/models").Issue[] {
  const input = Array.isArray(rawIssues) ? rawIssues : []
  return input.map((i) => {
    // Support both engine "finding" shape and UI Issue shape
    const file = i.file ?? i.filePath ?? "Unknown file"
    const line = i.line ?? i.lineNumber ?? 0
    const column = i.column ?? i.columnNumber ?? 0
    const message = i.message ?? i.title ?? "No message available"
    const code = i.code ?? i.codeSnippet
    // Map categories to our union; fallback to 'maintainability'
    const rawCategory = i.category ?? i.type ?? "maintainability"
    const category: import("@/lib/models").Issue["category"] =
      rawCategory === "style"
        ? "style"
        : rawCategory === "performance"
          ? "performance"
          : rawCategory === "bug"
            ? "bug"
            : rawCategory === "maintainability" ||
                rawCategory === "maintenance" ||
                rawCategory === "modernization" ||
                rawCategory === "best-practices" ||
                rawCategory === "debugging"
              ? "maintainability"
              : "maintainability"

    const sev = (i.severity ?? "low") as import("@/lib/models").Issue["severity"]

    return {
      id: String(i.id ?? `${file}-${line}-${column}`),
      file,
      line,
      column,
      severity: sev,
      category,
      message,
      suggestion: i.suggestion ?? i.recommendation,
      code,
    }
  })
}

function normalizeSecurity(raw: AnyIssue[] | undefined): import("@/lib/models").SecurityIssue[] {
  const input = Array.isArray(raw) ? raw : []
  return input.map((i) => {
    const file = i.file ?? i.filePath ?? "Unknown file"
    const line = i.line ?? i.lineNumber ?? 0
    const message = i.message ?? i.title ?? "No message available"
    return {
      id: String(i.id ?? `${file}-${line}`),
      file,
      line,
      severity: (i.severity ?? "low") as import("@/lib/models").SecurityIssue["severity"],
      type: (i.type ?? "injection") as import("@/lib/models").SecurityIssue["type"],
      message,
      cwe: i.cwe ?? i.cweId,
      suggestion: i.suggestion ?? i.recommendation,
    }
  })
}

function normalizeApiIssues(raw: AnyIssue[] | undefined): import("@/lib/models").ApiIssue[] {
  const input = Array.isArray(raw) ? raw : []
  return input.map((i) => {
    const file = i.file ?? i.filePath ?? "Unknown file"
    const line = i.line ?? i.lineNumber ?? 0
    const message = i.message ?? i.title ?? i.issue ?? "No message available"
    // Map to supported types
    let t: import("@/lib/models").ApiIssue["type"] = "misuse"
    const rt = String(i.type ?? "").toLowerCase()
    if (rt.includes("deprecated")) t = "deprecated"
    else if (rt.includes("rate")) t = "rate-limit"
    else if (rt.includes("validation")) t = "missing-validation"
    else if (rt.includes("misuse") || rt.includes("reliability") || rt.includes("security")) t = "misuse"

    return {
      id: String(i.id ?? `${file}-${line}`),
      file,
      line,
      type: t,
      api: i.api ?? i.endpoint ?? "unknown",
      message,
      suggestion: i.suggestion,
    }
  })
}

function normalizeCoverage(rawCoverage: any): {
  overall: number
  filesCovered: number
  totalFiles: number
  coverageByFile: Record<string, number>
} {
  // Supports either aggregated object or per-file array from engine
  if (rawCoverage && typeof rawCoverage === "object" && "overall" in rawCoverage) {
    return {
      overall: Number(rawCoverage.overall) || 0,
      filesCovered: Number(rawCoverage.filesCovered) || 0,
      totalFiles: Number(rawCoverage.totalFiles) || 0,
      coverageByFile: rawCoverage.coverageByFile ?? {},
    }
  }
  const arr = Array.isArray(rawCoverage) ? rawCoverage : []
  const totalFiles = arr.length
  const byFile: Record<string, number> = {}
  let sum = 0
  let filesCovered = 0
  for (const c of arr) {
    const path = c.filePath ?? c.file ?? "unknown"
    const pct = Number(c.coveragePercentage ?? 0)
    byFile[path] = pct
    sum += pct
    if (pct > 0) filesCovered += 1
  }
  const overall = totalFiles > 0 ? Math.round(sum / totalFiles) : 0
  return { overall, filesCovered, totalFiles, coverageByFile: byFile }
}

function normalizeResults(raw: any) {
  if (!raw) return generateSampleResults()
  const issues = normalizeIssues(raw.issues ?? raw.findings)
  const security = normalizeSecurity(raw.security ?? raw.securityIssues)
  const apiIssues = normalizeApiIssues(raw.apiIssues)
  const coverage = normalizeCoverage(raw.coverage ?? raw.testCoverage)
  const aiDetection = raw.aiDetection ?? {
    likelihood: Number(raw.aiDetectionScore ?? 0),
    confidence: 85,
    patterns: [],
  }

  return { issues, security, apiIssues, coverage, aiDetection }
}

function generateSampleResults() {
  return {
    aiDetection: {
      likelihood: 75, // Changed to percentage for consistency
      confidence: 85,
      patterns: ["Repetitive code patterns", "Consistent naming conventions", "Standard formatting"],
    },
    issues: [
      {
        id: "1",
        severity: "medium" as const,
        category: "maintainability",
        message: "Complex function detected", // Changed from title to message
        file: "src/utils/helper.js", // Changed from filePath to file
        line: 45, // Changed from lineNumber to line
        column: 1,
        code: "function complexCalculation(a, b, c) {\n  if (a > 0) {\n    if (b > 0) {\n      return a * b + c;\n    }\n  }\n  return 0;\n}",
        suggestion: "Consider breaking this function into smaller, more focused functions",
      },
      {
        id: "2",
        severity: "high" as const,
        category: "performance",
        message: "Inefficient loop detected",
        file: "src/components/DataTable.jsx",
        line: 23,
        column: 1,
        code: "for (let i = 0; i < data.length; i++) {\n  for (let j = 0; j < data[i].length; j++) {\n    // processing\n  }\n}",
        suggestion: "Consider using more efficient data structures or algorithms",
      },
      {
        id: "3",
        severity: "low" as const,
        category: "style",
        message: "Missing semicolon",
        file: "src/components/Button.jsx",
        line: 15,
        column: 25,
        code: "const handleClick = () => console.log('clicked')",
        suggestion: "Add semicolon at the end of the statement",
      },
    ] as Issue[],
    security: [
      {
        id: "sec-1",
        type: "injection",
        severity: "high" as const,
        message: "Potential XSS vulnerability", // Changed from title to message
        file: "src/components/UserInput.jsx", // Changed from filePath to file
        line: 12, // Changed from lineNumber to line
        cwe: "79",
        suggestion: "Use textContent instead of innerHTML or sanitize input", // Changed from recommendation to suggestion
      },
      {
        id: "sec-2",
        type: "auth",
        severity: "medium" as const,
        message: "Weak password validation",
        file: "src/auth/validation.js",
        line: 8,
        cwe: "521",
        suggestion: "Implement stronger password requirements including special characters",
      },
    ] as SecurityIssue[],
    apiIssues: [
      {
        id: "api-1",
        type: "deprecated",
        message: "Deprecated API usage", // Changed from title to message
        file: "src/components/LegacyComponent.jsx", // Changed from filePath to file
        line: 8, // Changed from lineNumber to line
        suggestion: "Replace with componentDidMount or useEffect hook",
      },
      {
        id: "api-2",
        type: "breaking-change",
        message: "Breaking API change detected",
        file: "src/services/api.js",
        line: 25,
        suggestion: "Update to use the new API endpoint structure",
      },
    ] as ApiIssue[],
    coverage: {
      overall: 78,
      filesCovered: 15, // Added missing properties
      totalFiles: 20,
    },
  }
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const runId = params.runId as string

  const [project, setProject] = useState<Project | null>(null)
  const [run, setRun] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("findings")
  const [filters, setFilters] = useState({
    severity: "all",
    category: "all",
    file: "all",
  })

  useEffect(() => {
    if (projectId && runId) {
      fetchProject()
      fetchRun()
    }
  }, [projectId, runId])

  const fetchProject = async () => {
    try {
      const data = await ClientOperations.getProject(projectId)
      setProject(
        data || {
          id: projectId,
          name: "Sample Project",
          description: "Code analysis project",
          sourceType: "upload" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      )
    } catch (error) {
      console.error("Failed to fetch project:", error)
      setProject({
        id: projectId,
        name: "Sample Project",
        description: "Code analysis project",
        sourceType: "upload" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  const fetchRun = async () => {
    try {
      const data = await ClientOperations.getAnalysisRun(runId)
      setRun(
        data || {
          id: runId,
          projectId,
          status: "completed" as const,
          startedAt: new Date(),
          completedAt: new Date(),
          results: generateSampleResults(),
        },
      )
    } catch (error) {
      console.error("Failed to fetch run:", error)
      setRun({
        id: runId,
        projectId,
        status: "completed" as const,
        startedAt: new Date(),
        completedAt: new Date(),
        results: generateSampleResults(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportResults = () => {
    if (run?.results) {
      const dataStr = JSON.stringify(run.results, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
      const exportFileDefaultName = `sniffai-results-${project?.name || "project"}-${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    }
  }

  const handleSaveToFileSystem = async () => {
    if (!run?.results || !("showSaveFilePicker" in window)) {
      handleExportResults()
      return
    }

    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `sniffai-results-${project?.name || "project"}-${new Date().toISOString().split("T")[0]}.json`,
        types: [
          {
            description: "JSON files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      })

      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(run.results, null, 2))
      await writable.close()
    } catch (error) {
      console.error("Failed to save file:", error)
      handleExportResults()
    }
  }

  const rawResults = run?.results
  const displayResults = normalizeResults(rawResults)
  const displayProject = project || {
    id: projectId,
    name: "Sample Project",
    description: "Code analysis project",
    sourceType: "upload" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const filteredIssues = (displayResults.issues || []).filter((issue: Issue) => {
    if (filters.severity !== "all" && issue.severity !== filters.severity) return false
    if (filters.category !== "all" && issue.category !== filters.category) return false
    if (filters.file !== "all" && issue.file && !issue.file.includes(filters.file)) return false
    return true
  })

  const filteredSecurityIssues = (displayResults.security || []).filter((issue: SecurityIssue) => {
    if (filters.severity !== "all" && issue.severity !== filters.severity) return false
    if (filters.file !== "all" && issue.file && !issue.file.includes(filters.file)) return false
    return true
  })

  const filteredApiIssues = (displayResults.apiIssues || []).filter((issue: ApiIssue) => {
    if (filters.file !== "all" && issue.file && !issue.file.includes(filters.file)) return false
    return true
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="container px-6 py-8">
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/runs/${runId}`)}
              className="hover:bg-[#333333] hover:text-[#D4AF37]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Run
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Advanced Results</h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-muted-foreground">{displayProject.name}</p>
                <Badge variant="outline" className="border-green-400 text-green-400">
                  Completed
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRun}
              className="border-[#333333] hover:border-[#D4AF37] bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-[#333333] hover:border-[#D4AF37] bg-transparent">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            {"showSaveFilePicker" in window && (
              <Button
                onClick={handleSaveToFileSystem}
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0D] bg-transparent"
              >
                <Save className="mr-2 h-4 w-4" />
                Save to Disk
              </Button>
            )}
            <Button
              onClick={handleExportResults}
              className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <ResultsSummary results={displayResults} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ResultsFilters
              filters={filters}
              onFiltersChange={setFilters}
              issues={displayResults.issues || []}
              securityIssues={displayResults.security || []}
              apiIssues={displayResults.apiIssues || []}
            />
          </div>

          {/* Results Content */}
          <div className="lg:col-span-3">
            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white">Detailed Results</CardTitle>
                <CardDescription>Comprehensive analysis findings and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 bg-[#333333]">
                    <TabsTrigger
                      value="findings"
                      className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                    >
                      All Findings ({filteredIssues.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="coverage"
                      className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                    >
                      Coverage
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                    >
                      Security ({filteredSecurityIssues.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="api"
                      className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]"
                    >
                      API Issues ({filteredApiIssues.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="findings" className="mt-6 max-h-[600px] overflow-y-auto">
                    <FindingsTable issues={filteredIssues} />
                  </TabsContent>

                  <TabsContent value="coverage" className="mt-6 max-h-[600px] overflow-y-auto">
                    <CoverageView coverage={displayResults.coverage} />
                  </TabsContent>

                  <TabsContent value="security" className="mt-6 max-h-[600px] overflow-y-auto">
                    <SecurityView issues={filteredSecurityIssues} />
                  </TabsContent>

                  <TabsContent value="api" className="mt-6 max-h-[600px] overflow-y-auto">
                    <ApiIssuesView issues={filteredApiIssues} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
