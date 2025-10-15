"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FolderOpen, AlertCircle } from "lucide-react"
import { ClientOperations } from "@/lib/client-operations"
import type { ProjectFile } from "@/lib/models"

interface FolderUploadProps {
  onProjectCreated?: (projectId: string) => void
  onClose?: () => void
}

export function FolderUpload({ onProjectCreated, onClose }: FolderUploadProps) {
  const [projectName, setProjectName] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const isCodeFile = (path: string): boolean => {
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
    ]
    return codeExtensions.some((ext) => path.toLowerCase().endsWith(ext))
  }

  const processDirectory = async (dirHandle: any, basePath = ""): Promise<ProjectFile[]> => {
    const files: ProjectFile[] = []

    for await (const [name, handle] of dirHandle.entries()) {
      const path = basePath ? `${basePath}/${name}` : name

      if (handle.kind === "file" && isCodeFile(name)) {
        try {
          const file = await handle.getFile()
          const content = await file.text()
          files.push({
            path,
            content,
            size: content.length,
          })
        } catch (error) {
          console.warn(`Failed to read file ${path}:`, error)
        }
      } else if (handle.kind === "directory" && !name.startsWith(".") && name !== "node_modules") {
        // Recursively process subdirectories, excluding hidden and node_modules
        const subFiles = await processDirectory(handle, path)
        files.push(...subFiles)
      }
    }

    return files
  }

  const handleFolderSelect = async () => {
    try {
      // Check if the File System Access API is supported
      if (!("showDirectoryPicker" in window)) {
        setError("Folder selection is not supported in this browser. Please use Chrome or Edge.")
        return
      }

      const dirHandle = await (window as any).showDirectoryPicker()
      setSelectedFolder(dirHandle.name)
      if (!projectName) {
        setProjectName(dirHandle.name)
      }
      setError("")
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Failed to select folder")
      }
    }
  }

  const handleUpload = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name")
      return
    }

    if (!selectedFolder) {
      setError("Please select a folder")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // Re-select the directory to get the handle
      const dirHandle = await (window as any).showDirectoryPicker()

      // Process all files in the directory
      const projectFiles = await processDirectory(dirHandle)

      if (projectFiles.length === 0) {
        setError("No code files found in the selected folder")
        return
      }

      // Create project
      const project = await ClientOperations.createProject({
        name: projectName,
        sourceType: "local",
        sourceUrl: selectedFolder,
        fileCount: projectFiles.length,
      })

      await ClientOperations.saveProjectFiles(project.id, projectFiles)

      const analysisRun = await ClientOperations.createAnalysisRun(project.id)

      // Import and start analysis
      const { AnalysisEngine } = await import("@/lib/analysis/analysis-engine")
      const engine = new AnalysisEngine()

      // Start analysis in background
      engine.analyzeProject(project.id, analysisRun.id, projectFiles).catch(console.error)

      onProjectCreated?.(project.id)
      onClose?.()
    } catch (err) {
      console.error("Folder upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
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

      <div className="space-y-4">
        <Label className="text-white">Select Project Folder</Label>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleFolderSelect}
            className="border-[#333333] hover:border-[#D4AF37] bg-transparent"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Choose Folder
          </Button>
          {selectedFolder && <span className="text-sm text-muted-foreground">Selected: {selectedFolder}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          Select a local folder containing your project files. All code files will be recursively scanned.
        </p>
      </div>

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
          disabled={isUploading || !selectedFolder || !projectName.trim()}
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
