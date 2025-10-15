import type { Project, AnalysisRun, ProjectFile } from "./models"

// IndexedDB database configuration
const DB_NAME = "SniffAI"
const DB_VERSION = 1
const PROJECTS_STORE = "projects"
const RUNS_STORE = "analysis_runs"
const FILES_STORE = "project_files"

class SniffAIStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: "id" })
          projectStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        // Create analysis runs store
        if (!db.objectStoreNames.contains(RUNS_STORE)) {
          const runsStore = db.createObjectStore(RUNS_STORE, { keyPath: "id" })
          runsStore.createIndex("projectId", "projectId", { unique: false })
          runsStore.createIndex("startedAt", "startedAt", { unique: false })
        }

        // Create project files store
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const filesStore = db.createObjectStore(FILES_STORE, { keyPath: "id" })
          filesStore.createIndex("projectId", "projectId", { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // Project operations
  async createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    const db = await this.ensureDB()
    const now = new Date()
    const id = crypto.randomUUID()

    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readwrite")
      const store = transaction.objectStore(PROJECTS_STORE)
      const request = store.add(newProject)

      request.onsuccess = () => resolve(newProject)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjects(): Promise<Project[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly")
      const store = transaction.objectStore(PROJECTS_STORE)
      const index = store.index("createdAt")
      const request = index.getAll()

      request.onsuccess = () => {
        const projects = request.result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        resolve(projects)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: string): Promise<Project | null> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE], "readonly")
      const store = transaction.objectStore(PROJECTS_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: string): Promise<boolean> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE, RUNS_STORE, FILES_STORE], "readwrite")

      // Delete project
      const projectStore = transaction.objectStore(PROJECTS_STORE)
      projectStore.delete(id)

      // Delete associated runs
      const runsStore = transaction.objectStore(RUNS_STORE)
      const runsIndex = runsStore.index("projectId")
      const runsRequest = runsIndex.getAll(id)

      runsRequest.onsuccess = () => {
        runsRequest.result.forEach((run) => runsStore.delete(run.id))
      }

      // Delete associated files
      const filesStore = transaction.objectStore(FILES_STORE)
      const filesIndex = filesStore.index("projectId")
      const filesRequest = filesIndex.getAll(id)

      filesRequest.onsuccess = () => {
        filesRequest.result.forEach((file) => filesStore.delete(file.id))
      }

      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Analysis run operations
  async createAnalysisRun(projectId: string): Promise<AnalysisRun> {
    const db = await this.ensureDB()
    const id = crypto.randomUUID()

    const newRun: AnalysisRun = {
      id,
      projectId,
      status: "queued",
      startedAt: new Date(),
      logs: [],
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RUNS_STORE], "readwrite")
      const store = transaction.objectStore(RUNS_STORE)
      const request = store.add(newRun)

      request.onsuccess = () => resolve(newRun)
      request.onerror = () => reject(request.error)
    })
  }

  async updateAnalysisRun(runId: string, update: Partial<AnalysisRun>): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RUNS_STORE], "readwrite")
      const store = transaction.objectStore(RUNS_STORE)
      const getRequest = store.get(runId)

      getRequest.onsuccess = () => {
        const existingRun = getRequest.result
        if (!existingRun) {
          reject(new Error("Analysis run not found"))
          return
        }

        const updatedRun = { ...existingRun, ...update }
        const putRequest = store.put(updatedRun)

        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getAnalysisRun(runId: string): Promise<AnalysisRun | null> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RUNS_STORE], "readonly")
      const store = transaction.objectStore(RUNS_STORE)
      const request = store.get(runId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RUNS_STORE], "readonly")
      const store = transaction.objectStore(RUNS_STORE)
      const index = store.index("projectId")
      const request = index.getAll(projectId)

      request.onsuccess = () => {
        const runs = request.result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        resolve(runs)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Project files operations
  async saveProjectFiles(projectId: string, files: ProjectFile[]): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], "readwrite")
      const store = transaction.objectStore(FILES_STORE)

      files.forEach((file) => {
        const fileRecord = {
          id: crypto.randomUUID(),
          projectId,
          ...file,
        }
        store.add(fileRecord)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], "readonly")
      const store = transaction.objectStore(FILES_STORE)
      const index = store.index("projectId")
      const request = index.getAll(projectId)

      request.onsuccess = () => {
        const files = request.result.map((record) => ({
          path: record.path,
          content: record.content,
          size: record.size,
          type: record.type,
        }))
        resolve(files)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Export/Import functionality
  async exportData(): Promise<{ projects: Project[]; runs: AnalysisRun[] }> {
    const projects = await this.getProjects()
    const runs: AnalysisRun[] = []

    for (const project of projects) {
      const projectRuns = await this.getProjectRuns(project.id)
      runs.push(...projectRuns)
    }

    return { projects, runs }
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECTS_STORE, RUNS_STORE, FILES_STORE], "readwrite")

      transaction.objectStore(PROJECTS_STORE).clear()
      transaction.objectStore(RUNS_STORE).clear()
      transaction.objectStore(FILES_STORE).clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

// Create singleton instance
export const storage = new SniffAIStorage()

// Initialize storage on module load
if (typeof window !== "undefined") {
  storage.init().catch(console.error)
}
