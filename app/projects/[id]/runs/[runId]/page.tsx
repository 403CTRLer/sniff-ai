"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, CheckCircle, XCircle, Activity, Terminal, Eye, RefreshCw } from "lucide-react"
import type { Project, AnalysisRun } from "@/lib/models"
import { ClientOperations } from "@/lib/client-operations"

export default function RunStatusPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const runId = params.runId as string

  const [project, setProject] = useState<Project | null>(null)
  const [run, setRun] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (projectId && runId) {
      fetchProject()
      fetchRun()
    }
  }, [projectId, runId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (run && (run.status === "queued" || run.status === "running")) {
      interval = setInterval(() => {
        fetchRun()
        // Simulate progress
        setProgress((prev) => Math.min(prev + Math.random() * 10, 95))
      }, 2000)
    } else if (run && run.status === "completed" && run.results) {
      // Auto-redirect to results after 3 seconds
      setTimeout(() => {
        router.push(`/projects/${projectId}/runs/${runId}/results`)
      }, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [run, projectId, runId, router])

  const fetchProject = async () => {
    try {
      const data = await ClientOperations.getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error("Failed to fetch project:", error)
    }
  }

  const fetchRun = async () => {
    try {
      const data = await ClientOperations.getAnalysisRun(runId)
      setRun(data)
      if (data?.status === "completed") {
        setProgress(100)
      }
    } catch (error) {
      console.error("Failed to fetch run:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />
      case "running":
        return <Activity className="h-5 w-5 text-[#D4AF37] animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "failed":
        return "text-red-400"
      case "running":
        return "text-[#D4AF37]"
      default:
        return "text-gray-400"
    }
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

  if (!run || !project) {
    return (
      <MainLayout>
        <div className="container px-6 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Run Not Found</h2>
            <p className="text-muted-foreground mb-6">The analysis run you're looking for doesn't exist.</p>
            <Button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
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
              onClick={() => router.push(`/projects/${projectId}`)}
              className="hover:bg-[#333333] hover:text-[#D4AF37]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Analysis Run</h1>
              <p className="text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRun}
              className="border-[#333333] hover:border-[#D4AF37] bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {run.status === "completed" && run.results && (
              <Button
                onClick={() => router.push(`/projects/${projectId}/runs/${runId}/results`)}
                className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Results
              </Button>
            )}
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(run.status)}
                <span className={`text-lg font-semibold capitalize ${getStatusColor(run.status)}`}>{run.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white">{new Date(run.startedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-white">{formatDuration(run.startedAt, run.completedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{progress.toFixed(0)}%</span>
                  <span className="text-muted-foreground">
                    {run.status === "completed" ? "Complete" : run.status === "failed" ? "Failed" : "Running"}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Message */}
        {run.status === "completed" && run.results && (
          <Card className="bg-green-900/20 border-green-400">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Analysis Complete!</h3>
                  <p className="text-green-300">
                    Found {run.results.issues.length} issues, {run.results.aiDetection.likelihood}% AI likelihood.
                    Redirecting to results in 3 seconds...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {run.status === "failed" && (
          <Card className="bg-red-900/20 border-red-400">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-6 w-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Analysis Failed</h3>
                  <p className="text-red-300">{run.error || "An unexpected error occurred during analysis."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(run.status === "queued" || run.status === "running") && (
          <Card className="bg-[#D4AF37]/10 border-[#D4AF37]">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-[#D4AF37] animate-pulse" />
                <div>
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {run.status === "queued" ? "Analysis Queued" : "Analysis Running"}
                  </h3>
                  <p className="text-[#D4AF37]/80">
                    {run.status === "queued"
                      ? "Your analysis is in the queue and will start shortly."
                      : "Analyzing your code for AI detection, security issues, and quality problems."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-[#D4AF37]" />
              <CardTitle className="text-white">Analysis Logs</CardTitle>
            </div>
            <CardDescription>Real-time output from the analysis process</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border border-[#333333] bg-[#0D0D0D] p-4">
              <div className="font-mono text-sm space-y-1">
                {run.logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs available yet...</div>
                ) : (
                  run.logs.map((log, index) => (
                    <div key={index} className="text-green-400">
                      <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))
                )}
                {(run.status === "queued" || run.status === "running") && (
                  <div className="text-[#D4AF37] animate-pulse">
                    <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                    {run.status === "queued" ? " Waiting in queue..." : " Analysis in progress..."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
