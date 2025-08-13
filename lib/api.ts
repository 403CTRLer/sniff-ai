// Enhanced API service with proper file handling and analysis simulation

interface Project {
  id: string
  name: string
  source: "upload" | "git"
  sourceUrl?: string
  lastRunStatus: "queued" | "running" | "succeeded" | "failed"
  lastRunId?: string
  createdAt: string
  updatedAt: string
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

// Mock storage for projects and runs
let mockProjects: Project[] = [
  {
    id: "proj_1",
    name: "React Dashboard",
    source: "git",
    sourceUrl: "https://github.com/user/react-dashboard",
    lastRunStatus: "succeeded",
    lastRunId: "run_1",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "proj_2",
    name: "API Server",
    source: "upload",
    lastRunStatus: "running",
    lastRunId: "run_2",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

let mockRuns: AnalysisRun[] = [
  {
    id: "run_1",
    projectId: "proj_1",
    status: "succeeded",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 45,
    findingsCount: 12,
  },
  {
    id: "run_2",
    projectId: "proj_2",
    status: "running",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    progress: 75,
    currentPhase: "Security Analysis",
    filesProcessed: 15,
    totalFiles: 20,
  },
]

// Simulate file analysis
const analyzeFiles = (files: File[]): Promise<{ findings: number; duration: number }> => {
  return new Promise((resolve) => {
    // Simulate analysis time based on file count and size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const analysisTime = Math.min(Math.max(files.length * 500 + totalSize / 1000, 2000), 10000)

    setTimeout(() => {
      // Generate findings based on file types and content
      const findings = files.reduce((count, file) => {
        const ext = file.name.split(".").pop()?.toLowerCase()
        const baseFindings = Math.floor(Math.random() * 5) + 1

        // More findings for certain file types
        const multiplier = ["js", "ts", "py", "java"].includes(ext || "") ? 1.5 : 1
        return count + Math.floor(baseFindings * multiplier)
      }, 0)

      resolve({
        findings: Math.max(findings, 1),
        duration: Math.floor(analysisTime / 1000),
      })
    }, analysisTime)
  })
}

// Generate realistic logs during analysis
const generateAnalysisLogs = (runId: string, files: File[]): LogEntry[] => {
  const logs: LogEntry[] = []
  const startTime = Date.now() - 1800000 // 30 minutes ago

  logs.push({
    id: `${runId}_log_1`,
    timestamp: new Date(startTime).toISOString(),
    level: "info",
    message: `Starting analysis for ${files.length} files`,
  })

  logs.push({
    id: `${runId}_log_2`,
    timestamp: new Date(startTime + 10000).toISOString(),
    level: "info",
    message: "Initializing static analysis engine",
  })

  logs.push({
    id: `${runId}_log_3`,
    timestamp: new Date(startTime + 30000).toISOString(),
    level: "info",
    message: "Running security pattern analysis",
  })

  files.forEach((file, index) => {
    logs.push({
      id: `${runId}_log_file_${index}`,
      timestamp: new Date(startTime + 60000 + index * 15000).toISOString(),
      level: "info",
      message: `Analyzing ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    })

    // Randomly add warnings for some files
    if (Math.random() > 0.7) {
      logs.push({
        id: `${runId}_log_warning_${index}`,
        timestamp: new Date(startTime + 65000 + index * 15000).toISOString(),
        level: "warning",
        message: `Potential security issue found in ${file.name}`,
      })
    }
  })

  logs.push({
    id: `${runId}_log_complete`,
    timestamp: new Date(startTime + 120000 + files.length * 15000).toISOString(),
    level: "success",
    message: "Analysis completed successfully",
  })

  return logs
}

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
    return { success: true }
  }

  async startAnalysis(projectId: string): Promise<{ runId: string }> {
    await this.delay(500)

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newRun: AnalysisRun = {
      id: runId,
      projectId,
      status: "queued",
      createdAt: new Date().toISOString(),
    }

    mockRuns.push(newRun)

    // Update project status
    const project = mockProjects.find((p) => p.id === projectId)
    if (project) {
      project.lastRunStatus = "queued"
      project.lastRunId = runId
      project.updatedAt = new Date().toISOString()
    }

    // Simulate analysis progression
    setTimeout(() => {
      const run = mockRuns.find((r) => r.id === runId)
      if (run) {
        run.status = "running"
        run.progress = 0
        run.currentPhase = "Static Analysis"
        run.filesProcessed = 0
        run.totalFiles = Math.floor(Math.random() * 20) + 10

        // Update project status
        if (project) {
          project.lastRunStatus = "running"
          project.updatedAt = new Date().toISOString()
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          if (run.progress! < 100) {
            run.progress! += Math.floor(Math.random() * 15) + 5
            run.filesProcessed! += Math.floor(Math.random() * 3) + 1

            if (run.progress! > 25 && run.progress! < 50) {
              run.currentPhase = "Security Analysis"
            } else if (run.progress! > 50 && run.progress! < 75) {
              run.currentPhase = "API Schema Validation"
            } else if (run.progress! > 75) {
              run.currentPhase = "Coverage Analysis"
            }

            if (run.progress! >= 100) {
              clearInterval(progressInterval)
              run.status = "succeeded"
              run.progress = 100
              run.duration = Math.floor(Math.random() * 60) + 30
              run.findingsCount = Math.floor(Math.random() * 20) + 5

              if (project) {
                project.lastRunStatus = "succeeded"
                project.updatedAt = new Date()
                project.lastRunStatus = "succeeded"
                project.updatedAt = new Date().toISOString()
              }
            }
          }
        }, 2000)
      }
    }, 1000)

    return { runId }
  }

  async uploadFiles(files: File[]): Promise<{ projectId: string; projectName: string }> {
    await this.delay(1500)

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
    }

    mockProjects.unshift(newProject)

    // Start automatic analysis
    setTimeout(async () => {
      const analysisResult = await analyzeFiles(files)
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newRun: AnalysisRun = {
        id: runId,
        projectId,
        status: "running",
        createdAt: new Date().toISOString(),
        progress: 0,
        currentPhase: "Static Analysis",
        filesProcessed: 0,
        totalFiles: files.length,
      }

      mockRuns.push(newRun)
      newProject.lastRunId = runId
      newProject.lastRunStatus = "running"

      // Simulate analysis completion
      setTimeout(() => {
        newRun.status = "succeeded"
        newRun.progress = 100
        newRun.duration = analysisResult.duration
        newRun.findingsCount = analysisResult.findings

        newProject.lastRunStatus = "succeeded"
        newProject.updatedAt = new Date().toISOString()
      }, analysisResult.duration * 1000)
    }, 2000)

    return { projectId, projectName }
  }

  async cloneRepository(
    repoUrl: string,
    branch: string,
    accessToken?: string,
  ): Promise<{ projectId: string; projectName: string }> {
    await this.delay(2500)

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

    // Simulate cloning and analysis
    setTimeout(() => {
      const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const fileCount = Math.floor(Math.random() * 50) + 20

      const newRun: AnalysisRun = {
        id: runId,
        projectId,
        status: "running",
        createdAt: new Date().toISOString(),
        progress: 0,
        currentPhase: "Repository Clone",
        filesProcessed: 0,
        totalFiles: fileCount,
      }

      mockRuns.push(newRun)
      newProject.lastRunId = runId
      newProject.lastRunStatus = "running"

      // Simulate analysis phases
      const phases = ["Repository Clone", "Static Analysis", "Security Analysis", "Coverage Analysis"]
      let currentPhaseIndex = 0

      const progressInterval = setInterval(() => {
        if (newRun.progress! < 100) {
          newRun.progress! += Math.floor(Math.random() * 10) + 5
          newRun.filesProcessed! += Math.floor(Math.random() * 3) + 1

          const phaseProgress = newRun.progress! / 25
          if (phaseProgress > currentPhaseIndex + 1 && currentPhaseIndex < phases.length - 1) {
            currentPhaseIndex++
            newRun.currentPhase = phases[currentPhaseIndex]
          }

          if (newRun.progress! >= 100) {
            clearInterval(progressInterval)
            newRun.status = "succeeded"
            newRun.progress = 100
            newRun.duration = Math.floor(Math.random() * 120) + 60
            newRun.findingsCount = Math.floor(Math.random() * 30) + 10

            newProject.lastRunStatus = "succeeded"
            newProject.updatedAt = new Date().toISOString()
          }
        }
      }, 3000)
    }, 3000)

    return { projectId, projectName }
  }

  async getAnalysisRun(projectId: string, runId: string): Promise<AnalysisRun | null> {
    await this.delay(200)
    return mockRuns.find((r) => r.id === runId && r.projectId === projectId) || null
  }

  async getAnalysisLogs(projectId: string, runId: string): Promise<LogEntry[]> {
    await this.delay(150)

    const run = mockRuns.find((r) => r.id === runId)
    if (!run) return []

    // Generate logs based on run status
    const logs: LogEntry[] = []
    const startTime = new Date(run.createdAt).getTime()

    logs.push({
      id: `${runId}_log_1`,
      timestamp: new Date(startTime).toISOString(),
      level: "info",
      message: `Starting analysis for project ${projectId}`,
    })

    if (run.status !== "queued") {
      logs.push({
        id: `${runId}_log_2`,
        timestamp: new Date(startTime + 5000).toISOString(),
        level: "info",
        message: `Scanning ${run.totalFiles || 0} files for analysis`,
      })

      logs.push({
        id: `${runId}_log_3`,
        timestamp: new Date(startTime + 15000).toISOString(),
        level: "info",
        message: "Initializing analysis engines",
      })

      if (run.currentPhase) {
        logs.push({
          id: `${runId}_log_4`,
          timestamp: new Date(startTime + 30000).toISOString(),
          level: "info",
          message: `Running ${run.currentPhase.toLowerCase()}`,
        })
      }

      if (run.progress && run.progress > 50) {
        logs.push({
          id: `${runId}_log_5`,
          timestamp: new Date(startTime + 60000).toISOString(),
          level: "warning",
          message: "Found potential security vulnerabilities",
        })
      }

      if (run.status === "succeeded") {
        logs.push({
          id: `${runId}_log_complete`,
          timestamp: new Date(startTime + (run.duration || 60) * 1000).toISOString(),
          level: "success",
          message: `Analysis completed - ${run.findingsCount} issues found`,
        })
      } else if (run.status === "failed") {
        logs.push({
          id: `${runId}_log_error`,
          timestamp: new Date(startTime + 45000).toISOString(),
          level: "error",
          message: run.errorMessage || "Analysis failed due to unexpected error",
        })
      }
    }

    return logs
  }

  async getAnalysisResults(projectId: string, runId: string) {
    await this.delay(400)

    // Generate realistic results based on the run
    const run = mockRuns.find((r) => r.id === runId)
    const findingsCount = run?.findingsCount || 15

    const mockResults = {
      summary: {
        totalFindings: findingsCount,
        highSeverity: Math.floor(findingsCount * 0.2),
        mediumSeverity: Math.floor(findingsCount * 0.5),
        lowSeverity: Math.floor(findingsCount * 0.3),
        filesAnalyzed: run?.totalFiles || 20,
      },
      findings: this.generateMockFindings(findingsCount),
      coverage: {
        overall: Math.floor(Math.random() * 30) + 70,
        lines: Math.floor(Math.random() * 25) + 75,
        functions: Math.floor(Math.random() * 20) + 70,
        branches: Math.floor(Math.random() * 30) + 65,
        files: [
          { path: "src/auth.js", coverage: 95, lines: 98, functions: 92 },
          { path: "src/utils/helpers.js", coverage: 65, lines: 70, functions: 60 },
          { path: "src/api/client.js", coverage: 45, lines: 50, functions: 40 },
          { path: "src/components/Dashboard.jsx", coverage: 88, lines: 90, functions: 85 },
        ],
      },
      apiSchema: {
        validSchemas: Math.floor(Math.random() * 5) + 2,
        invalidSchemas: Math.floor(Math.random() * 2),
        issues: [
          {
            title: "Missing Required Property",
            description: "API endpoint response schema is missing required properties",
            severity: "medium",
            file: "api/openapi.yaml",
          },
        ],
      },
      security: {
        critical: Math.floor(findingsCount * 0.1),
        high: Math.floor(findingsCount * 0.15),
        medium: Math.floor(findingsCount * 0.4),
        low: Math.floor(findingsCount * 0.35),
        vulnerabilities: this.generateSecurityVulnerabilities(findingsCount),
      },
    }

    return mockResults
  }

  private generateMockFindings(count: number) {
    const findings = []
    const titles = [
      "SQL Injection Vulnerability",
      "Cross-Site Scripting (XSS)",
      "Unused Variable",
      "Missing Error Handling",
      "Hardcoded Credentials",
      "Insecure Random Number Generation",
      "Buffer Overflow Risk",
      "Memory Leak Potential",
      "Race Condition",
      "Improper Input Validation",
    ]

    const files = [
      "src/auth.js",
      "src/database/queries.js",
      "src/utils/helpers.js",
      "src/api/client.js",
      "src/components/UserProfile.jsx",
      "src/middleware/auth.js",
      "src/services/payment.js",
    ]

    for (let i = 0; i < count; i++) {
      const severity = Math.random() > 0.8 ? "high" : Math.random() > 0.5 ? "medium" : "low"
      const category = Math.random() > 0.6 ? "security" : Math.random() > 0.3 ? "quality" : "performance"

      findings.push({
        id: `finding_${i + 1}`,
        title: titles[Math.floor(Math.random() * titles.length)],
        description: "Detailed description of the issue found during analysis",
        category,
        severity,
        file: files[Math.floor(Math.random() * files.length)],
        line: Math.floor(Math.random() * 100) + 1,
        codeSnippet: `function example() {\n  // Problematic code here\n  return data;\n}`,
        recommendation: "Recommended fix or improvement for this issue",
      })
    }

    return findings
  }

  private generateSecurityVulnerabilities(baseCount: number) {
    const vulnerabilities = []
    const securityIssues = [
      {
        title: "SQL Injection",
        description: "Direct string concatenation in SQL query",
        cweId: 89,
        recommendation: "Use parameterized queries to prevent SQL injection attacks.",
      },
      {
        title: "Cross-Site Scripting (XSS)",
        description: "User input rendered without sanitization",
        cweId: 79,
        recommendation: "Sanitize user input before rendering in the DOM.",
      },
      {
        title: "Insecure Direct Object Reference",
        description: "Direct access to objects without authorization check",
        cweId: 639,
        recommendation: "Implement proper authorization checks before object access.",
      },
    ]

    const securityCount = Math.floor(baseCount * 0.4)
    for (let i = 0; i < securityCount; i++) {
      const issue = securityIssues[Math.floor(Math.random() * securityIssues.length)]
      const severity = Math.random() > 0.7 ? "high" : "medium"

      vulnerabilities.push({
        ...issue,
        severity,
        file: `src/file${i + 1}.js`,
        line: Math.floor(Math.random() * 100) + 1,
      })
    }

    return vulnerabilities
  }

  async downloadResults(projectId: string, runId: string): Promise<Blob> {
    await this.delay(800)
    const results = await this.getAnalysisResults(projectId, runId)
    const data = JSON.stringify(results, null, 2)
    return new Blob([data], { type: "application/json" })
  }
}

export const apiService = new ApiService()
