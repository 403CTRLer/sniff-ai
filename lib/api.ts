// Mock data for development
const mockProjects = [
  {
    id: "proj_1",
    name: "React Dashboard",
    source: "git" as const,
    sourceUrl: "https://github.com/user/react-dashboard",
    lastRunStatus: "succeeded" as const,
    lastRunId: "run_1",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: "proj_2",
    name: "API Server",
    source: "upload" as const,
    lastRunStatus: "running" as const,
    lastRunId: "run_2",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
  },
  {
    id: "proj_3",
    name: "Mobile App",
    source: "git" as const,
    sourceUrl: "https://github.com/user/mobile-app",
    lastRunStatus: "failed" as const,
    lastRunId: "run_3",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
]

const mockRuns = [
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
    projectId: "proj_1",
    status: "running",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    progress: 75,
    currentPhase: "Security Analysis",
    filesProcessed: 15,
    totalFiles: 20,
  },
  {
    id: "run_3",
    projectId: "proj_1",
    status: "failed",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    duration: 23,
    errorMessage: "Failed to parse configuration file",
  },
]

const mockLogs = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    level: "info",
    message: "Starting analysis for project proj_1",
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 1700000).toISOString(),
    level: "info",
    message: "Scanning 20 files for analysis",
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 1600000).toISOString(),
    level: "info",
    message: "Running static analysis checks",
  },
  {
    id: "log_4",
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    level: "warning",
    message: "Found potential security vulnerability in auth.js:42",
  },
  {
    id: "log_5",
    timestamp: new Date(Date.now() - 1400000).toISOString(),
    level: "info",
    message: "Running security pattern analysis",
  },
  {
    id: "log_6",
    timestamp: new Date(Date.now() - 1300000).toISOString(),
    level: "success",
    message: "Security analysis completed - 3 issues found",
  },
]

const mockResults = {
  summary: {
    totalFindings: 15,
    highSeverity: 3,
    mediumSeverity: 7,
    lowSeverity: 5,
    filesAnalyzed: 20,
  },
  findings: [
    {
      id: "finding_1",
      title: "SQL Injection Vulnerability",
      description: "User input is directly concatenated into SQL query without sanitization",
      category: "security",
      severity: "high",
      file: "src/database/queries.js",
      line: 42,
      codeSnippet: `const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query, callback);`,
      recommendation: "Use parameterized queries or prepared statements to prevent SQL injection attacks.",
    },
    {
      id: "finding_2",
      title: "Unused Variable",
      description: "Variable 'tempData' is declared but never used",
      category: "quality",
      severity: "low",
      file: "src/utils/helpers.js",
      line: 15,
      codeSnippet: `function processData(input) {
  const tempData = input.map(x => x.value);
  return input.filter(x => x.active);
}`,
      recommendation: "Remove unused variables to improve code clarity and reduce bundle size.",
    },
    {
      id: "finding_3",
      title: "Missing Error Handling",
      description: "Async operation lacks proper error handling",
      category: "quality",
      severity: "medium",
      file: "src/api/client.js",
      line: 28,
      codeSnippet: `async function fetchUserData(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}`,
      recommendation: "Add try-catch blocks and check response status before parsing JSON.",
    },
  ],
  coverage: {
    overall: 78,
    lines: 82,
    functions: 75,
    branches: 71,
    files: [
      { path: "src/auth.js", coverage: 95, lines: 98, functions: 92 },
      { path: "src/utils/helpers.js", coverage: 65, lines: 70, functions: 60 },
      { path: "src/api/client.js", coverage: 45, lines: 50, functions: 40 },
    ],
  },
  apiSchema: {
    validSchemas: 2,
    invalidSchemas: 1,
    issues: [
      {
        title: "Missing Required Property",
        description: "API endpoint /users/{id} response schema is missing required 'email' property",
        severity: "medium",
        file: "api/openapi.yaml",
      },
    ],
  },
  security: {
    critical: 1,
    high: 2,
    medium: 4,
    low: 1,
    vulnerabilities: [
      {
        title: "SQL Injection",
        description: "Direct string concatenation in SQL query",
        severity: "high",
        file: "src/database/queries.js",
        line: 42,
        cweId: 89,
        recommendation: "Use parameterized queries to prevent SQL injection attacks.",
      },
      {
        title: "Cross-Site Scripting (XSS)",
        description: "User input rendered without sanitization",
        severity: "medium",
        file: "src/components/UserProfile.jsx",
        line: 15,
        cweId: 79,
        recommendation: "Sanitize user input before rendering in the DOM.",
      },
    ],
  },
}

class ApiService {
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getProjects() {
    await this.delay(500)
    return mockProjects
  }

  async getProject(id: string) {
    await this.delay(300)
    return mockProjects.find((p) => p.id === id) || null
  }

  async getProjectRuns(projectId: string) {
    await this.delay(400)
    return mockRuns.filter((r) => r.projectId === projectId)
  }

  async deleteProject(id: string) {
    await this.delay(1000)
    return { success: true }
  }

  async startAnalysis(projectId: string) {
    await this.delay(800)
    const runId = `run_${Date.now()}`
    return { runId, message: "Analysis started successfully" }
  }

  async uploadFiles(files: File[]) {
    await this.delay(2000)
    const projectId = `proj_${Date.now()}`
    const projectName = files.length === 1 ? files[0].name : `Upload ${new Date().toLocaleDateString()}`
    return { projectId, projectName }
  }

  async cloneRepository(repoUrl: string, branch: string, accessToken?: string) {
    await this.delay(3000)
    const projectId = `proj_${Date.now()}`
    const projectName = repoUrl.split("/").pop()?.replace(".git", "") || "Cloned Repository"
    return { projectId, projectName }
  }

  async getAnalysisRun(projectId: string, runId: string) {
    await this.delay(300)
    return mockRuns.find((r) => r.id === runId) || null
  }

  async getAnalysisLogs(projectId: string, runId: string) {
    await this.delay(200)
    return mockLogs
  }

  async getAnalysisResults(projectId: string, runId: string) {
    await this.delay(500)
    return mockResults
  }

  async downloadResults(projectId: string, runId: string) {
    await this.delay(1000)
    const data = JSON.stringify(mockResults, null, 2)
    return new Blob([data], { type: "application/json" })
  }
}

export const apiService = new ApiService()
