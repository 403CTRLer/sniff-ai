"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "./file-upload"
import { FolderUpload } from "./folder-upload"
import { GitClone } from "./git-clone"
import { Upload, FolderOpen, GitBranch } from "lucide-react"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated?: (projectId: string) => void
}

export function UploadModal({ open, onOpenChange, onProjectCreated }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState("file")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1A1A1A] border-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Project for Analysis</DialogTitle>
          <DialogDescription>
            Choose how you'd like to upload your code for AI detection, security analysis, and quality review.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#333333]">
            <TabsTrigger value="file" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]">
              <Upload className="w-4 h-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="folder" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]">
              <FolderOpen className="w-4 h-4 mr-2" />
              Folder
            </TabsTrigger>
            <TabsTrigger value="git" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0D0D0D]">
              <GitBranch className="w-4 h-4 mr-2" />
              Git Repo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-6">
            <FileUpload onProjectCreated={onProjectCreated} onClose={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="folder" className="mt-6">
            <FolderUpload onProjectCreated={onProjectCreated} onClose={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="git" className="mt-6">
            <GitClone onProjectCreated={onProjectCreated} onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
