"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileCode, Zap, CheckCircle, AlertTriangle, XCircle, Trophy, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ProjectImportModal } from "@/components/project-import-modal"
import { ProjectAnalysis } from "@/components/project-analysis"
import { CategoryResults } from "@/components/category-results"
import { FileExplorer } from "@/components/file-explorer"
import { BasicAnalysisResults } from "@/components/basic-analysis-results"
import { apiService, type FileAnalysisRequest } from "@/lib/api"
import { UnifiedCodeAnalyzer } from "@/components/unified-code-analyzer"

interface BasicAnalysisResult {
  lines: number
  functions: number
  classes: number
  complexity: number
  issues: number
  score: number
  language: string
  imports: number
}

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  language?: string
  analysisResult?: BasicAnalysisResult
}

export default function SniffAIDashboard() {
  const [files, setFiles] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [currentView, setCurrentView] = useState<"upload" | "project" | "explorer" | "unified">("unified")
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  // File Explorer state
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([])
  const [basicAnalysisResults, setBasicAnalysisResults] = useState<BasicAnalysisResult[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      processFiles(selectedFiles)
    }
  }

  const handleChooseFiles = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const processFiles = async (fileList: File[]) => {
    const newFiles: any[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      language: getLanguageFromExtension(file.name),
      status: "analyzing",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    try {
      const request: FileAnalysisRequest = {
        files: fileList,
        options: {
          includeAiDetection: true,
          includeLogicAnalysis: true,
          includeApiAnalysis: true,
          includeTestCoverage: true,
        },
      }

      const response = await apiService.uploadFiles(request)
      setAnalysisId(response.analysisId)

      // Poll for results
      pollAnalysisResults(
        response.analysisId,
        newFiles.map((f) => f.id),
      )
    } catch (error) {
      console.error("Failed to upload files:", error)
      // Fallback to simulation for demo
      newFiles.forEach((file) => {
        simulateAnalysis(file.id)
      })
    }
  }

  const pollAnalysisResults = async (analysisId: string, fileIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiService.getAnalysisStatus(analysisId)

        // Update progress for all files
        setFiles((prev) =>
          prev.map((file) => (fileIds.includes(file.id) ? { ...file, progress: status.progress } : file)),
        )

        if (status.status === "completed") {
          clearInterval(pollInterval)
          const results = await apiService.getAnalysisResults(analysisId)

          // Update files with results
          setFiles((prev) =>
            prev.map((file) => {
              const result = results.find((r) => r.filename === file.filename)
              return result ? { ...file, ...result, status: "completed" } : file
            }),
          )
        }
      } catch (error) {
        console.error("Failed to poll analysis results:", error)
        clearInterval(pollInterval)
      }
    }, 2000)
  }

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const langMap: { [key: string]: string } = {
      js: "JavaScript",
      ts: "TypeScript",
      py: "Python",
      java: "Java",
      cpp: "C++",
      c: "C",
      cs: "C#",
      php: "PHP",
      rb: "Ruby",
      go: "Go",
    }
    return langMap[ext || ""] || "Unknown"
  }

  const simulateAnalysis = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)

        // Complete analysis with mock results
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? {
                  ...file,
                  status: "completed",
                  progress: 100,
                  results: {
                    aiGenerated: {
                      score: Math.floor(Math.random() * 100),
                      confidence: Math.random() > 0.5 ? "High" : "Medium",
                      patterns: ["Repetitive code structure", "Generic variable names", "Lack of edge case handling"],
                    },
                    logicFlaws: {
                      count: Math.floor(Math.random() * 5),
                      severity: Math.random() > 0.5 ? "Medium" : "Low",
                      issues: [
                        { line: 42, type: "Null Pointer", description: "Potential null reference without check" },
                        { line: 78, type: "Logic Error", description: "Incorrect condition in loop" },
                      ],
                    },
                    apiMisuse: {
                      count: Math.floor(Math.random() * 3),
                      issues: [
                        { line: 23, api: "fetch()", issue: "Missing error handling" },
                        { line: 56, api: "localStorage", issue: "No availability check" },
                      ],
                    },
                    testCoverage: {
                      percentage: Math.floor(Math.random() * 40) + 60,
                      missing: ["error handling", "edge cases", "async operations"],
                    },
                    overallScore: Math.floor(Math.random() * 30) + 70,
                  },
                }
              : file,
          ),
        )
      } else {
        setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, progress } : file)))
      }
    }, 500)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  const handleProjectImported = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentView("project")
  }

  const handleFilesSelected = (files: FileNode[]) => {
    setSelectedFiles(files)
  }

  const handleBasicAnalysisComplete = (results: BasicAnalysisResult[]) => {
    setBasicAnalysisResults(results)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center shadow-lg animate-gold-glow">
                  <Trophy className="w-6 h-6 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">SniffAI</h1>
                <p className="text-sm text-gray-400 font-medium">AI-Powered Code Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={currentView === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("upload")}
                className={
                  currentView === "upload"
                    ? "bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
                    : "border-gray-600 text-white hover:bg-gray-800 bg-transparent font-medium"
                }
              >
                File Upload
              </Button>
              <Button
                variant={currentView === "explorer" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("explorer")}
                className={
                  currentView === "explorer"
                    ? "bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
                    : "border-gray-600 text-white hover:bg-gray-800 bg-transparent font-medium"
                }
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                File Explorer
              </Button>
              <Button
                variant={currentView === "project" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("project")}
                disabled={!currentProjectId}
                className={
                  currentView === "project"
                    ? "bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
                    : "border-gray-600 text-white hover:bg-gray-800 bg-transparent font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                }
              >
                Project Analysis
              </Button>
              <Button
                variant={currentView === "unified" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("unified")}
                className={
                  currentView === "unified"
                    ? "bg-gold text-black hover:bg-gold-light font-medium shadow-lg"
                    : "border-gray-600 text-white hover:bg-gray-800 bg-transparent font-medium"
                }
              >
                <Zap className="w-4 h-4 mr-2" />
                Unified Analyzer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {currentView === "unified" ? (
          // Unified Code Analyzer View
          <div className="max-w-6xl mx-auto">
            <UnifiedCodeAnalyzer />
          </div>
        ) : currentView === "explorer" ? (
          // File Explorer View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <FileExplorer onFilesSelected={handleFilesSelected} onAnalysisComplete={handleBasicAnalysisComplete} />
            </div>
            <div className="lg:col-span-2">
              <BasicAnalysisResults results={basicAnalysisResults} files={selectedFiles} />
            </div>
          </div>
        ) : (
          // Original Upload/Project View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <Card className="bg-black border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Upload className="w-5 h-5" />
                    <span>Upload Code</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Drop your code files here or click to browse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                      dragActive
                        ? "border-gold bg-gold/5 shadow-lg shadow-gold/20"
                        : "border-gray-700 hover:border-gold/50 hover:bg-gold/5"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileCode className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-sm text-gray-400 mb-4">
                      Supports: .js, .ts, .py, .java, .cpp, .c, .cs, .php, .rb, .go
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".js,.ts,.py,.java,.cpp,.c,.cs,.php,.rb,.go"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={handleChooseFiles}
                      className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
                    >
                      Choose Files
                    </Button>
                  </div>
                  <div className="mt-4">
                    <ProjectImportModal onProjectImported={handleProjectImported} />
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-black rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-white">{files.length}</div>
                      <div className="text-sm text-gray-400">Files Analyzed</div>
                    </div>
                    <div className="text-center p-4 bg-black rounded-lg border border-gray-800">
                      <div className="text-2xl font-bold text-white">
                        {files.filter((f) => f.status === "completed").length}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {currentView === "upload" ? (
              // Upload content
              <div className="lg:col-span-2">
                <Card className="bg-black border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Results</CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time code analysis with category-wise insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {files.length === 0 ? (
                      <div className="text-center py-12">
                        <Zap className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-white mb-2">Ready for Analysis</h3>
                        <p className="text-gray-400">Upload your code files to start the analysis</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {files.map((file) => (
                          <Card key={file.id} className="border-l-4 border-l-gold bg-black border-gray-800">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FileCode className="w-5 h-5 text-gold" />
                                  <div>
                                    <h4 className="font-medium text-white">{file.filename}</h4>
                                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                                      <span>{file.size}</span>
                                      <span>•</span>
                                      <Badge className="bg-gold/20 text-gold border-gold/30">{file.language}</Badge>
                                    </div>
                                  </div>
                                </div>
                                {file.status === "completed" && file.results && (
                                  <div className="flex items-center space-x-2">
                                    {getScoreIcon(file.results.overallScore)}
                                    <span className={`font-bold ${getScoreColor(file.results.overallScore)}`}>
                                      {file.results.overallScore}/100
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {file.status === "analyzing" && (
                                <div className="space-y-3">
                                  <div className="flex justify-between text-sm text-white">
                                    <span>Analyzing...</span>
                                    <span>{Math.round(file.progress)}%</span>
                                  </div>
                                  <Progress value={file.progress} className="h-3 bg-gray-800" />
                                  <div className="text-xs text-gray-400 text-center">
                                    Running comprehensive analysis suite
                                  </div>
                                </div>
                              )}

                              {file.status === "completed" && file.results && (
                                <CategoryResults results={file.results} filename={file.filename} />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : currentProjectId ? (
              <div className="lg:col-span-2">
                <ProjectAnalysis projectId={currentProjectId} />
              </div>
            ) : (
              <div className="lg:col-span-2">
                <Card className="bg-black border-gray-800">
                  <CardContent className="text-center py-12">
                    <p className="text-gray-400">No project selected</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
