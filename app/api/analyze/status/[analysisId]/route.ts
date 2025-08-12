import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { analysisId: string } }) {
  try {
    const { analysisId } = params

    if (!analysisId) {
      return NextResponse.json({ success: false, error: "Analysis ID is required" }, { status: 400 })
    }

    // Mock status response - in real implementation, check actual analysis status
    const mockProgress = Math.min(100, Math.floor(Math.random() * 100) + 50)
    const isCompleted = mockProgress >= 95

    return NextResponse.json({
      success: true,
      analysisId,
      status: isCompleted ? "completed" : "processing",
      progress: mockProgress,
      estimatedTimeRemaining: isCompleted ? 0 : Math.floor(Math.random() * 30) + 10,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ success: false, error: "Failed to get analysis status" }, { status: 500 })
  }
}
