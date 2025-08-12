// AI Service for Code Generation and Suggestions
export interface CodeGenerationRequest {
  context: string
  fileType: string
  requirements: string[]
  analysisResults?: any
}

export interface SuggestionRequest {
  code: string
  issues: any[]
  fileType: string
  context?: string
}

export interface GeneratedCode {
  code: string
  explanation: string
  improvements: string[]
  testSuggestions?: string[]
}

export interface AISuggestion {
  id: string
  type: "fix" | "improvement" | "refactor" | "test"
  title: string
  description: string
  code: string
  explanation: string
  confidence: number
}

class AIService {
  private async request<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("AI Service request failed:", error)
      throw error
    }
  }

  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    return this.request<GeneratedCode>("/api/ai/generate-code", request)
  }

  async getSuggestions(request: SuggestionRequest): Promise<AISuggestion[]> {
    return this.request<AISuggestion[]>("/api/ai/suggestions", request)
  }
}

export const aiService = new AIService()
