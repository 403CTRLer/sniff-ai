"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle,
  AlertTriangle,
  Code,
  Database,
  Settings,
  ImageIcon,
  FileCode,
} from "lucide-react"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  language?: string
  children?: FileNode[]
  selected?: boolean
  analyzed?: boolean
  analysisResult?: BasicAnalysisResult
}

interface BasicAnalysisResult {
  lines: number
  functions: number
  classes: number
  complexity: number
  issues: number
  score: number
  language: string
  imports: number
}

interface FileExplorerProps {
  onFilesSelected: (files: FileNode[]) => void
  onAnalysisComplete: (results: BasicAnalysisResult[]) => void
}

// Mock file system structure
const mockFileSystem: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    path: "/src",
    children: [
      {
        id: "2",
        name: "components",
        type: "folder",
        path: "/src/components",
        children: [
          {
            id: "3",
            name: "Header.tsx",
            type: "file",
            path: "/src/components/Header.tsx",
            size: 2048,
            language: "TypeScript",
          },
          {
            id: "4",
            name: "Sidebar.tsx",
            type: "file",
            path: "/src/components/Sidebar.tsx",
            size: 3072,
            language: "TypeScript",
          },
          {
            id: "5",
            name: "Button.tsx",
            type: "file",
            path: "/src/components/Button.tsx",
            size: 1536,
            language: "TypeScript",
          },
        ],
      },
      {
        id: "6",
        name: "pages",
        type: "folder",
        path: "/src/pages",
        children: [
          {
            id: "7",
            name: "index.tsx",
            type: "file",
            path: "/src/pages/index.tsx",
            size: 4096,
            language: "TypeScript",
          },
          {
            id: "8",
            name: "about.tsx",
            type: "file",
            path: "/src/pages/about.tsx",
            size: 2560,
            language: "TypeScript",
          },
        ],
      },
      {
        id: "9",
        name: "utils",
        type: "folder",
        path: "/src/utils",
        children: [
          {
            id: "10",
            name: "helpers.ts",
            type: "file",
            path: "/src/utils/helpers.ts",
            size: 1024,
            language: "TypeScript",
          },
          {
            id: "11",
            name: "api.ts",
            type: "file",
            path: "/src/utils/api.ts",
            size: 2048,
            language: "TypeScript",
          },
        ],
      },
    ],
  },
  {
    id: "12",
    name: "public",
    type: "folder",
    path: "/public",
    children: [
      {
        id: "13",
        name: "images",
        type: "folder",
        path: "/public/images",
        children: [
          {
            id: "14",
            name: "logo.png",
            type: "file",
            path: "/public/images/logo.png",
            size: 8192,
            language: "Image",
          },
        ],
      },
    ],
  },
  {
    id: "15",
    name: "package.json",
    type: "file",
    path: "/package.json",
    size: 1024,
    language: "JSON",
  },
  {
    id: "16",
    name: "README.md",
    type: "file",
    path: "/README.md",
    size: 2048,
    language: "Markdown",
  },
]

