import type { ProjectFile, Finding, TestCoverage, SecurityIssue, ApiIssue } from "../models"

export interface AnalysisOptions {
  includeAiDetection: boolean
  includeSecurity: boolean
  includeQuality: boolean
  includeCoverage: boolean
  includeApiValidation: boolean
}

export interface AnalysisResult {
  findings: Finding[]
  coverage: TestCoverage[]
  securityIssues: SecurityIssue[]
  apiIssues: ApiIssue[]
  aiDetectionScore: number
  metrics: {
    totalFiles: number
    linesOfCode: number
    complexity: number
    maintainabilityIndex: number
  }
}

export class AnalysisEngine {
  async analyzeProject(files: ProjectFile[], options: AnalysisOptions): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      findings: [],
      coverage: [],
      securityIssues: [],
      apiIssues: [],
      aiDetectionScore: 0,
      metrics: {
        totalFiles: files.length,
        linesOfCode: 0,
        complexity: 0,
        maintainabilityIndex: 0,
      },
    }

    // Process files in batches to avoid blocking UI
    const batchSize = 10
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const batchResult = await this.analyzeBatch(batch, options)

      result.findings.push(...batchResult.findings)
      result.coverage.push(...batchResult.coverage)
      result.securityIssues.push(...batchResult.securityIssues)
      result.apiIssues.push(...batchResult.apiIssues)
      result.metrics.linesOfCode += batchResult.metrics.linesOfCode
      result.metrics.complexity += batchResult.metrics.complexity
    }

    // Calculate overall AI detection score
    if (options.includeAiDetection) {
      result.aiDetectionScore = this.calculateAiDetectionScore(files)
    }

    // Calculate maintainability index
    result.metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(result.metrics)

    return result
  }

  private async analyzeBatch(files: ProjectFile[], options: AnalysisOptions): Promise<AnalysisResult> {
    // Use setTimeout to yield control and prevent blocking
    await new Promise((resolve) => setTimeout(resolve, 0))
    return this.analyzeFilesSync(files, options)
  }

  private analyzeFilesSync(files: ProjectFile[], options: AnalysisOptions): AnalysisResult {
    const result: AnalysisResult = {
      findings: [],
      coverage: [],
      securityIssues: [],
      apiIssues: [],
      aiDetectionScore: 0,
      metrics: { totalFiles: files.length, linesOfCode: 0, complexity: 0, maintainabilityIndex: 0 },
    }

    for (const file of files) {
      const fileAnalysis = this.analyzeFile(file, options)
      result.findings.push(...fileAnalysis.findings)
      result.coverage.push(...fileAnalysis.coverage)
      result.securityIssues.push(...fileAnalysis.securityIssues)
      result.apiIssues.push(...fileAnalysis.apiIssues)
      result.metrics.linesOfCode += fileAnalysis.linesOfCode
      result.metrics.complexity += fileAnalysis.complexity
    }

    return result
  }

  private analyzeFile(file: ProjectFile, options: AnalysisOptions) {
    const extension = file.path.split(".").pop()?.toLowerCase()
    const content = file.content
    const lines = content.split("\n")

    const analysis = {
      findings: [] as Finding[],
      coverage: [] as TestCoverage[],
      securityIssues: [] as SecurityIssue[],
      apiIssues: [] as ApiIssue[],
      linesOfCode: lines.filter((line) => line.trim().length > 0).length,
      complexity: this.calculateComplexity(content, extension || ""),
    }

    // Code quality analysis
    if (options.includeQuality) {
      analysis.findings.push(...this.analyzeCodeQuality(file, content, extension || ""))
    }

    // Security analysis
    if (options.includeSecurity) {
      analysis.securityIssues.push(...this.analyzeSecurityIssues(file, content, extension || ""))
    }

    // API validation
    if (options.includeApiValidation) {
      analysis.apiIssues.push(...this.analyzeApiUsage(file, content, extension || ""))
    }

    // Test coverage (mock implementation)
    if (options.includeCoverage) {
      analysis.coverage.push(this.analyzeCoverage(file))
    }

    return analysis
  }

  private analyzeCodeQuality(file: ProjectFile, content: string, extension: string): Finding[] {
    const findings: Finding[] = []
    const lines = content.split("\n")

    // Generic code quality checks
    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Long lines
      if (line.length > 120) {
        findings.push({
          id: `long-line-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "low",
          category: "style",
          title: "Line too long",
          description: `Line ${lineNumber} exceeds 120 characters (${line.length} chars)`,
          filePath: file.path,
          lineNumber,
          columnNumber: 121,
          codeSnippet: line.substring(0, 150) + (line.length > 150 ? "..." : ""),
          suggestion: "Consider breaking this line into multiple lines for better readability",
          confidence: 0.9,
        })
      }

      // TODO comments
      if (line.toLowerCase().includes("todo") || line.toLowerCase().includes("fixme")) {
        findings.push({
          id: `todo-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "info",
          category: "maintenance",
          title: "TODO/FIXME comment found",
          description: `Unresolved TODO or FIXME comment at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber:
            line.toLowerCase().indexOf("todo") !== -1
              ? line.toLowerCase().indexOf("todo") + 1
              : line.toLowerCase().indexOf("fixme") + 1,
          codeSnippet: line.trim(),
          suggestion: "Consider addressing this TODO item or creating a proper issue tracker entry",
          confidence: 1.0,
        })
      }

      // Console.log statements (for JS/TS)
      if (
        (extension === "js" || extension === "ts" || extension === "jsx" || extension === "tsx") &&
        line.includes("console.log")
      ) {
        findings.push({
          id: `console-log-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "medium",
          category: "debugging",
          title: "Console.log statement found",
          description: `Debug console.log statement at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.indexOf("console.log") + 1,
          codeSnippet: line.trim(),
          suggestion: "Remove console.log statements before production deployment",
          confidence: 0.95,
        })
      }
    })

    // Language-specific analysis
    if (extension === "js" || extension === "ts" || extension === "jsx" || extension === "tsx") {
      findings.push(...this.analyzeJavaScript(file, content))
    } else if (extension === "py") {
      findings.push(...this.analyzePython(file, content))
    }

    return findings
  }

  private analyzeJavaScript(file: ProjectFile, content: string): Finding[] {
    const findings: Finding[] = []
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Var usage (prefer let/const)
      if (line.includes("var ") && !line.trim().startsWith("//")) {
        findings.push({
          id: `var-usage-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "medium",
          category: "modernization",
          title: "Use of var keyword",
          description: `Use of deprecated 'var' keyword at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.indexOf("var ") + 1,
          codeSnippet: line.trim(),
          suggestion: "Use 'let' or 'const' instead of 'var' for better scoping",
          confidence: 0.9,
        })
      }

      // == usage (prefer ===)
      if (line.includes("==") && !line.includes("===") && !line.includes("!=") && !line.trim().startsWith("//")) {
        findings.push({
          id: `loose-equality-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "medium",
          category: "best-practices",
          title: "Loose equality comparison",
          description: `Use of loose equality (==) at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.indexOf("==") + 1,
          codeSnippet: line.trim(),
          suggestion: "Use strict equality (===) to avoid type coercion issues",
          confidence: 0.85,
        })
      }
    })

    return findings
  }

  private analyzePython(file: ProjectFile, content: string): Finding[] {
    const findings: Finding[] = []
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Print statements
      if (line.includes("print(") && !line.trim().startsWith("#")) {
        findings.push({
          id: `print-statement-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "low",
          category: "debugging",
          title: "Print statement found",
          description: `Debug print statement at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.indexOf("print(") + 1,
          codeSnippet: line.trim(),
          suggestion: "Consider using logging instead of print statements",
          confidence: 0.8,
        })
      }
    })

    return findings
  }

  private analyzeSecurityIssues(file: ProjectFile, content: string, extension: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Hardcoded secrets/passwords
      const secretPatterns = [
        /password\s*=\s*["'][^"']+["']/i,
        /api[_-]?key\s*=\s*["'][^"']+["']/i,
        /secret\s*=\s*["'][^"']+["']/i,
        /token\s*=\s*["'][^"']+["']/i,
      ]

      secretPatterns.forEach((pattern) => {
        if (pattern.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("#")) {
          issues.push({
            id: `hardcoded-secret-${file.path}-${lineNumber}`,
            type: "secret",
            severity: "high",
            title: "Hardcoded secret detected",
            description: `Potential hardcoded secret or credential at line ${lineNumber}`,
            filePath: file.path,
            lineNumber,
            codeSnippet: line.trim(),
            recommendation: "Move secrets to environment variables or secure configuration",
            cweId: "CWE-798",
            confidence: 0.8,
          })
        }
      })

      // SQL injection patterns
      if (
        (extension === "js" || extension === "ts" || extension === "py") &&
        /query.*\+.*|execute.*\+.*|SELECT.*\+/i.test(line)
      ) {
        issues.push({
          id: `sql-injection-${file.path}-${lineNumber}`,
          type: "injection",
          severity: "high",
          title: "Potential SQL injection",
          description: `Possible SQL injection vulnerability at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          codeSnippet: line.trim(),
          recommendation: "Use parameterized queries or prepared statements",
          cweId: "CWE-89",
          confidence: 0.7,
        })
      }
    })

    return issues
  }

  private analyzeApiUsage(file: ProjectFile, content: string, extension: string): ApiIssue[] {
    const issues: ApiIssue[] = []
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // HTTP without HTTPS
      if (line.includes("http://") && !line.includes("localhost") && !line.trim().startsWith("//")) {
        issues.push({
          id: `insecure-http-${file.path}-${lineNumber}`,
          type: "security",
          severity: "medium",
          title: "Insecure HTTP usage",
          description: `Use of HTTP instead of HTTPS at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          endpoint: line.match(/http:\/\/[^\s"']+/)?.[0] || "",
          method: "GET",
          issue: "Insecure protocol",
          suggestion: "Use HTTPS instead of HTTP for secure communication",
        })
      }

      // Missing error handling for fetch/axios
      if ((line.includes("fetch(") || line.includes("axios.")) && !line.includes(".catch") && !line.includes("try")) {
        issues.push({
          id: `missing-error-handling-${file.path}-${lineNumber}`,
          type: "reliability",
          severity: "medium",
          title: "Missing error handling",
          description: `API call without error handling at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          endpoint: "",
          method: "UNKNOWN",
          issue: "No error handling",
          suggestion: "Add proper error handling with try-catch or .catch()",
        })
      }
    })

    return issues
  }

  private analyzeCoverage(file: ProjectFile): TestCoverage {
    // Mock coverage analysis - in a real implementation, this would parse test files
    const isTestFile = file.path.includes(".test.") || file.path.includes(".spec.") || file.path.includes("__tests__")
    const lines = file.content.split("\n").filter((line) => line.trim().length > 0).length

    return {
      filePath: file.path,
      totalLines: lines,
      coveredLines: isTestFile ? Math.floor(lines * 0.9) : Math.floor(lines * Math.random() * 0.8),
      coveragePercentage: isTestFile ? 90 : Math.floor(Math.random() * 80),
      uncoveredLines: [],
    }
  }

  private calculateComplexity(content: string, extension: string): number {
    // Simple cyclomatic complexity calculation
    let complexity = 1 // Base complexity

    const complexityKeywords = ["if", "else", "while", "for", "switch", "case", "catch", "try", "&&", "||", "?"]

    complexityKeywords.forEach((keyword) => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "g")
      const matches = content.match(regex)
      if (matches) {
        complexity += matches.length
      }
    })

    return complexity
  }

  private calculateAiDetectionScore(files: ProjectFile[]): number {
    // Mock AI detection - in reality, this would use ML models
    let suspiciousPatterns = 0
    let totalPatterns = 0

    files.forEach((file) => {
      const content = file.content.toLowerCase()

      // Check for AI-generated code patterns
      const aiPatterns = [
        /\/\*\*[\s\S]*?\*\//g, // JSDoc comments
        /# this function/g,
        /# todo:/g,
        /console\.log\(/g,
        /print\(/g,
      ]

      aiPatterns.forEach((pattern) => {
        const matches = content.match(pattern)
        if (matches) {
          suspiciousPatterns += matches.length
        }
        totalPatterns += 1
      })
    })

    return totalPatterns > 0 ? Math.min((suspiciousPatterns / totalPatterns) * 100, 100) : 0
  }

  private calculateMaintainabilityIndex(metrics: any): number {
    // Simplified maintainability index calculation
    const { linesOfCode, complexity } = metrics
    if (linesOfCode === 0) return 100

    const complexityRatio = complexity / linesOfCode
    const maintainability = Math.max(0, 100 - complexityRatio * 50)

    return Math.round(maintainability)
  }

  dispose() {
    // No worker to dispose in this simplified version
  }
}

export async function analyzeCode(files: ProjectFile[], options: AnalysisOptions): Promise<AnalysisResult> {
  const engine = new AnalysisEngine()
  return engine.analyzeProject(files, options)
}
