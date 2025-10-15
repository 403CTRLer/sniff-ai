import type { Finding, ProjectFile } from "../models"

export interface LanguageAnalyzer {
  analyze(file: ProjectFile): Finding[]
  getSupportedExtensions(): string[]
}

export class JavaScriptAnalyzer implements LanguageAnalyzer {
  getSupportedExtensions(): string[] {
    return ["js", "jsx", "ts", "tsx", "mjs"]
  }

  analyze(file: ProjectFile): Finding[] {
    const findings: Finding[] = []
    const content = file.content
    const lines = content.split("\n")

    // Advanced JavaScript/TypeScript analysis
    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Detect unused variables (simple pattern)
      const varDeclaration = line.match(/(?:let|const|var)\s+(\w+)/)
      if (
        varDeclaration &&
        !content.includes(varDeclaration[1] + ".") &&
        !content.includes(varDeclaration[1] + "(") &&
        !content.includes("return " + varDeclaration[1])
      ) {
        findings.push({
          id: `unused-var-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "low",
          category: "unused-code",
          title: "Potentially unused variable",
          description: `Variable '${varDeclaration[1]}' may be unused`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.indexOf(varDeclaration[1]) + 1,
          codeSnippet: line.trim(),
          suggestion: "Remove unused variables to improve code clarity",
          confidence: 0.6,
        })
      }

      // Detect missing semicolons
      if (line.trim().match(/^(let|const|var|return|throw).*[^;{}\s]$/) && !line.includes("//")) {
        findings.push({
          id: `missing-semicolon-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "low",
          category: "style",
          title: "Missing semicolon",
          description: `Missing semicolon at end of line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: line.length,
          codeSnippet: line.trim(),
          suggestion: "Add semicolon for consistency and clarity",
          confidence: 0.8,
        })
      }
    })

    return findings
  }
}

export class PythonAnalyzer implements LanguageAnalyzer {
  getSupportedExtensions(): string[] {
    return ["py", "pyw"]
  }

  analyze(file: ProjectFile): Finding[] {
    const findings: Finding[] = []
    const content = file.content
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // PEP 8 line length
      if (line.length > 79) {
        findings.push({
          id: `pep8-line-length-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "low",
          category: "style",
          title: "PEP 8 line length violation",
          description: `Line ${lineNumber} exceeds PEP 8 limit of 79 characters`,
          filePath: file.path,
          lineNumber,
          columnNumber: 80,
          codeSnippet: line.substring(0, 100) + (line.length > 100 ? "..." : ""),
          suggestion: "Break long lines according to PEP 8 guidelines",
          confidence: 0.9,
        })
      }

      // Detect bare except clauses
      if (line.trim() === "except:") {
        findings.push({
          id: `bare-except-${file.path}-${lineNumber}`,
          type: "quality",
          severity: "medium",
          category: "error-handling",
          title: "Bare except clause",
          description: `Bare except clause at line ${lineNumber}`,
          filePath: file.path,
          lineNumber,
          columnNumber: 1,
          codeSnippet: line.trim(),
          suggestion: "Specify exception types instead of using bare except",
          confidence: 0.95,
        })
      }
    })

    return findings
  }
}

export class AnalyzerRegistry {
  private analyzers: LanguageAnalyzer[] = [new JavaScriptAnalyzer(), new PythonAnalyzer()]

  getAnalyzerForFile(filePath: string): LanguageAnalyzer | null {
    const extension = filePath.split(".").pop()?.toLowerCase()
    if (!extension) return null

    return this.analyzers.find((analyzer) => analyzer.getSupportedExtensions().includes(extension)) || null
  }

  getAllSupportedExtensions(): string[] {
    return this.analyzers.flatMap((analyzer) => analyzer.getSupportedExtensions())
  }
}
