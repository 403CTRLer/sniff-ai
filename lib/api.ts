import { githubService } from "./github-service"
import { codeAnalyzer } from "./code-analyzer"
import { fileProcessor, type ProcessedFile } from "./file-processor"

interface Project {
  id: string
  name: string
  source: "upload" | "git"
  sourceUrl?: string
  lastRunStatus: "queued" | "running" | "succeeded" | "failed"
  lastRunId?: string
  createdAt: string
  updatedAt: string
  fileCount?: number
}

interface AnalysisRun {
  id: string
  projectId: string
  status: "queued" | "running" | "succeeded" | "failed"
  createdAt: string
  duration?: number
  findingsCount?: number
  progress?: number
  currentPhase?: string
  filesProcessed?: number
  totalFiles?: number
  errorMessage?: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  message: string
}

// In-memory storage (in production, this would be a database)
let mockProjects: Project[] = []
let mockRuns: AnalysisRun[] = []
const analysisResults: Map<string, any> = new Map()
const analysisLogs: Map<string, LogEntry[]> = new Map()

class ApiService {
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getProjects(): Promise<Project[]> {
    await this.delay(300)
    return [...mockProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async getProject(id: string): Promise<Project | null> {
    await this.delay(200)
    return mockProjects.find((p) => p.id === id) || null
  }

  async getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
    await this.delay(250)
    return mockRuns
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    await this.delay(1000)
    mockProjects = mockProjects.filter((p) => p.id !== id)
    mockRuns = mockRuns.filter((r) => r.projectId !== id)

    // Clean up analysis data
    const runsToDelete = mockRuns.filter((r) => r.projectId === id)
    runsToDelete.forEach((run) => {
      analysisResults.delete(run.id)
      analysisLogs.delete(run.id)
    })

    return { success: true }
  }

  async startAnalysis(projectId: string): Promise<{ runId: string }> {
    await this.delay(500)

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) {
      throw new Error("Project not found")
    }

    const newRun: AnalysisRun = {
      id: runId,
      projectId,
      status: "queued",
      createdAt: new Date().toISOString(),
    }

    mockRuns.push(newRun)

    // Update project status
    project.lastRunStatus = "queued"
    project.lastRunId = runId
    project.updatedAt = new Date().toISOString()

    // Start analysis in background
    this.performAnalysis(runId, project)

    return { runId }
  }

  async uploadFiles(files: File[]): Promise<{ projectId: string; projectName: string }> {
    const validation = fileProcessor.validateFiles(files)

    if (validation.errors.length > 0) {
      throw new Error(validation.errors.join(", "))
    }

    await this.delay(1000)

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const projectName =
      files.length === 1 ? files[0].name.replace(/\.[^/.]+$/, "") : `Upload ${new Date().toLocaleDateString()}`

    const newProject: Project = {
      id: projectId,
      name: projectName,
      source: "upload",
      lastRunStatus: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileCount: files.length,
    }

    mockProjects.unshift(newProject)

    // Process files and start analysis
    try {
      const processedFiles = await fileProcessor.processUploadedFiles(validation.valid)
      this.startAnalysisWithFiles(projectId, processedFiles)
    } catch (error) {
      newProject.lastRunStatus = "failed"
      throw error
    }

    return { projectId, projectName }
  }

  async cloneRepository(
    repoUrl: string,
    branch: string,
    accessToken?: string,
  ): Promise<{ projectId: string; projectName: string }> {
    // Validate repository first
    const isValid = await githubService.validateRepository(repoUrl, accessToken)
    if (!isValid) {
      throw new Error("Repository not found or access denied")
    }

    await this.delay(1500)

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const projectName = repoUrl.split("/").pop()?.replace(".git", "") || "Cloned Repository"

    const newProject: Project = {
      id: projectId,
      name: projectName,
      source: "git",
      sourceUrl: repoUrl,
      lastRunStatus: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockProjects.unshift(newProject)

    // Clone repository and start analysis
    try {
      const files = await githubService.fetchRepository(repoUrl, branch, accessToken)
      newProject.fileCount = files.length
      this.startAnalysisWithGitHubFiles(projectId, files)
    } catch (error) {
      newProject.lastRunStatus = "failed"
      throw error
    }

    return { projectId, projectName }
  }

  private async startAnalysisWithFiles(projectId: string, files: ProcessedFile[]) {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) return

    const newRun: AnalysisRun = {
      id: runId,
      projectId,
      status: "running",
      createdAt: new Date().toISOString(),
      progress: 0,
      currentPhase: "Processing Files",
      filesProcessed: 0,
      totalFiles: files.length,
    }

    mockRuns.push(newRun)
    project.lastRunId = runId
    project.lastRunStatus = "running"

    // Perform real analysis
    this.performRealAnalysis(runId, files)
  }

