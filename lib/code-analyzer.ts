interface AnalysisResult {
  findings: Finding[]
  metrics: CodeMetrics
  security: SecurityAnalysis
  coverage: CoverageAnalysis
}

interface Finding {
  id: string
  title: string
  description: string
  category: "security" | "quality" | "performance" | "maintainability"
  severity: "critical" | "high" | "medium" | "low"
  file: string
  line: number
  column?: number
  codeSnippet: string
  recommendation: string
  rule: string
}

interface CodeMetrics {
  totalLines: number
  totalFiles: number
  languages: Record<string, number>
  complexity: number
  duplicateLines: number
  testFiles: number
}

interface SecurityAnalysis {
  critical: number
  high: number
  medium: number
  low: number
  vulnerabilities: SecurityVulnerability[]
}

interface SecurityVulnerability {
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  file: string
  line: number
  cweId: number
  recommendation: string
}

interface CoverageAnalysis {
  overall: number
  lines: number
  functions: number
  branches: number
  files: Array<{
    path: string
    coverage: number
    lines: number
    functions: number
  }>
}

export class CodeAnalyzer {
  private securityPatterns = [
    {
      pattern: /eval\s*\(/gi,
      title: "Use of eval()",
      description: "Use of eval() can lead to code injection vulnerabilities",
      severity: "high" as const,
      cweId: 95,
      recommendation: "Avoid using eval(). Use safer alternatives like JSON.parse() for data parsing.",
    },
    {
      pattern: /innerHTML\s*=\s*[^;]+\+/gi,
      title: "Potential XSS via innerHTML",
      description: "Dynamic content assignment to innerHTML without sanitization",
      severity: "high" as const,
      cweId: 79,
      recommendation: "Use textContent or sanitize HTML content before assignment.",
    },
    {
      pattern: /document\.write\s*\(/gi,
      title: "Use of document.write()",
      description: "document.write() can be exploited for XSS attacks",
      severity: "medium" as const,
      cweId: 79,
      recommendation: "Use modern DOM manipulation methods instead of document.write().",
    },
    {
      pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
      title: "Potential SQL Injection",
      description: "SQL query construction using string concatenation",
      severity: "critical" as const,
      cweId: 89,
      recommendation: "Use parameterized queries or prepared statements.",
    },
    {
      pattern: /password\s*=\s*["'][^"']+["']/gi,
      title: "Hardcoded Password",
      description: "Password appears to be hardcoded in source code",
      severity: "high" as const,
      cweId: 798,
      recommendation: "Store passwords in environment variables or secure configuration.",
    },
    {
      pattern: /Math\.random$$$$/gi,
      title: "Weak Random Number Generation",
      description: "Math.random() is not cryptographically secure",
      severity: "medium" as const,
      cweId: 338,
      recommendation: "Use crypto.getRandomValues() for security-sensitive random numbers.",
    },
  ]

  private qualityPatterns = [
    {
      pattern: /console\.log\s*\(/gi,
      title: "Console Statement",
      description: "Console statements should be removed from production code",
      severity: "low" as const,
      recommendation: "Remove console statements or use proper logging framework.",
    },
    {
      pattern: /debugger;/gi,
      title: "Debugger Statement",
      description: "Debugger statements should not be present in production code",
      severity: "medium" as const,
      recommendation: "Remove debugger statements before deployment.",
    },
    {
      pattern: /TODO|FIXME|HACK/gi,
      title: "TODO/FIXME Comment",
      description: "Unresolved TODO or FIXME comment found",
      severity: "low" as const,
      recommendation: "Address TODO/FIXME comments or create proper issue tracking.",
    },
  ]

  async analyzeFiles(files: Array<{ name: string; path: string; content: string }>): Promise<AnalysisResult> {
    const findings: Finding[] = []
    const metrics: CodeMetrics = {
      totalLines: 0,
      totalFiles: files.length,
      languages: {},
      complexity: 0,
      duplicateLines: 0,
      testFiles: 0,
    }

    for (const file of files) {
      const fileFindings = await this.analyzeFile(file)
      findings.push(...fileFindings)

      // Calculate metrics
      const lines = file.content.split("\n").length
      metrics.totalLines += lines

      // Detect language
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext) {
        metrics.languages[ext] = (metrics.languages[ext] || 0) + 1
      }

      // Check if test file
      if (file.name.includes("test") || file.name.includes("spec")) {
        metrics.testFiles++
      }

      // Calculate complexity (simplified)
      const complexityMatches = file.content.match(/if|for|while|switch|catch/gi)
      metrics.complexity += complexityMatches ? complexityMatches.length : 0
    }

    const security = this.analyzeSecurityFindings(findings)
    const coverage = this.analyzeCoverage(files, metrics)

    return {
      findings,
      metrics,
      security,
      coverage,
    }
  }

  private async analyzeFile(file: { name: string; path: string; content: string }): Promise<Finding[]> {
    const findings: Finding[] = []
    const lines = file.content.split("\n")

    // Security analysis
    for (const pattern of this.securityPatterns) {
      const matches = [...file.content.matchAll(pattern.pattern)]
      for (const match of matches) {
        const lineNumber = this.getLineNumber(file.content, match.index || 0)
        const line = lines[lineNumber - 1] || ""

        findings.push({
          id: `${file.path}_${lineNumber}_${pattern.title.replace(/\s+/g, "_")}`,
          title: pattern.title,
          description: pattern.description,
          category: "security",
          severity: pattern.severity,
          file: file.path,
          line: lineNumber,
          codeSnippet: this.getCodeSnippet(lines, lineNumber),
          recommendation: pattern.recommendation,
          rule: pattern.title.toLowerCase().replace(/\s+/g, "-"),
        })
      }
    }

    // Quality analysis
    for (const pattern of this.qualityPatterns) {
      const matches = [...file.content.matchAll(pattern.pattern)]
      for (const match of matches) {
        const lineNumber = this.getLineNumber(file.content, match.index || 0)
        const line = lines[lineNumber - 1] || ""

        findings.push({
          id: `${file.path}_${lineNumber}_${pattern.title.replace(/\s+/g, "_")}`,
          title: pattern.title,
          description: pattern.description,
          category: "quality",
          severity: pattern.severity,
          file: file.path,
          line: lineNumber,
          codeSnippet: this.getCodeSnippet(lines, lineNumber),
          recommendation: pattern.recommendation,
          rule: pattern.title.toLowerCase().replace(/\s+/g, "-"),
        })
      }
    }

    // Additional analysis patterns
    findings.push(...this.analyzeComplexity(file))
    findings.push(...this.analyzeNaming(file))
    findings.push(...this.analyzeDuplication(file))

    return findings
  }

  private analyzeComplexity(file: { name: string; path: string; content: string }): Finding[] {
    const findings: Finding[] = []
    const lines = file.content.split("\n")

    // Find functions with high complexity
    const functionRegex = /function\s+(\w+)\s*$$[^)]*$$\s*{/gi
    const matches = [...file.content.matchAll(functionRegex)]

    for (const match of matches) {
      const lineNumber = this.getLineNumber(file.content, match.index || 0)
      const functionName = match[1]

      // Simple complexity calculation
      const functionEnd = this.findFunctionEnd(file.content, match.index || 0)
      const functionCode = file.content.substring(match.index || 0, functionEnd)
      const complexityIndicators = functionCode.match(/if|for|while|switch|catch|\?|&&|\|\|/gi)
      const complexity = complexityIndicators ? complexityIndicators.length : 0

      if (complexity > 10) {
        findings.push({
          id: `${file.path}_${lineNumber}_complexity`,
          title: "High Cyclomatic Complexity",
          description: `Function '${functionName}' has high complexity (${complexity})`,
          category: "maintainability",
          severity: complexity > 20 ? "high" : "medium",
          file: file.path,
          line: lineNumber,
          codeSnippet: this.getCodeSnippet(lines, lineNumber),
          recommendation: "Consider breaking this function into smaller, more focused functions.",
          rule: "cyclomatic-complexity",
        })
      }
    }

    return findings
  }

  private analyzeNaming(file: { name: string; path: string; content: string }): Finding[] {
    const findings: Finding[] = []
    const lines = file.content.split("\n")

    // Check for single letter variables (except common ones like i, j, k)
    const variableRegex = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gi
    const matches = [...file.content.matchAll(variableRegex)]

    for (const match of matches) {
      const variableName = match[1]
      const lineNumber = this.getLineNumber(file.content, match.index || 0)

      if (variableName.length === 1 && !["i", "j", "k", "x", "y", "z"].includes(variableName)) {
        findings.push({
          id: `${file.path}_${lineNumber}_naming`,
          title: "Poor Variable Naming",
          description: `Variable '${variableName}' has a non-descriptive name`,
          category: "maintainability",
          severity: "low",
          file: file.path,
          line: lineNumber,
          codeSnippet: this.getCodeSnippet(lines, lineNumber),
          recommendation: "Use descriptive variable names that clearly indicate their purpose.",
          rule: "descriptive-naming",
        })
      }
    }

    return findings
  }

  private analyzeDuplication(file: { name: string; path: string; content: string }): Finding[] {
    const findings: Finding[] = []
    const lines = file.content.split("\n")

    // Simple duplication detection - look for identical lines
    const lineMap = new Map<string, number[]>()

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (trimmedLine.length > 20 && !trimmedLine.startsWith("//") && !trimmedLine.startsWith("*")) {
        if (!lineMap.has(trimmedLine)) {
          lineMap.set(trimmedLine, [])
        }
        lineMap.get(trimmedLine)!.push(index + 1)
      }
    })

    for (const [line, lineNumbers] of lineMap) {
      if (lineNumbers.length > 1) {
        findings.push({
          id: `${file.path}_duplication_${lineNumbers[0]}`,
          title: "Code Duplication",
          description: `Identical code found on lines ${lineNumbers.join(", ")}`,
          category: "maintainability",
          severity: "medium",
          file: file.path,
          line: lineNumbers[0],
          codeSnippet: line,
          recommendation: "Extract duplicated code into a reusable function or constant.",
          rule: "no-duplication",
        })
      }
    }

    return findings
  }

