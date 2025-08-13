interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  content?: string
  size: number
  download_url?: string
}

interface GitHubTreeItem {
  path: string
  type: "blob" | "tree"
  sha: string
  size?: number
  url: string
}

export class GitHubService {
  private baseUrl = "https://api.github.com"

  async fetchRepository(repoUrl: string, branch = "main", accessToken?: string): Promise<GitHubFile[]> {
    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) {
        throw new Error("Invalid GitHub repository URL")
      }

      const [, owner, repoName] = match
      const repo = repoName.replace(".git", "")

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SniffAI-CodeAnalyzer",
      }

      if (accessToken) {
        headers["Authorization"] = `token ${accessToken}`
      }

      // Get repository tree
      const treeUrl = `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      const treeResponse = await fetch(treeUrl, { headers })

      if (!treeResponse.ok) {
        if (treeResponse.status === 404) {
          throw new Error("Repository not found or branch does not exist")
        }
        if (treeResponse.status === 403) {
          throw new Error("Access denied. Repository may be private or rate limit exceeded")
        }
        throw new Error(`Failed to fetch repository: ${treeResponse.statusText}`)
      }

      const treeData = await treeResponse.json()
      const files: GitHubFile[] = []

      // Filter for code files and limit to reasonable size
      const codeExtensions = [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".cs",
        ".php",
        ".rb",
        ".go",
        ".rs",
        ".kt",
        ".swift",
        ".json",
        ".yaml",
        ".yml",
        ".md",
      ]
      const maxFileSize = 1024 * 1024 // 1MB limit per file
      const maxFiles = 100 // Limit total files

      const codeFiles = treeData.tree
        .filter(
          (item: GitHubTreeItem) =>
            item.type === "blob" &&
            codeExtensions.some((ext) => item.path.endsWith(ext)) &&
            (item.size || 0) < maxFileSize,
        )
        .slice(0, maxFiles)

      // Fetch file contents
      for (const file of codeFiles) {
        try {
          const contentUrl = `${this.baseUrl}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
          const contentResponse = await fetch(contentUrl, { headers })

          if (contentResponse.ok) {
            const contentData = await contentResponse.json()
            const content = contentData.content ? atob(contentData.content) : ""

            files.push({
              name: file.path.split("/").pop() || file.path,
              path: file.path,
              type: "file",
              content,
              size: file.size || 0,
            })
          }
        } catch (error) {
          console.warn(`Failed to fetch content for ${file.path}:`, error)
        }
      }

      return files
    } catch (error) {
      console.error("GitHub fetch error:", error)
      throw error
    }
  }

  async validateRepository(repoUrl: string, accessToken?: string): Promise<boolean> {
    try {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!match) return false

      const [, owner, repoName] = match
      const repo = repoName.replace(".git", "")

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SniffAI-CodeAnalyzer",
      }

      if (accessToken) {
        headers["Authorization"] = `token ${accessToken}`
      }

      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, { headers })
      return response.ok
    } catch {
      return false
    }
  }
}

export const githubService = new GitHubService()
