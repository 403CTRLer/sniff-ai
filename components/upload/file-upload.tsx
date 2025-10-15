"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClientOperations } from "@/lib/client-operations"
import type { ProjectFile } from "@/lib/models"
import JSZip from "jszip"
import { useRouter } from "next/navigation"

interface FileUploadProps {
  onProjectCreated?: (projectId: string) => void
  onClose?: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

const codeExtensions = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".cs",
  ".php",
  ".rb",
  ".go",
  ".rs",
  ".html",
  ".css",
  ".json",
  ".md",
  ".vue",
  ".swift",
  ".kt",
  ".scala",
  ".sh",
  ".yml",
  ".yaml",
  ".xml",
]

function isCodeFile(path: string): boolean {
  return codeExtensions.some((ext) => path.toLowerCase().endsWith(ext))
}

export function FileUpload({ onProjectCreated, onClose }: FileUploadProps) {
  const [projectName, setProjectName] = useState("")
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }))
    setUploadFiles((prev) => [...prev, ...newFiles])
    setError("")
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": codeExtensions,
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const processZipFile = async (file: File): Promise<ProjectFile[]> => {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    const projectFiles: ProjectFile[] = []

    for (const [path, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && isCodeFile(path)) {
        try {
          const content = await zipEntry.async("text")
          if (content.length < 1024 * 1024) {
            // Skip files larger than 1MB
            projectFiles.push({
              path,
              content,
              size: content.length,
            })
          }
        } catch (error) {
          console.warn(`Failed to process file ${path}:`, error)
        }
      }
    }

    return projectFiles
  }

  const handleUpload = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name")
      return
    }

    if (uploadFiles.length === 0) {
      setError("Please select files to upload")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const allProjectFiles: ProjectFile[] = []

      // Process each file
      for (const uploadFile of uploadFiles) {
        setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" } : f)))

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
        }

        try {
          if (uploadFile.file.name.endsWith(".zip")) {
            // Process ZIP file
            const zipFiles = await processZipFile(uploadFile.file)
            allProjectFiles.push(...zipFiles)
          } else {
            // Process single file
            const content = await uploadFile.file.text()
            if (content.length < 1024 * 1024) {
              // Skip files larger than 1MB
              allProjectFiles.push({
                path: uploadFile.file.name,
                content,
                size: content.length,
              })
            }
          }

          setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "completed" } : f)))
        } catch (error) {
          console.error(`Failed to process ${uploadFile.file.name}:`, error)
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: "Processing failed" } : f)),
          )
        }
      }

      if (allProjectFiles.length === 0) {
        setError("No valid code files found to analyze")
        return
      }

      // Create project using static method
      const project = await ClientOperations.createProject({
        name: projectName,
        sourceType: "upload",
        fileCount: allProjectFiles.length,
      })

      // Save project files using static method
      await ClientOperations.saveProjectFiles(project.id, allProjectFiles)

      // Create analysis run
      const analysisRun = await ClientOperations.createAnalysisRun(project.id, {
        includeAiDetection: true,
        includeSecurity: true,
        includeQuality: true,
        includeCoverage: true,
        includeApiValidation: true,
      })

      // Start analysis in background
      setTimeout(async () => {
        try {
          await ClientOperations.updateAnalysisRun(analysisRun.id, {
            status: "running",
            logs: ["Analysis started", `Processing ${allProjectFiles.length} files`],
          })

          const { AnalysisEngine } = await import("@/lib/analysis/analysis-engine")
          const engine = new AnalysisEngine()

          const results = await engine.analyzeProject(allProjectFiles, {
            includeAiDetection: true,
            includeSecurity: true,
            includeQuality: true,
            includeCoverage: true,
            includeApiValidation: true,
          })

          // Update run with results
          await ClientOperations.updateAnalysisRun(analysisRun.id, {
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
              `Processing ${allProjectFiles.length} files`,
              "Running code quality checks",
              "Analyzing security vulnerabilities",
              "Calculating AI detection score",
              "Analysis completed successfully",
            ],
          })

          engine.dispose()
        } catch (error) {
          console.error("Analysis failed:", error)
          await ClientOperations.updateAnalysisRun(analysisRun.id, {
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

      // Navigate to project page
      router.push(`/projects/${project.id}`)
      onProjectCreated?.(project.id)
      onClose?.()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "uploading":
        return <LoadingSpinner size="sm" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name" className="text-white">
          Project Name
        </Label>
        <Input
          id="project-name"
          placeholder="Enter project name..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-[#0D0D0D] border-[#333333] text-white placeholder:text-muted-foreground"
        />
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-[#D4AF37] bg-[#D4AF37]/5"
            : "border-[#333333] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-[#D4AF37] mb-4" />
        <p className="text-lg font-medium text-white mb-2">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">or click to select files (ZIP, JS, TS, PY, JAVA, etc.)</p>
        <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
      </div>

      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Selected Files</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center justify-between p-3 bg-[#0D0D0D] rounded-lg border border-[#333333]"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(uploadFile.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.error && <p className="text-xs text-red-400">{uploadFile.error}</p>}
                  </div>
                </div>
                {uploadFile.status === "uploading" && (
                  <div className="w-20">
                    <Progress value={uploadFile.progress} className="h-2" />
                  </div>
                )}
                {uploadFile.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                    className="hover:bg-[#333333]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert className="border-red-400 bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose} className="border-[#333333] hover:border-[#D4AF37] bg-transparent">
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || uploadFiles.length === 0 || !projectName.trim()}
          className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
        >
          {isUploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            "Start Analysis"
          )}
        </Button>
      </div>
    </div>
  )
}
