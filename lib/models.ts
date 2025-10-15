export interface Project {
  id: string
  name: string
  sourceType: "upload" | "local" | "git"
  sourceUrl?: string
  branch?: string
  createdAt: Date
  updatedAt: Date
  fileCount?: number
  totalSize?: number
  files?: ProjectFile[]
}

export interface ProjectFile {
  path: string
  content: string
  size: number
  type: string
}

export interface AnalysisRun {
  id: string
  projectId: string
  status: "queued" | "running" | "completed" | "failed"
  startedAt: Date
  completedAt?: Date
  logs: string[]
  results?: AnalysisResults
  error?: string
}

export interface AnalysisResults {
  aiDetection: {
    likelihood: number
    confidence: number
    flaggedFiles: string[]
  }
  issues: Issue[]
  testCoverage: TestCoverage
  apiIssues: ApiIssue[]
  securityIssues: SecurityIssue[]
}

export type Finding = Issue | ApiIssue | SecurityIssue

export interface TestCoverage {
  overall: number
  filesCovered: number
  totalFiles: number
  coverageByFile: Record<string, number>
}

export interface Issue {
  id: string
  file: string
  line: number
  column: number
  severity: "low" | "medium" | "high" | "critical"
  category: "style" | "bug" | "performance" | "maintainability"
  message: string
  suggestion?: string
  code?: string
}

export interface ApiIssue {
  id: string
  file: string
  line: number
  type: "deprecated" | "misuse" | "missing-validation" | "rate-limit"
  api: string
  message: string
  suggestion?: string
}

export interface SecurityIssue {
  id: string
  file: string
  line: number
  severity: "low" | "medium" | "high" | "critical"
  type: "injection" | "xss" | "auth" | "crypto" | "secrets"
  message: string
  cwe?: string
  suggestion?: string
}
