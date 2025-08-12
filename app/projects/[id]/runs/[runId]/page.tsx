"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { apiService } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function AnalysisStatusPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const runId = params.runId as string

  const { data: run, isLoading } = useQuery({
    queryKey: ["analysis-run", projectId, runId],
    queryFn: () => apiService.getAnalysisRun(projectId, runId),
    refetchInterval: (data) => {
      // Stop polling when analysis is complete
      return data?.status === "running" || data?.status === "queued" ? 2000 : false
    },
  })

  const { data: logs = [] } = useQuery({
    queryKey: ["analysis-logs", projectId, runId],
    queryFn: () => apiService.getAnalysisLogs(projectId, runId),
    refetchInterval: (data) => {
      return run?.status === "running" || run?.status === "queued" ? 2000 : false
    },
    enabled: !!run,
  })

  // Redirect to results when analysis completes successfully
  useEffect(() => {
    if (run?.status === "succeeded") {
      const timer = setTimeout(() => {
        router.push(`/projects/${projectId}/runs/${runId}/results`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [run?.status, router, projectId, runId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "running":
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "succeeded":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      queued: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      succeeded: "bg-green-500/10 text-green-500 border-green-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {status}
      </Badge>
    )
  }

  const formatLogEntry = (log: any) => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString()
    const levelClass =
      {
        info: "log-info",
        warning: "log-warning",
        error: "log-error",
        success: "log-success",
      }[log.level] || "log-info"

    return (
      <div key={log.id} className="mb-1">
        <span className="log-timestamp">[{timestamp}]</span> <span className={levelClass}>{log.message}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Analysis run not found</h1>
          <p className="text-muted-foreground mb-4">The analysis run you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${projectId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Project
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Analysis Run</h1>
                <p className="text-muted-foreground font-mono">{runId}</p>
              </div>
            </div>
            {run.status === "succeeded" && (
              <Button asChild className="bg-gold text-black hover:bg-gold-light">
                <Link href={`/projects/${projectId}/runs/${runId}/results`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Results
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-3">
                  {getStatusIcon(run.status)}
                  <span>Analysis Status</span>
                </CardTitle>
                <CardDescription>
                  Started {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
              {getStatusBadge(run.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              {(run.status === "running" || run.status === "queued") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{run.progress || 0}%</span>
                  </div>
                  <Progress value={run.progress || 0} className="h-2" />
                </div>
              )}

              {/* Status Messages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Current Phase</h4>
                  <p className="text-muted-foreground">{run.currentPhase || "Initializing..."}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Duration</h4>
                  <p className="text-muted-foreground">{run.duration ? `${run.duration}s` : "In progress..."}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Files Processed</h4>
                  <p className="text-muted-foreground">
                    {run.filesProcessed || 0} / {run.totalFiles || "?"}
                  </p>
                </div>
              </div>

              {/* Success/Failure Messages */}
              {run.status === "succeeded" && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium text-green-500">Analysis Completed Successfully</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Analysis completed in {run.duration}s. Found {run.findingsCount || 0} findings. You will be
                    redirected to the results page shortly.
                  </p>
                </div>
              )}

              {run.status === "failed" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <h4 className="font-medium text-red-500">Analysis Failed</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {run.errorMessage || "The analysis encountered an error and could not complete."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Logs</CardTitle>
            <CardDescription>Real-time logs from the analysis process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="terminal h-96 overflow-y-auto scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">Waiting for logs...</div>
              ) : (
                logs.map(formatLogEntry)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
