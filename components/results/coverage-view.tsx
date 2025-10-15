import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CoverageViewProps {
  coverage:
    | {
        overall: number
        filesCovered: number
        totalFiles: number
        coverageByFile?: Record<string, number>
      }
    | any
}

export function CoverageView({ coverage }: CoverageViewProps) {
  // Normalize in case a different shape is passed
  const overall = Number(coverage?.overall ?? 0)
  const filesCovered = Number(coverage?.filesCovered ?? 0)
  const totalFiles = Number(coverage?.totalFiles ?? 0)
  const byFile: Record<string, number> = coverage?.coverageByFile ?? coverage?.byFile ?? {}

  const entries = Object.entries(byFile)

  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Overall Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white">{overall}%</div>
            <div className="text-sm text-muted-foreground">
              {filesCovered}/{totalFiles} files with coverage
            </div>
          </div>
          <Progress value={overall} className="h-2" />
        </CardContent>
      </Card>

      <Card className="bg-[#0D0D0D] border-[#333333]">
        <CardHeader>
          <CardTitle className="text-white">Coverage by File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No per-file coverage details available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entries.map(([path, pct]) => {
                const fileName = path.split("/").pop() || path
                return (
                  <div key={path} className="p-3 rounded border border-[#333333] bg-[#111111]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium truncate" title={path}>
                        {fileName}
                      </span>
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={Number(pct)} className="h-2" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
