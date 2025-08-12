import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = params

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 })
    }

    // Mock latest commit analysis
    const mockCommitAnalysis = {
      commit: {
        hash: "abc123def456",
        message: "Add user authentication system",
        author: "John Doe",
        date: "2024-01-15T10:30:00Z",
        filesChanged: 8,
        linesAdded: 245,
        linesRemoved: 67,
      },
      analysis: {
        riskScore: 35,
        aiLikelihood: 25,
        issues: [
          {
            type: "security",
            severity: "high",
            file: "src/auth/login.ts",
            line: 42,
            message: "Missing input validation",
            suggestion: "Add input validation using a schema validator",
          },
        ],
        suggestions: [
          {
            type: "improvement",
            priority: "medium",
            title: "Add error handling",
            description: "Improve error handling in authentication flow",
            impact: "Better user experience and debugging",
          },
        ],
      },
    }

    return NextResponse.json({
      success: true,
      projectId,
      commitAnalysis: mockCommitAnalysis,
    })
  } catch (error) {
    console.error("Commit analysis error:", error)
    return NextResponse.json({ success: false, error: "Failed to get commit analysis" }, { status: 500 })
  }
}
