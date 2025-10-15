import { storage } from "./storage"
import type { Project, AnalysisRun, ProjectFile } from "./models"

export class ClientOperations {
  static async createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    return await storage.createProject(project)
  }

  static async getProjects(): Promise<Project[]> {
    return await storage.getProjects()
  }

  static async getProject(id: string): Promise<Project | null> {
    return await storage.getProject(id)
  }

  static async deleteProject(id: string): Promise<boolean> {
    return await storage.deleteProject(id)
  }

  static async createAnalysisRun(projectId: string): Promise<AnalysisRun> {
    return await storage.createAnalysisRun(projectId)
  }

  static async updateAnalysisRun(runId: string, update: Partial<AnalysisRun>): Promise<void> {
    return await storage.updateAnalysisRun(runId, update)
  }

  static async getAnalysisRun(runId: string): Promise<AnalysisRun | null> {
    return await storage.getAnalysisRun(runId)
  }

  static async getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
    return await storage.getProjectRuns(projectId)
  }

  static async exportProjectData(): Promise<string> {
    const data = await storage.exportData()
    return JSON.stringify(data, null, 2)
  }

  static async clearAllData(): Promise<void> {
    return await storage.clearAllData()
  }

  static async saveResultsToFile(filename: string, data: any): Promise<void> {
    if ("showSaveFilePicker" in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON files",
              accept: { "application/json": [".json"] },
            },
          ],
        })

        const writable = await fileHandle.createWritable()
        await writable.write(JSON.stringify(data, null, 2))
        await writable.close()
      } catch (error) {
        // User cancelled or browser doesn't support File System Access API
        this.downloadAsFile(filename, JSON.stringify(data, null, 2))
      }
    } else {
      // Fallback to download
      this.downloadAsFile(filename, JSON.stringify(data, null, 2))
    }
  }

  private static downloadAsFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static async saveProjectFiles(projectId: string, files: ProjectFile[]): Promise<void> {
    return await storage.saveProjectFiles(projectId, files)
  }

  static async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return await storage.getProjectFiles(projectId)
  }
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
  return ClientOperations.createProject(project)
}

export async function getProjects(): Promise<Project[]> {
  return ClientOperations.getProjects()
}

export async function getProject(id: string): Promise<Project | null> {
  return ClientOperations.getProject(id)
}

export async function deleteProject(id: string): Promise<boolean> {
  return ClientOperations.deleteProject(id)
}

export async function createAnalysisRun(projectId: string): Promise<AnalysisRun> {
  return ClientOperations.createAnalysisRun(projectId)
}

export async function updateAnalysisRun(runId: string, update: Partial<AnalysisRun>): Promise<void> {
  return ClientOperations.updateAnalysisRun(runId, update)
}

export async function getAnalysisRun(runId: string): Promise<AnalysisRun | null> {
  return ClientOperations.getAnalysisRun(runId)
}

export async function getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
  return ClientOperations.getProjectRuns(projectId)
}

export async function exportProjectData(): Promise<string> {
  return ClientOperations.exportProjectData()
}

export async function clearAllData(): Promise<void> {
  return ClientOperations.clearAllData()
}

export async function saveResultsToFile(filename: string, data: any): Promise<void> {
  return ClientOperations.saveResultsToFile(filename, data)
}

export async function saveProjectFiles(projectId: string, files: ProjectFile[]): Promise<void> {
  return ClientOperations.saveProjectFiles(projectId, files)
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  return ClientOperations.getProjectFiles(projectId)
}
