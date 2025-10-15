// Web Worker for heavy analysis tasks
import { AnalysisEngine } from "./analysis-engine"

const engine = new AnalysisEngine()

self.onmessage = async (e) => {
  const { files, options } = e.data

  try {
    // Perform analysis in worker thread
    const result = await engine.analyzeProject(files, options)
    self.postMessage(result)
  } catch (error) {
    self.postMessage({ error: error.message })
  }
}
