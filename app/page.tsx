"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UploadModal } from "@/components/upload/upload-modal"
import {
  Upload,
  FolderOpen,
  GitBranch,
  Code,
  Shield,
  Target,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
} from "lucide-react"
import type { Project } from "@/lib/models"
import { ClientOperations } from "@/lib/client-operations"

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalRuns: 0,
    completedRuns: 0,
    failedRuns: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const projectsData = await ClientOperations.getProjects()

      // Calculate stats from projects data
      const statsData = {
        totalProjects: projectsData.length,
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
      }

      // Get run stats for each project
      for (const project of projectsData) {
        const runs = await ClientOperations.getProjectRuns(project.id)
        statsData.totalRuns += runs.length
        statsData.completedRuns += runs.filter((run) => run.status === "completed").length
        statsData.failedRuns += runs.filter((run) => run.status === "failed").length
      }

      setProjects(projectsData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFile = () => {
    setUploadModalOpen(true)
  }

  const handleSelectProject = () => {
    setUploadModalOpen(true)
  }

  const handleCloneRepo = () => {
    setUploadModalOpen(true)
  }

  const handleProjectCreated = (projectId: string) => {
    console.log("Project created:", projectId)
    setUploadModalOpen(false)
    // Navigate to project page
    router.push(`/projects/${projectId}`)
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

  return (
    <MainLayout>
      <div className="container px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="text-gradient-gold">SniffAI</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              AI-powered code review and analysis for security, quality, and AI detection
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <Button
              onClick={handleUploadFile}
              size="lg"
              className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload File / ZIP
            </Button>
            <Button
              onClick={handleSelectProject}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-[#333333] hover:border-[#D4AF37] bg-transparent"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              Select Local Project
            </Button>
            <Button
              onClick={handleCloneRepo}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-[#333333] hover:border-[#D4AF37] bg-transparent"
            >
              <GitBranch className="mr-2 h-5 w-5" />
              Clone Repository
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            description="Projects analyzed"
            icon={Code}
            badge={{ text: "All Time" }}
          />
          <StatsCard
            title="Analysis Runs"
            value={stats.totalRuns}
            description="Total analysis runs"
            icon={Activity}
            badge={{ text: "All Time" }}
          />
          <StatsCard
            title="Completed"
            value={stats.completedRuns}
            description="Successful analyses"
            icon={CheckCircle}
            badge={{ text: "Success Rate" }}
          />
          <StatsCard
            title="Failed"
            value={stats.failedRuns}
            description="Failed analyses"
            icon={XCircle}
            badge={{ text: "Errors" }}
          />
        </div>

        {/* Recent Projects */}
        <Card className="bg-[#1A1A1A] border-[#333333]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Projects</CardTitle>
                <CardDescription>Your latest code analysis projects</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="border-[#333333] hover:border-[#D4AF37] bg-transparent">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={Code}
                title="No projects yet"
                description="Get started by uploading your first project for analysis. SniffAI will scan for AI-generated code, security issues, and quality problems."
                action={{
                  label: "Upload Your First Project",
                  onClick: handleUploadFile,
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333333] hover:bg-[#1A1A1A]">
                    <TableHead className="text-[#D4AF37]">Project Name</TableHead>
                    <TableHead className="text-[#D4AF37]">Source Type</TableHead>
                    <TableHead className="text-[#D4AF37]">Files</TableHead>
                    <TableHead className="text-[#D4AF37]">Created</TableHead>
                    <TableHead className="text-[#D4AF37]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="border-[#333333] hover:bg-[#1A1A1A]">
                      <TableCell className="font-medium text-white">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#333333] text-muted-foreground">
                          {project.sourceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.fileCount || 0} files</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-[#333333] hover:text-[#D4AF37]"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="bg-[#1A1A1A] border-[#333333] hover:border-[#D4AF37] transition-colors cursor-pointer"
            onClick={() => router.push("/test")}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Target className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Quick Test</CardTitle>
                  <CardDescription className="text-xs">Test single file analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333] hover:border-[#D4AF37] transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Shield className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Security Scan</CardTitle>
                  <CardDescription className="text-xs">Find vulnerabilities</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#333333] hover:border-[#D4AF37] transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Quality Check</CardTitle>
                  <CardDescription className="text-xs">Code quality analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onProjectCreated={handleProjectCreated} />
    </MainLayout>
  )
}
