"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Github, FolderOpen, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { apiService } from "@/lib/api"

interface ProjectImportModalProps {
  onProjectImported: (projectId: string) => void
}

export function ProjectImportModal({ onProjectImported }: ProjectImportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // GitHub import state
  const [githubUrl, setGithubUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [accessToken, setAccessToken] = useState("")

  // Local path state
  const [localPath, setLocalPath] = useState("")

  const handleGithubImport = async () => {
    if (!githubUrl.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    // Basic GitHub URL validation
    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+/
    if (!githubUrlPattern.test(githubUrl)) {
      setError("Please enter a valid GitHub repository URL")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiService.importProject({
        source: "github",
        githubUrl: githubUrl.trim(),
        branch: branch.trim() || "main",
        accessToken: accessToken.trim() || undefined,
      })

      if (response.success && response.projectId) {
        setSuccess("GitHub project imported successfully!")
        onProjectImported(response.projectId)
        setTimeout(() => {
          setIsOpen(false)
          resetForm()
        }, 1500)
      } else {
        setError("Failed to import GitHub project")
      }
    } catch (err) {
      console.error("GitHub import error:", err)
      setError(err instanceof Error ? err.message : "Failed to import GitHub repository")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalImport = async () => {
    if (!localPath.trim()) {
      setError("Please enter a local project path")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiService.importProject({
        source: "local",
        path: localPath.trim(),
      })

      if (response.success && response.projectId) {
        setSuccess("Local project imported successfully!")
        onProjectImported(response.projectId)
        setTimeout(() => {
          setIsOpen(false)
          resetForm()
        }, 1500)
      } else {
        setError("Failed to import local project")
      }
    } catch (err) {
      console.error("Local import error:", err)
      setError(err instanceof Error ? err.message : "Failed to import local project")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setGithubUrl("")
    setBranch("main")
    setAccessToken("")
    setLocalPath("")
    setError(null)
    setSuccess(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-gold/50 text-gold hover:bg-gold/10 bg-transparent font-medium"
          onClick={() => setIsOpen(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Import Project</DialogTitle>
          <DialogDescription className="text-gray-400">
            Import a complete project from GitHub or a local directory path for comprehensive analysis
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="github" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800">
            <TabsTrigger
              value="github"
              className="data-[state=active]:bg-gold data-[state=active]:text-black text-gray-300 hover:text-white"
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </TabsTrigger>
            <TabsTrigger
              value="local"
              className="data-[state=active]:bg-gold data-[state=active]:text-black text-gray-300 hover:text-white"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Local Path
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="github-url" className="text-white font-medium">
                  Repository URL *
                </Label>
                <Input
                  id="github-url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch" className="text-white font-medium">
                    Branch
                  </Label>
                  <Input
                    id="branch"
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
                  />
                </div>
                <div>
                  <Label htmlFor="access-token" className="text-white font-medium">
                    Access Token (Optional)
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="For private repos"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
                  />
                </div>
              </div>

              <Alert className="bg-gold/10 border-gold/30">
                <Github className="h-4 w-4 text-gold" />
                <AlertDescription className="text-white">
                  <strong>Public repositories</strong> don't require an access token. For private repositories, create a
                  personal access token with repository read permissions.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGithubImport}
                disabled={isLoading || !githubUrl.trim()}
                className="w-full bg-gold text-black hover:bg-gold-light font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    Import from GitHub
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="local" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="local-path" className="text-white font-medium">
                  Project Directory Path *
                </Label>
                <Input
                  id="local-path"
                  placeholder="/path/to/your/project"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
                />
              </div>

              <Alert className="bg-gold/10 border-gold/30">
                <FolderOpen className="h-4 w-4 text-gold" />
                <AlertDescription className="text-white">
                  Enter the full path to your project directory. The system will scan all files in the directory and
                  subdirectories for analysis. Ensure the path is accessible to the analysis server.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-gray-400 space-y-1">
                <p className="text-white font-medium">Examples:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>/Users/username/projects/my-app</li>
                  <li>C:\Users\username\Documents\projects\my-app</li>
                  <li>/home/user/workspace/my-project</li>
                </ul>
              </div>

              <Button
                onClick={handleLocalImport}
                disabled={isLoading || !localPath.trim()}
                className="w-full bg-gold text-black hover:bg-gold-light font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Import Local Project
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
