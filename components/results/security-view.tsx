import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, Lock, Key, Bug, CheckCircle } from "lucide-react"
import type { SecurityIssue } from "@/lib/models"

interface SecurityViewProps {
  issues: SecurityIssue[]
}

export function SecurityView({ issues }: SecurityViewProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "injection":
        return <Bug className="h-4 w-4" />
      case "auth":
        return <Lock className="h-4 w-4" />
      case "crypto":
        return <Key className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900 text-red-400 border-red-400"
      case "high":
        return "bg-orange-900 text-orange-400 border-orange-400"
      case "medium":
        return "bg-yellow-900 text-yellow-400 border-yellow-400"
      case "low":
        return "bg-blue-900 text-blue-400 border-blue-400"
      default:
        return "bg-gray-900 text-gray-400 border-gray-400"
    }
  }

  if (issues.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-green-900/20 border-green-400">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="text-lg font-semibold text-green-400">No Security Issues Found</h3>
                <p className="text-green-300">
                  Great! Your code appears to be free of common security vulnerabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D0D0D] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                <Lock className="h-4 w-4 text-[#D4AF37] mt-0.5" />
                <div>
                  <p className="text-[#D4AF37] font-medium">Keep Dependencies Updated</p>
                  <p className="text-[#D4AF37]/80">
                    Regularly update your dependencies to patch known vulnerabilities.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-900/20 border border-blue-400/20 rounded">
                <Key className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium">Secure Authentication</p>
                  <p className="text-blue-400/80">Implement proper authentication and authorization mechanisms.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id} className="bg-[#0D0D0D] border-[#333333]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSeverityIcon(issue.severity)}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    <Badge variant="outline" className="border-[#333333] text-muted-foreground">
                      {issue.type}
                    </Badge>
                    {issue.cwe && (
                      <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                        CWE-{issue.cwe}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white text-base">
                    {issue.message || (issue as any).title || "No message available"}
                  </CardTitle>
                </div>
              </div>
              {getTypeIcon(issue.type)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">File:</span>
                <p className="text-white font-mono">{issue.file || (issue as any).filePath || "Unknown file"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Line:</span>
                <p className="text-white">{issue.line ?? (issue as any).lineNumber ?? 0}</p>
              </div>
            </div>

            {(issue.suggestion || (issue as any).recommendation) && (
              <Alert className="border-[#D4AF37] bg-[#D4AF37]/5">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-[#D4AF37]">
                  <strong>Recommendation:</strong> {issue.suggestion ?? (issue as any).recommendation}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
