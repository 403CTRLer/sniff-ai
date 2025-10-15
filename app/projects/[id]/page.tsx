"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Play,
  Trash2,
  Calendar,
  FolderOpen,
  GitBranch,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  FileText,
  Settings,
} from "lucide-react"
import type { Project, AnalysisRun } from "@/lib/models"
import { ClientOperations } from "@/lib/client-operations"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [runs, setRuns] = useState<AnalysisRun[]>([])
  const [loading, setLoading] = useState(true)
  const [runLoading, setRunLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchRuns()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const data = await ClientOperations.getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRuns = async () => {
    try {
      const data = await ClientOperations.getProjectRuns(projectId)
      setRuns(data)
    } catch (error) {
      console.error("Failed to fetch runs:", error)
    }
  }

  const handleRunAnalysis = async () => {
    if (!project) return

    setRunLoading(true)
    try {
      // Create new analysis run
      const newRun = await ClientOperations.createAnalysisRun(projectId, {
        includeAiDetection: true,
        includeSecurity: true,
        includeQuality: true,
        includeCoverage: true,
        includeApiValidation: true,
      })

      // Navigate to run status page
      router.push(`/projects/${projectId}/runs/${newRun.id}`)

      // Start analysis in background
      setTimeout(async () => {
        try {
          // Get project files
          const files = await ClientOperations.getProjectFiles(projectId)

          // Run analysis using dynamic import to avoid module issues
          const { AnalysisEngine } = await import("@/lib/analysis/analysis-engine")
          const analysisEngine = new AnalysisEngine()

          // Run analysis
          const results = await analysisEngine.analyzeProject(files, {
            includeAiDetection: true,
            includeSecurity: true,
            includeQuality: true,
            includeCoverage: true,
            includeApiValidation: true,
          })

          // Update run with results
          await ClientOperations.updateAnalysisRun(newRun.id, {
            status: "completed",
            completedAt: new Date(),
            results: {
              issues: results.findings,
              coverage: results.coverage,
              security: results.securityIssues,
              apiIssues: results.apiIssues,
              aiDetection: {
                likelihood: results.aiDetectionScore,
                confidence: 0.85,
                patterns: [],
              },
              metrics: results.metrics,
            },
            logs: [
              "Analysis started",
              `Processing ${files.length} files`,
              "Running code quality checks",
              "Analyzing security vulnerabilities",
              "Calculating AI detection score",
              "Analysis completed successfully",
            ],
          })
        } catch (error) {
          console.error("Analysis failed:", error)
          await ClientOperations.updateAnalysisRun(newRun.id, {
            status: "failed",
            completedAt: new Date(),
            error: error instanceof Error ? error.message : "Analysis failed",
            logs: [
              "Analysis started",
              "Error occurred during analysis",
              `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            ],
          })
        }
      }, 1000)
    } catch (error) {
      console.error("Failed to start analysis:", error)
    } finally {
      setRunLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    setDeleteLoading(true)
    try {
      await ClientOperations.deleteProject(projectId)
      router.push("/")
    } catch (error) {
      console.error("Failed to delete project:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "git":
        return <GitBranch className="h-4 w-4" />
      case "local":
        return <FolderOpen className="h-4 w-4" />
      default:
        return <Upload className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "running":
        return <Activity className="h-4 w-4 text-[#D4AF37] animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-900 text-green-400 border-green-400",
      failed: "bg-red-900 text-red-400 border-red-400",
      running: "bg-yellow-900 text-yellow-400 border-yellow-400",
      queued: "bg-gray-900 text-gray-400 border-gray-400",
    }
    return variants[status as keyof typeof variants] || variants.queued
  }

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date()
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000)
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

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

  if (!project) {
    return (
      <MainLayout>
        <div className="container px-6 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/")} className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="hover:bg-[#333333] hover:text-[#D4AF37]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  {getSourceIcon(project.sourceType)}
                  <span className="text-sm capitalize">{project.sourceType}</span>
                </div>
                {project.sourceUrl && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span className="text-sm">{project.sourceUrl}</span>
                  </div>
                )}
                {project.branch && (
                  <Badge variant="outline" className="border-[#333333] text-muted-foreground">
                    {project.branch}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRunAnalysis}
              disabled={runLoading}
              className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
            >
              {runLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run New Analysis
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-400 text-red-400 hover:bg-red-900/20 bg-transparent">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this project? This action cannot be undone and will remove all
                    analysis runs and results.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[#333333] hover:border-[#D4AF37] bg-transparent">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Project"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white text-2xl font-bold">{runs.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white text-2xl font-bold">{project.fileCount || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Runs */}
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Analysis Runs</CardTitle>
            <CardDescription>History of all analysis runs for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-[#D4AF37] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No analysis runs yet</h3>
                <p className="text-muted-foreground mb-6">Start your first analysis to see results here.</p>
                <Button
                  onClick={handleRunAnalysis}
                  disabled={runLoading}
                  className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run Analysis
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333333] hover:bg-[#1A1A1A]">
                    <TableHead className="text-[#D4AF37]">Status</TableHead>
                    <TableHead className="text-[#D4AF37]">Started</TableHead>
                    <TableHead className="text-[#D4AF37]">Duration</TableHead>
                    <TableHead className="text-[#D4AF37]">Results</TableHead>
                    <TableHead className="text-[#D4AF37]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id} className="border-[#333333] hover:bg-[#1A1A1A]">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(run.status)}
                          <Badge className={getStatusBadge(run.status)}>{run.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDuration(run.startedAt, run.completedAt)}
                      </TableCell>
                      <TableCell>
                        {run.results ? (
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-400">{run.results.issues.length} issues</span>
                            <span className="text-[#D4AF37]">{run.results.aiDetection.likelihood}% AI</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/projects/${projectId}/runs/${run.id}`)}
                            className="hover:bg-[#333333] hover:text-[#D4AF37]"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {run.status === "completed" && run.results && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/projects/${projectId}/runs/${run.id}/results`)}
                              className="hover:bg-[#333333] hover:text-[#D4AF37]"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
