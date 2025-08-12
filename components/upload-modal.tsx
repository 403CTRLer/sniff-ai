"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: () => void
}

interface FileWithPreview extends File {
  id: string
  preview?: string
}

export function UploadModal({ open, onOpenChange, onProjectCreated }: UploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => apiService.uploadFiles(files),
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Project "${data.projectName}" created successfully.`,
      })
      onProjectCreated()
      resetModal()
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithId = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
    }))
    setFiles((prev) => [...prev, ...filesWithId])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": [
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
        ".kt",
        ".swift",
      ],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (fileId: string) => {
    setFiles((files) => files.filter((file) => file.id !== fileId))
  }

  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      })
      return
    }

    uploadMutation.mutate(files)
  }

  const resetModal = () => {
    setFiles([])
    setUploadProgress(0)
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.name.endsWith(".zip")) {
      return <File className="w-4 h-4 text-yellow-500" />
    }
    return <File className="w-4 h-4 text-blue-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload individual files or ZIP archives for analysis. Supported formats include source code files and
            compressed archives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? "border-gold bg-gold/5" : "border-muted-foreground/25 hover:border-gold/50 hover:bg-gold/5"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                <p className="text-muted-foreground mb-4">or click to browse</p>
                <Button variant="outline" type="button">
                  Choose Files
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Supports: .js, .ts, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .zip (max 50MB)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Selected Files ({files.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={uploadMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetModal} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isPending}
              className="bg-gold text-black hover:bg-gold-light"
            >
              {uploadMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload & Analyze
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
