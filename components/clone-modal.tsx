"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { GitBranch, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CloneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
}

export function CloneModal({ open, onOpenChange, onProjectCreated }: CloneModalProps) {
  const [repoUrl, setRepoUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [customBranch, setCustomBranch] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [cloneProgress, setCloneProgress] = useState(0)
  const { toast } = useToast()

  const cloneMutation = useMutation({
    mutationFn: async (data: { repoUrl: string; branch: string; accessToken?: string }) => {
      setCloneProgress(0)

      // Simulate clone progress
      const progressInterval = setInterval(() => {
        setCloneProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 300)

      try {
        const result = await apiService.cloneRepository(data.repoUrl, data.branch, data.accessToken)
        clearInterval(progressInterval)
        setCloneProgress(100)
        return result
      } catch (error) {
        clearInterval(progressInterval)
        throw error
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Repository cloned",
        description: `Project "${data.projectName}" created and analysis started.`,
      })
      onProjectCreated()
      resetModal()
    },
    onError: (error) => {
      toast({
        title: "Clone failed",
        description: error.message || "Failed to clone repository. Please check the URL and try again.",
        variant: "destructive",
      })
      setCloneProgress(0)
    },
  })

  const handleClone = () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Repository URL required",
        description: "Please enter a valid Git repository URL.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/github\.com\/[^/]+\/[^/]+/
    if (!urlPattern.test(repoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo).",
        variant: "destructive",
      })
      return
    }

    const finalBranch = customBranch.trim() || branch

    cloneMutation.mutate({
      repoUrl: repoUrl.trim(),
      branch: finalBranch,
      accessToken: accessToken.trim() || undefined,
    })
  }

  const resetModal = () => {
    setRepoUrl("")
    setBranch("main")
    setCustomBranch("")
    setAccessToken("")
    setCloneProgress(0)
    onOpenChange(false)
  }

  const isValidUrl = repoUrl && /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(repoUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <GitBranch className="w-5 h-5" />
            <span>Clone GitHub Repository</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Clone a GitHub repository for comprehensive code analysis. We'll fetch the source code and run automated
            analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="repo-url" className="text-white font-medium">
                Repository URL *
              </Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={cloneMutation.isPending}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
              />
              {repoUrl && !isValidUrl && (
                <p className="text-sm text-red-400 mt-1">Please enter a valid GitHub repository URL</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch" className="text-white font-medium">
                  Branch
                </Label>
                <Select value={branch} onValueChange={setBranch} disabled={cloneMutation.isPending}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="main" className="text-white hover:bg-gray-800">
                      main
                    </SelectItem>
                    <SelectItem value="master" className="text-white hover:bg-gray-800">
                      master
                    </SelectItem>
                    <SelectItem value="develop" className="text-white hover:bg-gray-800">
                      develop
                    </SelectItem>
                    <SelectItem value="dev" className="text-white hover:bg-gray-800">
                      dev
                    </SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-gray-800">
                      Custom...
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custom-branch" className="text-white font-medium">
                  Custom Branch {branch === "custom" && "*"}
                </Label>
                <Input
                  id="custom-branch"
                  placeholder="feature/branch-name"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  disabled={cloneMutation.isPending || branch !== "custom"}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="access-token" className="text-white font-medium">
                Access Token (Optional)
              </Label>
              <Input
                id="access-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={cloneMutation.isPending}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-gold focus:ring-gold"
              />
            </div>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-400">
              <strong>Public repositories</strong> don't require an access token. For private repositories, create a
              personal access token with repository read permissions in your GitHub settings.
            </AlertDescription>
          </Alert>

          {/* Clone Progress */}
          {cloneMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white">
                <span>Cloning repository and analyzing code...</span>
                <span>{Math.round(cloneProgress)}%</span>
              </div>
              <Progress value={cloneProgress} className="h-2 bg-gray-800" />
              <p className="text-xs text-gray-400">Fetching source code and starting automated analysis</p>
            </div>
          )}

          {/* Success State */}
          {cloneMutation.isSuccess && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Repository cloned successfully! Analysis is now running.
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {cloneMutation.isError && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                Failed to clone repository. Please check the URL, branch name, and your access permissions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={resetModal}
              disabled={cloneMutation.isPending}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={!isValidUrl || cloneMutation.isPending || (branch === "custom" && !customBranch.trim())}
              className="bg-gold text-black hover:bg-gold-light font-medium"
            >
              {cloneMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <GitBranch className="w-4 h-4 mr-2" />
              )}
              Clone & Analyze
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
