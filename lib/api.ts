export interface FileAnalysisRequest {
  files: File[]
  options: {
    includeAiDetection: boolean
    includeLogicAnalysis: boolean
    includeApiAnalysis: boolean
    includeTestCoverage: boolean
  }
}

export interface ProjectImportRequest {
  source: "github" | "local"
  githubUrl?: string
  branch?: string
  accessToken?: string
  path?: string
  files?: File[]
}

export interface AnalysisStatus {
  analysisId: string
  status: "processing" | "completed" | "failed"
  progress: number
  estimatedTimeRemaining?: number
}

export interface FileAnalysisResult {
  filename: string
  results: any
}

export interface ProjectImportResponse {
  success: boolean
  projectId: string
  message?: string
  error?: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api"
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async uploadFiles(request: FileAnalysisRequest): Promise<{ analysisId: string }> {
    const formData = new FormData()

    request.files.forEach((file) => {
      formData.append("files", file)
    })

    formData.append("options", JSON.stringify(request.options))

    return this.request<{ analysisId: string }>("/analyze/files", {
      method: "POST",
      body: formData,
    })
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    return this.request<AnalysisStatus>(`/analyze/status/${analysisId}`)
  }

  async getAnalysisResults(analysisId: string): Promise<FileAnalysisResult[]> {
    const response = await this.request<{ results: FileAnalysisResult[] }>(`/analyze/results/${analysisId}`)
    return response.results
  }

  async importProject(request: ProjectImportRequest): Promise<ProjectImportResponse> {
    return this.request<ProjectImportResponse>("/projects/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
  }

  async getProjectAnalysis(projectId: string): Promise<any> {
    const response = await this.request<{ analysis: any }>(`/projects/${projectId}/analysis`)
    return response.analysis
  }

  async getCommitAnalysis(projectId: string): Promise<any> {
    const response = await this.request<{ commitAnalysis: any }>(`/projects/${projectId}/commits/latest/analysis`)
    return response.commitAnalysis
  }
}

export const apiService = new ApiService()
