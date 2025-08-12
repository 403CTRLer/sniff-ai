"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitBranch, AlertTriangle } from "lucide-react"
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
  const [accessToken, setAccessToken] = useState("")
  const { toast } = useToast()

  const cloneMutation = useMutation({
    mutationFn: (data: { repoUrl: string; branch: string; accessToken?: string }) =>
      apiService.cloneRepository(data.repoUrl, data.branch, data.accessToken),
    onSuccess: (data) => {
      toast({
        title: "Repository cloned",
        description: `Project "${data.projectName}" created successfully.`,
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
    const urlPattern = /^https?:\/\/.+\/.+/
    if (!urlPattern.test(repoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Git repository URL (e.g., https://github.com/user/repo).",
        variant: "destructive",
      })
      return
    }

    cloneMutation.mutate({
      repoUrl: repoUrl.trim(),
      branch: branch.trim() || "main",
      accessToken: accessToken.trim() || undefined,
    })
  }

  const resetModal = () => {
    setRepoUrl("")
    setBranch("main")
    setAccessToken("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5" />
            <span>Clone Repository</span>
          </DialogTitle>
          <DialogDescription>
            Clone a Git repository for analysis. We'll perform a shallow clone to save time and resources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="repo-url">Repository URL *</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={cloneMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={branch} onValueChange={setBranch} disabled={cloneMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">main</SelectItem>
                    <SelectItem value="master">master</SelectItem>
                    <SelectItem value="develop">develop</SelectItem>
                    <SelectItem value="dev">dev</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custom-branch">Custom Branch</Label>
                <Input
                  id="custom-branch"
                  placeholder="feature/branch-name"
                  value={
                    branch === "main" || branch === "master" || branch === "develop" || branch === "dev" ? "" : branch
                  }
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={cloneMutation.isPending}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="access-token">Access Token (Optional)</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="For private repositories"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={cloneMutation.isPending}
              />
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Public repositories</strong> don't require an access token. For private repositories, create a
              personal access token with repository read permissions.
            </AlertDescription>
          </Alert>

          {cloneMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to clone repository. Please check the URL and your access permissions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetModal} disabled={cloneMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={!repoUrl.trim() || cloneMutation.isPending}
              className="bg-gold text-black hover:bg-gold-light"
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
