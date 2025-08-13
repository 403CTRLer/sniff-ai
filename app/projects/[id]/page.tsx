"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
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
import { Play, Trash2, ArrowLeft, Clock, CheckCircle, XCircle, GitBranch, Upload } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => apiService.getProject(params.id),
  })

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ["project-runs", params.id],
    queryFn: () => apiService.getProjectRuns(params.id),
    enabled: !!project,
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiService.deleteProject(params.id),
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      })
      router.push("/")
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete project.",
        variant: "destructive",
      })
    },
  })

  const analysisMutation = useMutation({
    mutationFn: () => apiService.startAnalysis(params.id),
    onSuccess: (data) => {
      toast({
        title: "Analysis started",
        description: "New analysis has been queued successfully.",
      })
      queryClient.invalidateQueries({ queryKey: ["project-runs", params.id] })
      router.push(`/projects/${params.id}/runs/${data.runId}`)
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to start analysis.",
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
        return null
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

  if (projectLoading) {
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
            <Link href="/">Go back home</Link>
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
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center space-x-2 text-muted-foreground">
                {project.source === "git" ? <GitBranch className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                <span className="capitalize">{project.source}</span>
                {project.sourceUrl && (
                  <>
                    <span>•</span>
                    <span className="text-sm">{project.sourceUrl}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => analysisMutation.mutate()}
              disabled={analysisMutation.isPending}
              className="bg-gold text-black hover:bg-gold-light"
            >
              {analysisMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Analysis
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteMutation.isPending}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this project? This action cannot be undone and will remove all
                    analysis runs and results.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Analysis Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Runs</CardTitle>
            <CardDescription>History of all analysis runs for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {runsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No analysis runs yet</h3>
                <p className="text-muted-foreground mb-6">Start your first analysis to see results here</p>
                <Button
                  onClick={() => analysisMutation.mutate()}
                  disabled={analysisMutation.isPending}
                  className="bg-gold text-black hover:bg-gold-light"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(run.status)}
                            {getStatusBadge(run.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {run.duration ? `${run.duration}s` : run.status === "running" ? "In progress..." : "-"}
                        </TableCell>
                        <TableCell>
                          {run.findingsCount !== undefined ? (
                            <Badge variant="outline">{run.findingsCount} issues</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {run.status === "running" ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${params.id}/runs/${run.id}`}>View Progress</Link>
                            </Button>
                          ) : run.status === "succeeded" ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${params.id}/runs/${run.id}/results`}>View Results</Link>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/projects/${params.id}/runs/${run.id}`}>View Details</Link>
                            </Button>
                          )}
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
