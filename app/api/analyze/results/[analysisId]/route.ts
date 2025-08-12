import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { analysisId: string } }) {
  try {
    const { analysisId } = params

    if (!analysisId) {
      return NextResponse.json({ success: false, error: "Analysis ID is required" }, { status: 400 })
    }

    // Mock analysis results - in real implementation, fetch from database
    const mockResults = [
      {
        filename: "example.js",
        results: {
          aiGenerated: {
            score: Math.floor(Math.random() * 100),
            confidence: Math.random() > 0.5 ? "High" : "Medium",
            patterns: ["Repetitive code structure", "Generic variable names", "Lack of edge case handling"],
          },
          logicFlaws: {
            count: Math.floor(Math.random() * 5),
            severity: Math.random() > 0.5 ? "Medium" : "Low",
            issues: [
              { line: 42, type: "Null Pointer", description: "Potential null reference without check" },
              { line: 78, type: "Logic Error", description: "Incorrect condition in loop" },
            ],
          },
          apiMisuse: {
            count: Math.floor(Math.random() * 3),
            issues: [
              { line: 23, api: "fetch()", issue: "Missing error handling" },
              { line: 56, api: "localStorage", issue: "No availability check" },
            ],
          },
          testCoverage: {
            percentage: Math.floor(Math.random() * 40) + 60,
            missing: ["error handling", "edge cases", "async operations"],
          },
          overallScore: Math.floor(Math.random() * 30) + 70,
        },
      },
    ]

    return NextResponse.json({
      success: true,
      analysisId,
      results: mockResults,
    })
  } catch (error) {
    console.error("Results fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to get analysis results" }, { status: 500 })
  }
}
