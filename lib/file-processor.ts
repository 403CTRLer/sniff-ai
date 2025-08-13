export interface ProcessedFile {
  name: string
  path: string
  content: string
  size: number
  type: string
}

export class FileProcessor {
  private supportedExtensions = [
    ".js",
    ".jsx",
    ".ts",
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
    ".json",
    ".yaml",
    ".yml",
    ".md",
    ".txt",
  ]

  async processUploadedFiles(files: File[]): Promise<ProcessedFile[]> {
    const processedFiles: ProcessedFile[] = []

    for (const file of files) {
      try {
        if (this.isSupported(file.name)) {
          const content = await this.readFileContent(file)
          processedFiles.push({
            name: file.name,
            path: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
          })
        }
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error)
      }
    }

    return processedFiles
  }

  private isSupported(filename: string): boolean {
    return this.supportedExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const content = event.target?.result as string
        resolve(content || "")
      }

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`))
      }

      reader.readAsText(file)
    })
  }

  validateFiles(files: File[]): { valid: File[]; errors: string[] } {
    const valid: File[] = []
    const errors: string[] = []
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const maxTotalSize = 50 * 1024 * 1024 // 50MB

    let totalSize = 0

    for (const file of files) {
      if (file.size > maxFileSize) {
        errors.push(`File ${file.name} is too large (max 5MB)`)
        continue
      }

      if (!this.isSupported(file.name)) {
        errors.push(`File ${file.name} has unsupported format`)
        continue
      }

      totalSize += file.size
      if (totalSize > maxTotalSize) {
        errors.push("Total upload size exceeds 50MB limit")
        break
      }

      valid.push(file)
    }

    return { valid, errors }
  }
}

export const fileProcessor = new FileProcessor()