export function FileExplorer({ onFilesSelected, onAnalysisComplete }: FileExplorerProps) {
  const [fileSystem, setFileSystem] = useState<FileNode[]>(mockFileSystem)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2", "6"]))
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return expandedFolders.has(node.id) ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      )
    }

    switch (node.language) {
      case "TypeScript":
      case "JavaScript":
        return <FileCode className="w-4 h-4 text-blue-500" />
      case "JSON":
        return <Database className="w-4 h-4 text-yellow-500" />
      case "Markdown":
        return <FileText className="w-4 h-4 text-green-500" />
      case "Image":
        return <ImageIcon className="w-4 h-4 text-purple-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const toggleFileSelection = (fileId: string, node: FileNode) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const selectAllInFolder = (folderId: string, nodes: FileNode[]) => {
    const folderNode = findNodeById(nodes, folderId)
    if (folderNode && folderNode.children) {
      const allFileIds = getAllFileIds(folderNode.children)
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        allFileIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const getAllFileIds = (nodes: FileNode[]): string[] => {
    const ids: string[] = []
    for (const node of nodes) {
      if (node.type === "file") {
        ids.push(node.id)
      }
      if (node.children) {
        ids.push(...getAllFileIds(node.children))
      }
    }
    return ids
  }

  const getSelectedFileNodes = (): FileNode[] => {
    const selected: FileNode[] = []
    const findSelected = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === "file" && selectedFiles.has(node.id)) {
          selected.push(node)
        }
        if (node.children) {
          findSelected(node.children)
        }
      }
    }
    findSelected(fileSystem)
    return selected
  }

  const analyzeBasicFunctionality = async (node: FileNode): Promise<BasicAnalysisResult> => {
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    // Mock analysis based on file type and size
    const baseComplexity = Math.floor((node.size || 1000) / 100)
    const language = node.language || "Unknown"

    const result: BasicAnalysisResult = {
      lines: Math.floor((node.size || 1000) / 25), // Rough estimate: 25 chars per line
      functions: 0,
      classes: 0,
      complexity: baseComplexity,
      issues: 0,
      score: 85,
      language,
      imports: 0,
    }

    // Language-specific analysis
    switch (language) {
      case "TypeScript":
      case "JavaScript":
        result.functions = Math.floor(result.lines / 15) + Math.floor(Math.random() * 5)
        result.classes = Math.floor(result.functions / 3) + Math.floor(Math.random() * 2)
        result.imports = Math.floor(result.lines / 20) + Math.floor(Math.random() * 3)
        result.issues = Math.floor(Math.random() * 3)
        result.complexity = baseComplexity + Math.floor(Math.random() * 10)
        result.score = Math.max(60, 95 - result.issues * 5 - Math.floor(result.complexity / 2))
        break

      case "JSON":
        result.functions = 0
        result.classes = 0
        result.imports = 0
        result.issues = Math.floor(Math.random() * 2)
        result.complexity = 1
        result.score = result.issues === 0 ? 100 : 85
        break

      case "Markdown":
        result.functions = 0
        result.classes = 0
        result.imports = 0
        result.issues = 0
        result.complexity = 1
        result.score = 100
        break

      default:
        result.issues = Math.floor(Math.random() * 2)
        result.score = 80 + Math.floor(Math.random() * 20)
    }

    return result
  }

  const runBasicAnalysis = async () => {
    const selectedNodes = getSelectedFileNodes()
    if (selectedNodes.length === 0) return

    setAnalyzing(true)
    setAnalysisProgress(0)

    const results: BasicAnalysisResult[] = []
    const updatedFileSystem = [...fileSystem]

    for (let i = 0; i < selectedNodes.length; i++) {
      const node = selectedNodes[i]
      const result = await analyzeBasicFunctionality(node)
      results.push(result)

      // Update the file system with analysis results
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((n) => {
          if (n.id === node.id) {
            return { ...n, analyzed: true, analysisResult: result }
          }
          if (n.children) {
            return { ...n, children: updateNode(n.children) }
          }
          return n
        })
      }

      setFileSystem(updateNode(updatedFileSystem))
      setAnalysisProgress(((i + 1) / selectedNodes.length) * 100)
    }

    setAnalyzing(false)
    onAnalysisComplete(results)
    onFilesSelected(selectedNodes)
  }

  const filterNodes = (nodes: FileNode[], term: string): FileNode[] => {
    if (!term) return nodes

    return nodes
      .map((node) => {
        if (node.type === "file" && node.name.toLowerCase().includes(term.toLowerCase())) {
          return node
        }
        if (node.type === "folder" && node.children) {
          const filteredChildren = filterNodes(node.children, term)
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(term.toLowerCase())) {
            return { ...node, children: filteredChildren }
          }
        }
        return null
      })
      .filter(Boolean) as FileNode[]
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    const filteredNodes = searchTerm ? filterNodes(nodes, searchTerm) : nodes

    return filteredNodes.map((node) => (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-800 cursor-pointer ${
            selectedFiles.has(node.id) ? "bg-gold/10 border-l-2 border-gold" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {node.type === "folder" && (
            <button onClick={() => toggleFolder(node.id)} className="p-0.5 hover:bg-gray-700 rounded">
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}

          {node.type === "file" && (
            <Checkbox
              checked={selectedFiles.has(node.id)}
              onCheckedChange={() => toggleFileSelection(node.id, node)}
              className="w-4 h-4"
            />
          )}

          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getFileIcon(node)}
            <span className="text-white text-sm truncate">{node.name}</span>

            {node.analyzed && node.analysisResult && (
              <div className="flex items-center space-x-1">
                {node.analysisResult.score >= 80 ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                )}
                <span className="text-xs text-gray-400">{node.analysisResult.score}</span>
              </div>
            )}

            {node.type === "file" && (
              <div className="flex items-center space-x-2">
                {node.language && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {node.language}
                  </Badge>
                )}
                {node.size && <span className="text-xs text-gray-500">{Math.round(node.size / 1024)}KB</span>}
              </div>
            )}

            {node.type === "folder" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectAllInFolder(node.id, fileSystem)}
                className="text-xs text-gray-400 hover:text-white h-6 px-2"
              >
                Select All
              </Button>
            )}
          </div>
        </div>

        {node.type === "folder" && node.children && expandedFolders.has(node.id) && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  const selectedCount = selectedFiles.size
  const analyzedCount = getSelectedFileNodes().filter((n) => n.analyzed).length

  return (
    <Card className="bg-black border-gray-800 h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Code className="w-5 h-5" />
          <span>File Explorer</span>
        </CardTitle>
        <CardDescription className="text-text-secondary">Browse and select files for code analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
          <div className="text-sm text-white">
            <span className="font-medium">{selectedCount}</span> files selected
            {analyzedCount > 0 && <span className="text-gray-400 ml-2">• {analyzedCount} analyzed</span>}
          </div>
          <Button
            onClick={runBasicAnalysis}
            disabled={selectedCount === 0 || analyzing}
            size="sm"
            className="bg-gold text-black hover:bg-gold-light font-medium disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze Selected
              </>
            )}
          </Button>
        </div>

        {/* Analysis Progress */}
        {analyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white">
              <span>Running basic analysis...</span>
              <span>{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2 bg-gray-800" />
          </div>
        )}

        {/* File Tree */}
        <div className="border border-gray-800 rounded-lg bg-gray-950 max-h-96 overflow-y-auto">
          <div className="p-2">{renderFileTree(fileSystem)}</div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedFiles(new Set())}
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            Clear Selection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allFileIds = getAllFileIds(fileSystem)
              setSelectedFiles(new Set(allFileIds))
            }}
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            Select All Files
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
