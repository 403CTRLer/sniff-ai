"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"
import type { Issue, SecurityIssue, ApiIssue } from "@/lib/models"

interface ResultsFiltersProps {
  filters: {
    severity: string
    category: string
    file: string
  }
  onFiltersChange: (filters: { severity: string; category: string; file: string }) => void
  issues: Issue[]
  securityIssues: SecurityIssue[]
  apiIssues: ApiIssue[]
}

export function ResultsFilters({ filters, onFiltersChange, issues, securityIssues, apiIssues }: ResultsFiltersProps) {
  const allFiles = Array.from(
    new Set([
      ...(issues || []).filter((i) => i?.file && typeof i.file === "string").map((i) => i.file),
      ...(securityIssues || []).filter((i) => i?.file && typeof i.file === "string").map((i) => i.file),
      ...(apiIssues || []).filter((i) => i?.file && typeof i.file === "string").map((i) => i.file),
    ]),
  ).sort()

  const categories = Array.from(
    new Set((issues || []).filter((i) => i?.category && typeof i.category === "string").map((i) => i.category)),
  ).sort()

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="bg-[#1A1A1A] border-[#333333]">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-[#D4AF37]" />
          <CardTitle className="text-white">Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Severity</Label>
          <Select value={filters.severity} onValueChange={(value) => updateFilter("severity", value)}>
            <SelectTrigger className="bg-[#0D0D0D] border-[#333333] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333]">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Category</Label>
          <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
            <SelectTrigger className="bg-[#0D0D0D] border-[#333333] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">File</Label>
          <Select value={filters.file} onValueChange={(value) => updateFilter("file", value)}>
            <SelectTrigger className="bg-[#0D0D0D] border-[#333333] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333]">
              <SelectItem value="all">All Files</SelectItem>
              {allFiles.map((file) => (
                <SelectItem key={file} value={file}>
                  {file && typeof file === "string" ? file.split("/").pop() || file : "Unknown File"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t border-[#333333]">
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Issues:</span>
              <span className="text-white">{(issues || []).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Security Issues:</span>
              <span className="text-white">{(securityIssues || []).length}</span>
            </div>
            <div className="flex justify-between">
              <span>API Issues:</span>
              <span className="text-white">{(apiIssues || []).length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