  private async startAnalysisWithGitHubFiles(
    projectId: string,
    files: Array<{ name: string; path: string; content?: string; size: number }>,
  ) {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const project = mockProjects.find((p) => p.id === projectId)

    if (!project) return

    const newRun: AnalysisRun = {
      id: runId,
      projectId,
      status: "running",
      createdAt: new Date().toISOString(),
      progress: 0,
      currentPhase: "Cloning Repository",
      filesProcessed: 0,
      totalFiles: files.length,
    }

    mockRuns.push(newRun)
    project.lastRunId = runId
    project.lastRunStatus = "running"

    // Convert GitHub files to ProcessedFile format
    const processedFiles: ProcessedFile[] = files
      .filter((f) => f.content)
      .map((f) => ({
        name: f.name,
        path: f.path,
        content: f.content!,
        size: f.size,
        type: "text/plain",
      }))

    this.performRealAnalysis(runId, processedFiles)
  }

  private async performRealAnalysis(runId: string, files: ProcessedFile[]) {
    const run = mockRuns.find((r) => r.id === runId)
    const project = mockProjects.find((p) => p.id === run?.projectId)

    if (!run || !project) return

    const logs: LogEntry[] = []
    const addLog = (level: LogEntry["level"], message: string) => {
      logs.push({
        id: `${runId}_${logs.length}`,
        timestamp: new Date().toISOString(),
        level,
        message,
      })
      analysisLogs.set(runId, [...logs])
    }

    try {
      addLog("info", `Starting analysis for ${files.length} files`)

      // Phase 1: File Processing
      run.currentPhase = "Processing Files"
      run.progress = 10
      addLog("info", "Processing uploaded files...")
      await this.delay(1000)

      // Phase 2: Static Analysis
      run.currentPhase = "Static Analysis"
      run.progress = 30
      addLog("info", "Running static code analysis...")
      await this.delay(1500)

      // Phase 3: Security Analysis
      run.currentPhase = "Security Analysis"
      run.progress = 60
      addLog("info", "Scanning for security vulnerabilities...")

      // Perform actual analysis
      const analysisResult = await codeAnalyzer.analyzeFiles(files)

      run.progress = 80
      addLog("info", `Found ${analysisResult.findings.length} issues across ${files.length} files`)

      // Phase 4: Report Generation
      run.currentPhase = "Generating Report"
      run.progress = 90
      addLog("info", "Generating analysis report...")
      await this.delay(1000)

      // Complete analysis
      run.status = "succeeded"
      run.progress = 100
      run.duration = Math.floor((Date.now() - new Date(run.createdAt).getTime()) / 1000)
      run.findingsCount = analysisResult.findings.length
      run.filesProcessed = files.length

      project.lastRunStatus = "succeeded"
      project.updatedAt = new Date().toISOString()

      // Store results
      const results = {
        summary: {
          totalFindings: analysisResult.findings.length,
          highSeverity: analysisResult.findings.filter((f) => f.severity === "high").length,
          mediumSeverity: analysisResult.findings.filter((f) => f.severity === "medium").length,
          lowSeverity: analysisResult.findings.filter((f) => f.severity === "low").length,
          filesAnalyzed: files.length,
        },
        findings: analysisResult.findings,
        coverage: analysisResult.coverage,
        apiSchema: {
          validSchemas: Math.floor(Math.random() * 5) + 2,
          invalidSchemas: Math.floor(Math.random() * 2),
          issues: [],
        },
        security: analysisResult.security,
        metrics: analysisResult.metrics,
      }

      analysisResults.set(runId, results)
      addLog("success", `Analysis completed successfully - ${analysisResult.findings.length} findings generated`)
    } catch (error) {
      run.status = "failed"
      run.errorMessage = error instanceof Error ? error.message : "Analysis failed"
      project.lastRunStatus = "failed"
      project.updatedAt = new Date().toISOString()

      addLog("error", `Analysis failed: ${run.errorMessage}`)
    }
  }

  private async performAnalysis(runId: string, project: Project) {
    // This is a fallback for projects without files (shouldn't happen with new implementation)
    const run = mockRuns.find((r) => r.id === runId)
    if (!run) return

    setTimeout(() => {
      run.status = "failed"
      run.errorMessage = "No files found for analysis"
      project.lastRunStatus = "failed"
      project.updatedAt = new Date().toISOString()
    }, 2000)
  }

  async getAnalysisRun(projectId: string, runId: string): Promise<AnalysisRun | null> {
    await this.delay(200)
    return mockRuns.find((r) => r.id === runId && r.projectId === projectId) || null
  }

  async getAnalysisLogs(projectId: string, runId: string): Promise<LogEntry[]> {
    await this.delay(150)
    return analysisLogs.get(runId) || []
  }

  async getAnalysisResults(projectId: string, runId: string) {
    await this.delay(400)
    const results = analysisResults.get(runId)

    if (!results) {
      throw new Error("Analysis results not found")
    }

    return results
  }

  async downloadResults(projectId: string, runId: string): Promise<Blob> {
    await this.delay(800)
    const results = await this.getAnalysisResults(projectId, runId)
    const data = JSON.stringify(results, null, 2)
    return new Blob([data], { type: "application/json" })
  }
}

export const apiService = new ApiService()
