import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 })
    }

    // Mock project analysis data
    const mockAnalysis = {
      name: "Sample Project",
      source: "https://github.com/user/repo",
      totalFiles: 45,
      totalLines: 12500,
      language: "TypeScript",
      overallHealth: {
        score: 85,
        aiGeneratedPercentage: 15,
        testCoverage: 78,
        securityScore: 92,
      },
      lastCommit: {
        message: "Add user authentication system",
        author: "John Doe",
        date: "2024-01-15",
        riskScore: 35,
        filesChanged: 8,
        linesAdded: 245,
        linesRemoved: 67,
        suggestions: [
          {
            type: "security",
            severity: "high",
            title: "Missing input validation",
            description: "User input should be validated before processing",
            file: "src/auth/login.ts",
            line: 42,
            suggestion: "Add input validation using a schema validator",
            codeExample: "const schema = z.object({ email: z.string().email() })",
          },
        ],
      },
      fileAnalyses: [
        {
          id: "1",
          filename: "auth.ts",
          size: "2.3 KB",
          language: "TypeScript",
          results: {
            overallScore: 88,
            aiGenerated: { score: 12 },
            logicFlaws: { count: 1 },
            apiMisuse: { count: 0 },
            testCoverage: { percentage: 85 },
          },
        },
      ],
      trends: {
        commitFrequency: [5, 8, 12, 6, 9],
        qualityTrend: [75, 78, 82, 85],
        testCoverageTrend: [65, 70, 75, 78],
      },
    }

    return NextResponse.json({
      success: true,
      projectId,
      analysis: mockAnalysis,
    })
  } catch (error) {
    console.error("Project analysis error:", error)
    return NextResponse.json({ success: false, error: "Failed to get project analysis" }, { status: 500 })
  }
}
