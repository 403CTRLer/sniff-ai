"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, FileText, MapPin, Lightbulb } from "lucide-react"
import type { Issue } from "@/lib/models"

interface FindingsTableProps {
  issues: Issue[]
}

export function FindingsTable({ issues }: FindingsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (issueId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedRows(newExpanded)
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bug":
        return "bg-red-900/50 text-red-300 border-red-400"
      case "performance":
        return "bg-orange-900/50 text-orange-300 border-orange-400"
      case "style":
        return "bg-blue-900/50 text-blue-300 border-blue-400"
      case "maintainability":
        return "bg-green-900/50 text-green-300 border-green-400"
      default:
        return "bg-gray-900/50 text-gray-300 border-gray-400"
    }
  }

  const safeIssues = issues || []

  if (safeIssues.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-[#D4AF37] mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No issues found</h3>
        <p className="text-muted-foreground">Great! No issues match your current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {safeIssues.map((issue) => (
        <Collapsible key={issue.id} open={expandedRows.has(issue.id)} onOpenChange={() => toggleRow(issue.id)}>
          <CollapsibleTrigger asChild>
            <div className="w-full p-4 bg-[#0D0D0D] border border-[#333333] rounded-lg hover:border-[#D4AF37] transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    {expandedRows.has(issue.id) ? (
                      <ChevronDown className="h-4 w-4 text-[#D4AF37]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getSeverityColor(issue.severity || "low")}>{issue.severity || "low"}</Badge>
                      <Badge variant="outline" className={getCategoryColor(issue.category || "other")}>
                        {issue.category || "other"}
                      </Badge>
                    </div>
                    <p className="text-white font-medium truncate">
                      {issue.message || (issue as any).title || "No message available"}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1 min-w-0">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate" title={(issue as any).filePath || issue.file || "Unknown file"}>
                          {(() => {
                            const f = (issue as any).filePath || issue.file
                            return f && typeof f === "string" ? f.split("/").pop() || f : "Unknown file"
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          Line {(issue as any).line ?? (issue as any).lineNumber ?? 0}:
                          {(issue as any).column ?? (issue as any).columnNumber ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 bg-[#1A1A1A] border border-[#333333] rounded-lg space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">File Location</h4>
                <p className="text-sm text-muted-foreground font-mono">{issue.file || "Unknown file"}</p>
              </div>

              {(issue.code || (issue as any).codeSnippet) && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Code Context</h4>
                  <pre className="text-sm bg-[#0D0D0D] border border-[#333333] rounded p-3 overflow-x-auto">
                    <code className="text-green-400">{issue.code ?? (issue as any).codeSnippet}</code>
                  </pre>
                </div>
              )}

              {issue.suggestion && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-[#D4AF37]" />
                    <h4 className="text-sm font-semibold text-white">Suggested Fix</h4>
                  </div>
                  <p className="text-sm text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded p-3">
                    {issue.suggestion}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
