"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, X, AlertTriangle, CheckCircle } from "lucide-react"
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
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { toast } = useToast()

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      try {
        const result = await apiService.uploadFiles(files)
        clearInterval(progressInterval)
        setUploadProgress(100)
        return result
      } catch (error) {
        clearInterval(progressInterval)
        throw error
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Project "${data.projectName}" created and analysis started.`,
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
      setUploadProgress(0)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const errors: string[] = []

    // Handle rejected files
    rejectedFiles.forEach(({ file, errors: fileErrors }) => {
      fileErrors.forEach((error: any) => {
        if (error.code === "file-too-large") {
          errors.push(`${file.name} is too large (max 5MB)`)
        } else if (error.code === "file-invalid-type") {
          errors.push(`${file.name} has unsupported format`)
        }
      })
    })

    setValidationErrors(errors)

    const filesWithId = acceptedFiles.map((file) => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
    }))

    setFiles((prev) => [...prev, ...filesWithId])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/javascript": [".js", ".jsx"],
      "text/typescript": [".ts", ".tsx"],
      "text/x-python": [".py"],
      "text/x-java-source": [".java"],
      "text/x-c": [".c", ".cpp", ".h"],
      "text/x-csharp": [".cs"],
      "text/x-php": [".php"],
      "text/x-ruby": [".rb"],
      "text/x-go": [".go"],
      "text/x-rust": [".rs"],
      "text/x-kotlin": [".kt"],
      "text/x-swift": [".swift"],
      "application/json": [".json"],
      "text/yaml": [".yaml", ".yml"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB per file
    maxFiles: 50,
  })

  const removeFile = (fileId: string) => {
    setFiles((files) => files.filter((file) => file.id !== fileId))
    setValidationErrors([])
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
    setValidationErrors([])
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
    const ext = file.name.split(".").pop()?.toLowerCase()
    const colors = {
      js: "text-yellow-500",
      jsx: "text-blue-500",
      ts: "text-blue-600",
      tsx: "text-blue-600",
      py: "text-green-500",
      java: "text-red-500",
      cpp: "text-purple-500",
      c: "text-purple-500",
      cs: "text-purple-600",
      php: "text-indigo-500",
      rb: "text-red-600",
      go: "text-cyan-500",
      rs: "text-orange-500",
      kt: "text-orange-600",
      swift: "text-orange-400",
      json: "text-yellow-600",
      yaml: "text-green-600",
      yml: "text-green-600",
      md: "text-gray-500",
    }

    return <File className={`w-4 h-4 ${colors[ext as keyof typeof colors] || "text-gray-400"}`} />
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const isOverLimit = totalSize > 50 * 1024 * 1024 // 50MB total limit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Code Files</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload source code files for comprehensive analysis. Supported formats include JavaScript, TypeScript,
            Python, Java, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? "border-gold bg-gold/5" : "border-gray-600 hover:border-gold/50 hover:bg-gold/5"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg font-medium text-white">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2 text-white">Drag & drop code files here</p>
                <p className="text-gray-400 mb-4">or click to browse</p>
                <Button
                  variant="outline"
                  type="button"
                  className="border-gold/50 text-gold hover:bg-gold/10 bg-transparent"
                >
                  Choose Files
                </Button>
              </div>
            )}
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>Supported: .js, .ts, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .kt, .swift</p>
              <p>Max file size: 5MB • Max total: 50MB • Max files: 50</p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Selected Files ({files.length})</h4>
                <div className="text-sm text-gray-400">
                  Total: {formatFileSize(totalSize)}
                  {isOverLimit && <span className="text-red-400 ml-2">• Exceeds 50MB limit</span>}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-800 rounded-lg p-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={uploadMutation.isPending}
                      className="text-gray-400 hover:text-white"
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
              <div className="flex justify-between text-sm text-white">
                <span>Uploading and processing files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-gray-800" />
              <p className="text-xs text-gray-400">Files are being uploaded and analysis will start automatically</p>
            </div>
          )}

          {/* Success State */}
          {uploadMutation.isSuccess && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Files uploaded successfully! Analysis is now running.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={resetModal}
              disabled={uploadMutation.isPending}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isPending || isOverLimit}
              className="bg-gold text-black hover:bg-gold-light font-medium"
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