  private analyzeSecurityFindings(findings: Finding[]): SecurityAnalysis {
    const securityFindings = findings.filter((f) => f.category === "security")
    const vulnerabilities: SecurityVulnerability[] = []

    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    for (const finding of securityFindings) {
      counts[finding.severity]++

      // Convert finding to vulnerability format
      const pattern = this.securityPatterns.find((p) => p.title === finding.title)
      if (pattern) {
        vulnerabilities.push({
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          file: finding.file,
          line: finding.line,
          cweId: pattern.cweId,
          recommendation: finding.recommendation,
        })
      }
    }

    return {
      ...counts,
      vulnerabilities,
    }
  }

  private analyzeCoverage(
    files: Array<{ name: string; path: string; content: string }>,
    metrics: CodeMetrics,
  ): CoverageAnalysis {
    // Mock coverage analysis - in real implementation, this would parse actual coverage reports
    const testRatio = metrics.testFiles / metrics.totalFiles
    const baseCoverage = Math.min(Math.max(testRatio * 100, 30), 95)

    const filesCoverage = files.map((file) => ({
      path: file.path,
      coverage: Math.floor(baseCoverage + (Math.random() - 0.5) * 30),
      lines: Math.floor(baseCoverage + (Math.random() - 0.5) * 25),
      functions: Math.floor(baseCoverage + (Math.random() - 0.5) * 20),
    }))

    return {
      overall: Math.floor(baseCoverage),
      lines: Math.floor(baseCoverage + (Math.random() - 0.5) * 10),
      functions: Math.floor(baseCoverage + (Math.random() - 0.5) * 15),
      branches: Math.floor(baseCoverage + (Math.random() - 0.5) * 20),
      files: filesCoverage,
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length
  }

  private getCodeSnippet(lines: string[], lineNumber: number, context = 2): string {
    const start = Math.max(0, lineNumber - context - 1)
    const end = Math.min(lines.length, lineNumber + context)
    return lines.slice(start, end).join("\n")
  }

  private findFunctionEnd(content: string, startIndex: number): number {
    let braceCount = 0
    let inFunction = false

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i]
      if (char === "{") {
        braceCount++
        inFunction = true
      } else if (char === "}") {
        braceCount--
        if (inFunction && braceCount === 0) {
          return i
        }
      }
    }

    return content.length
  }
}

export const codeAnalyzer = new CodeAnalyzer()
