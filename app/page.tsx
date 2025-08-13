"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UploadModal } from "@/components/upload-modal"
import { CloneModal } from "@/components/clone-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Upload,
  GitBranch,
  Search,
  MoreHorizontal,
  Trash2,
  Play,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
} from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function HomePage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [cloneModalOpen, setCloneModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: projects = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: apiService.getProjects,
    refetchInterval: 5000, // Refetch every 5 seconds to get status updates
  })

  const deleteMutation = useMutation({
    mutationFn: apiService.deleteProject,
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setDeleteProjectId(null)
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    },
  })

  const startAnalysisMutation = useMutation({
    mutationFn: apiService.startAnalysis,
    onSuccess: (data, projectId) => {
      toast({
        title: "Analysis started",
        description: "The analysis has been queued and will begin shortly.",
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (error) => {
      toast({
        title: "Failed to start analysis",
        description: error.message || "Could not start analysis. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleProjectCreated = () => {
    refetch()
  }

  const handleDeleteProject = (projectId: string) => {
    deleteMutation.mutate(projectId)
  }

  const handleStartAnalysis = (projectId: string) => {
    startAnalysisMutation.mutate(projectId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "running":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "queued":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.sourceUrl && project.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                SniffAI
              </h1>
              <p className="text-muted-foreground">Advanced Code Analysis Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-gold text-black hover:bg-gold-light font-medium"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <Button
                onClick={() => setCloneModalOpen(true)}
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10"
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Clone Repository
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{projects.filter((p) => p.lastRunStatus === "succeeded").length} Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>{projects.filter((p) => p.lastRunStatus === "running").length} Running</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{projects.filter((p) => p.lastRunStatus === "failed").length} Failed</span>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {projects.length === 0 ? (
              <div>
                <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by uploading code files or cloning a repository
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => setUploadModalOpen(true)} className="bg-gold text-black hover:bg-gold-light">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button
                    onClick={() => setCloneModalOpen(true)}
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/10"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Clone Repository
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  No projects match your search criteria. Try adjusting your search terms.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        {project.source === "git" ? <GitBranch className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                        <span className="truncate">
                          {project.source === "git"
                            ? project.sourceUrl?.replace("https://github.com/", "")
                            : `${project.fileCount || 0} files uploaded`}
                        </span>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStartAnalysis(project.id)}
                          disabled={project.lastRunStatus === "running" || project.lastRunStatus === "queued"}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Analysis
                        </DropdownMenuItem>
                        {project.lastRunId && project.lastRunStatus === "succeeded" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}/runs/${project.lastRunId}/results`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteProjectId(project.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(project.lastRunStatus)}
                        <Badge className={getStatusColor(project.lastRunStatus)}>{project.lastRunStatus}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="pt-3 border-t">
                      {project.lastRunStatus === "succeeded" && project.lastRunId ? (
                        <Button asChild className="w-full bg-gold text-black hover:bg-gold-light">
                          <Link href={`/projects/${project.id}/runs/${project.lastRunId}/results`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </Link>
                        </Button>
                      ) : project.lastRunStatus === "running" || project.lastRunStatus === "queued" ? (
                        <Button asChild variant="outline" className="w-full bg-transparent">
                          <Link href={`/projects/${project.id}`}>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            View Progress
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartAnalysis(project.id)}
                          variant="outline"
                          className="w-full"
                          disabled={startAnalysisMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Analysis
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onProjectCreated={handleProjectCreated} />

      <CloneModal open={cloneModalOpen} onOpenChange={setCloneModalOpen} onProjectCreated={handleProjectCreated} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and will remove all associated
              analysis results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
