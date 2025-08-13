"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, Terminal } from "lucide-react"
import { apiService } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function AnalysisStatusPage({ params }: { params: { id: string; runId: string } }) {
  const router = useRouter()
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { data: run, refetch } = useQuery({
    queryKey: ["analysis-run", params.id, params.runId],
    queryFn: () => apiService.getAnalysisRun(params.id, params.runId),
    refetchInterval: autoRefresh ? 2000 : false,
  })

  const { data: logs = [] } = useQuery({
    queryKey: ["analysis-logs", params.id, params.runId],
    queryFn: () => apiService.getAnalysisLogs(params.id, params.runId),
    refetchInterval: autoRefresh ? 3000 : false,
  })

  useEffect(() => {
    if (run?.status === "succeeded") {
      setAutoRefresh(false)
      // Auto-redirect to results after 2 seconds
      const timer = setTimeout(() => {
        router.push(`/projects/${params.id}/runs/${params.runId}/results`)
      }, 2000)
      return () => clearTimeout(timer)
    } else if (run?.status === "failed") {
      setAutoRefresh(false)
    }
  }, [run?.status, router, params.id, params.runId])

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
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400"
      case "warning":
        return "text-yellow-400"
      case "success":
        return "text-green-400"
      case "info":
      default:
        return "text-blue-400"
    }
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
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
              <h1 className="text-3xl font-bold">Analysis Status</h1>
              <p className="text-muted-foreground">
                Started {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(run.status)}
            {getStatusBadge(run.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
              <CardDescription>Current status and progress information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {run.status === "running" && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{run.progress}%</span>
                    </div>
                    <Progress value={run.progress} className="h-3" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Phase</span>
                      <span className="text-sm font-medium">{run.currentPhase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Files Processed</span>
                      <span className="text-sm font-medium">
                        {run.filesProcessed} / {run.totalFiles}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {run.status === "succeeded" && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                  <div>
                    <h3 className="text-lg font-medium text-green-500">Analysis Complete!</h3>
                    <p className="text-muted-foreground">
                      Found {run.findingsCount} issues in {run.duration} seconds
                    </p>
                  </div>
                  <Button asChild className="bg-gold text-black hover:bg-gold-light">
                    <Link href={`/projects/${params.id}/runs/${params.runId}/results`}>View Results</Link>
                  </Button>
                </div>
              )}

              {run.status === "failed" && (
                <div className="text-center space-y-4">
                  <XCircle className="w-16 h-16 mx-auto text-red-500" />
                  <div>
                    <h3 className="text-lg font-medium text-red-500">Analysis Failed</h3>
                    <p className="text-muted-foreground">{run.errorMessage}</p>
                  </div>
                  <Button variant="outline" onClick={() => refetch()}>
                    Retry Analysis
                  </Button>
                </div>
              )}

              {run.status === "queued" && (
                <div className="text-center space-y-4">
                  <Clock className="w-16 h-16 mx-auto text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-500">Analysis Queued</h3>
                    <p className="text-muted-foreground">Waiting for available resources...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Live Logs</span>
              </CardTitle>
              <CardDescription>Real-time analysis output</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border bg-black p-4">
                <div className="space-y-1 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground">No logs available yet...</div>
                  ) : (
                    logs.map((log: any) => (
                      <div key={log.id} className="flex space-x-2">
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs font-medium ${getLogLevelColor(log.level)}`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-white text-xs">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
