"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, Play, Trash2, Clock, CheckCircle, XCircle, GitBranch, Upload, ExternalLink } from "lucide-react"
import { apiService } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiService.getProject(projectId),
  })

  const { data: runs = [] } = useQuery({
    queryKey: ["project-runs", projectId],
    queryFn: () => apiService.getProjectRuns(projectId),
    enabled: !!project,
  })

  const deleteProjectMutation = useMutation({
    mutationFn: () => apiService.deleteProject(projectId),
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      })
      router.push("/")
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    },
  })

  const startAnalysisMutation = useMutation({
    mutationFn: () => apiService.startAnalysis(projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-runs", projectId] })
      router.push(`/projects/${projectId}/runs/${data.runId}`)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      })
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "running":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case "succeeded":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
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
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  {project.source === "git" ? <GitBranch className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  <span className="capitalize">{project.source}</span>
                  {project.sourceUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={project.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gold transition-colors flex items-center space-x-1"
                      >
                        <span className="truncate max-w-64">{project.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => startAnalysisMutation.mutate()}
                disabled={startAnalysisMutation.isPending}
                className="bg-gold text-black hover:bg-gold-light"
              >
                {startAnalysisMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Analysis
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.name}"? This action cannot be undone. All analysis runs
                      and results will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProjectMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Project Metadata */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Created</h4>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Total Runs</h4>
                <p className="text-muted-foreground">{runs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Runs</CardTitle>
            <CardDescription>History of all analysis runs for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No analysis runs yet</h3>
                <p className="text-muted-foreground mb-6">Start your first analysis to see results here</p>
                <Button
                  onClick={() => startAnalysisMutation.mutate()}
                  disabled={startAnalysisMutation.isPending}
                  className="bg-gold text-black hover:bg-gold-light"
                >
                  {startAnalysisMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Start Analysis
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run: any) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <Link
                            href={`/projects/${projectId}/runs/${run.id}`}
                            className="font-mono text-sm hover:text-gold transition-colors"
                          >
                            {run.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(run.status)}
                            {getStatusBadge(run.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {run.duration ? `${run.duration}s` : "-"}
                        </TableCell>
                        <TableCell>
                          {run.findingsCount !== undefined ? (
                            <Badge variant="outline">{run.findingsCount} findings</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/projects/${projectId}/runs/${run.id}`}>View</Link>
                            </Button>
                            {run.status === "succeeded" && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/projects/${projectId}/runs/${run.id}/results`}>Results</Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
