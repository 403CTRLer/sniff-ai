"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, GitBranch, Search, Plus, FileCode, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { UploadModal } from "@/components/upload-modal"
import { CloneModal } from "@/components/clone-modal"
import { apiService } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Project {
  id: string
  name: string
  source: "upload" | "git"
  sourceUrl?: string
  lastRunStatus: "queued" | "running" | "succeeded" | "failed"
  lastRunId?: string
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [cloneModalOpen, setCloneModalOpen] = useState(false)

  const {
    data: projects = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: apiService.getProjects,
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
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
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

  const handleProjectCreated = () => {
    refetch()
    setUploadModalOpen(false)
    setCloneModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center shadow-lg animate-gold-glow">
                <Search className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">SniffAI</h1>
                <p className="text-muted-foreground">AI-powered code review and analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Analyze Your Code with AI</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload files, clone repositories, and get comprehensive analysis with security scanning, code quality
            checks, and AI-powered insights.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setUploadModalOpen(true)}
              className="bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Files/ZIP
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCloneModalOpen(true)}
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              <GitBranch className="w-5 h-5 mr-2" />
              Clone Repository
            </Button>
          </div>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5" />
                  <span>Recent Projects</span>
                </CardTitle>
                <CardDescription>Your latest code analysis projects</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <FileCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Get started by uploading files or cloning a repository</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button variant="outline" onClick={() => setCloneModalOpen(true)}>
                    <GitBranch className="w-4 h-4 mr-2" />
                    Clone Repository
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project: Project) => (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium hover:text-gold transition-colors"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {project.source === "git" ? (
                              <GitBranch className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Upload className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="capitalize">{project.source}</span>
                            {project.sourceUrl && (
                              <span className="text-xs text-muted-foreground truncate max-w-32">
                                {project.sourceUrl}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(project.lastRunStatus)}
                            {getStatusBadge(project.lastRunStatus)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
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

      {/* Modals */}
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onProjectCreated={handleProjectCreated} />
      <CloneModal open={cloneModalOpen} onOpenChange={setCloneModalOpen} onProjectCreated={handleProjectCreated} />
    </div>
  )
}
