"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GitBranch, AlertCircle, Info } from "lucide-react"
import { ClientOperations } from "@/lib/client-operations"
import type { ProjectFile } from "@/lib/models"
import JSZip from "jszip"
import { useRouter } from "next/navigation"

interface GitCloneProps {
  onProjectCreated?: (projectId: string) => void
  onClose?: () => void
}

export function GitClone({ onProjectCreated, onClose }: GitCloneProps) {
  const [projectName, setProjectName] = useState("")
  const [gitUrl, setGitUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [isCloning, setIsCloning] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleGitUrlChange = (url: string) => {
    setGitUrl(url)
    if (!projectName && url) {
      // Extract project name from Git URL
      const match = url.match(/\/([^/]+?)(?:\.git)?(?:\/)?$/)
      if (match) {
        setProjectName(match[1])
      }
    }
    setError("")
  }

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
      ".vue",
      ".swift",
      ".kt",
      ".scala",
      ".sh",
      ".yml",
      ".yaml",
      ".xml",
    ]
    return codeExtensions.some((ext) => path.toLowerCase().endsWith(ext))
  }

  const fetchRepositoryAsZip = async (url: string, branch: string): Promise<ProjectFile[]> => {
    if (!url.includes("github.com")) {
      throw new Error("Only GitHub repositories are currently supported")
    }

    const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/)
    if (!match) {
      throw new Error("Invalid GitHub repository URL")
    }

    const [, owner, repo] = match

    // Try multiple approaches for fetching the repository
    const approaches = [
      // Approach 1: Direct GitHub ZIP download
      async () => {
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(zipUrl)}`)
        if (!response.ok) throw new Error(`ZIP download failed: ${response.statusText}`)
        return response.arrayBuffer()
      },

      // Approach 2: GitHub API with file contents
      async () => {
        return await fetchViaGitHubAPI(owner, repo, branch)
      },
    ]

    for (const approach of approaches) {
      try {
        const result = await approach()

        if (result instanceof ArrayBuffer) {
          // Process ZIP file
          const zip = new JSZip()
          const zipContent = await zip.loadAsync(result)
          const projectFiles: ProjectFile[] = []

          for (const [path, zipEntry] of Object.entries(zipContent.files)) {
            if (!zipEntry.dir && isCodeFile(path)) {
              try {
                const content = await zipEntry.async("text")
                // Remove the root folder from the path
                const cleanPath = path.split("/").slice(1).join("/")
                if (cleanPath && content.length < 1024 * 1024) {
                  // Skip files larger than 1MB
                  projectFiles.push({
                    path: cleanPath,
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
        } else {
          // Result is already ProjectFile[]
          return result as ProjectFile[]
        }
      } catch (error) {
        console.warn("Approach failed, trying next:", error)
        continue
      }
    }

    throw new Error("All repository fetch methods failed. Please check the repository URL and try again.")
  }

  const fetchViaGitHubAPI = async (owner: string, repo: string, branch: string): Promise<ProjectFile[]> => {
    const projectFiles: ProjectFile[] = []

    try {
      // Get repository tree
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
      if (!treeResponse.ok) {
        throw new Error(`GitHub API error: ${treeResponse.statusText}`)
      }

      const treeData = await treeResponse.json()
      const codeFiles = treeData.tree.filter((item: any) => item.type === "blob" && isCodeFile(item.path)).slice(0, 100) // Limit to 100 files to avoid rate limits

      // Fetch file contents in batches
      const batchSize = 10
      for (let i = 0; i < codeFiles.length; i += batchSize) {
        const batch = codeFiles.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (file: any) => {
            try {
              const fileResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
              )
              if (fileResponse.ok) {
                const fileData = await fileResponse.json()
                if (fileData.content && fileData.size < 1024 * 1024) {
                  // Skip files larger than 1MB
                  const content = atob(fileData.content.replace(/\n/g, ""))
                  projectFiles.push({
                    path: file.path,
                    content,
                    size: content.length,
                  })
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch file ${file.path}:`, error)
            }
          }),
        )

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < codeFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      return projectFiles
    } catch (error) {
      throw new Error(`GitHub API error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleClone = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name")
      return
    }

    if (!gitUrl.trim()) {
      setError("Please enter a Git repository URL")
      return
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/
    if (!urlPattern.test(gitUrl)) {
      setError("Please enter a valid Git repository URL (must start with http:// or https://)")
      return
    }

    setIsCloning(true)
    setError("")

    try {
      const projectFiles = await fetchRepositoryAsZip(gitUrl, branch)

      if (projectFiles.length === 0) {
        setError("No code files found in the repository")
        return
      }

      // Create project
      const project = await ClientOperations.createProject({
        name: projectName,
        sourceType: "git",
        sourceUrl: gitUrl,
        branch,
        fileCount: projectFiles.length,
      })

      await ClientOperations.saveProjectFiles(project.id, projectFiles)

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
            logs: ["Analysis started", `Processing ${projectFiles.length} files`],
          })

          const { AnalysisEngine } = await import("@/lib/analysis/analysis-engine")
          const engine = new AnalysisEngine()

          const results = await engine.analyzeProject(projectFiles, {
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
              `Processing ${projectFiles.length} files`,
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
      console.error("Git clone error:", err)
      setError(err instanceof Error ? err.message : "Clone failed")
    } finally {
      setIsCloning(false)
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

      <div className="space-y-2">
        <Label htmlFor="git-url" className="text-white">
          Git Repository URL
        </Label>
        <Input
          id="git-url"
          placeholder="https://github.com/username/repository.git"
          value={gitUrl}
          onChange={(e) => handleGitUrlChange(e.target.value)}
          className="bg-[#0D0D0D] border-[#333333] text-white placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="branch" className="text-white">
          Branch
        </Label>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="bg-[#0D0D0D] border-[#333333] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#333333]">
            <SelectItem value="main">main</SelectItem>
            <SelectItem value="master">master</SelectItem>
            <SelectItem value="develop">develop</SelectItem>
            <SelectItem value="dev">dev</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert className="border-[#D4AF37] bg-[#D4AF37]/5">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-[#D4AF37]">
          Only public GitHub repositories are supported. The repository will be downloaded and processed in your
          browser.
        </AlertDescription>
      </Alert>

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
          onClick={handleClone}
          disabled={isCloning || !gitUrl.trim() || !projectName.trim()}
          className="bg-[#D4AF37] hover:bg-[#FFD700] text-[#0D0D0D] font-semibold"
        >
          {isCloning ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Cloning...
            </>
          ) : (
            <>
              <GitBranch className="mr-2 h-4 w-4" />
              Clone & Analyze
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
