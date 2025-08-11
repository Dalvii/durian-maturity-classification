// Service de gestion de la queue locale avec IndexedDB

export interface QueuedFile {
  id: string
  file: Blob
  fileName: string
  type: "training" | "classification"
  metadata: {
    label?: "mature" | "overripe" // Pour training
    timestamp: number
  }
  status: "pending" | "uploading" | "failed"
  retryCount: number
}

class OfflineQueueService {
  private dbName = "AudioQueueDB"
  private dbVersion = 1
  private storeName = "audioQueue"
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" })
          store.createIndex("status", "status", { unique: false })
          store.createIndex("type", "type", { unique: false })
        }
      }
    })
  }

  async addToQueue(
    file: Blob,
    fileName: string,
    type: "training" | "classification",
    metadata: { label?: "mature" | "overripe" },
  ): Promise<string> {
    if (!this.db) await this.init()

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queuedFile: QueuedFile = {
      id,
      file,
      fileName,
      type,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
      status: "pending",
      retryCount: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.add(queuedFile)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async getQueuedFiles(): Promise<QueuedFile[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateFileStatus(id: string, status: QueuedFile["status"], retryCount?: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const file = getRequest.result
        if (file) {
          file.status = status
          if (retryCount !== undefined) {
            file.retryCount = retryCount
          }
          const updateRequest = store.put(file)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          reject(new Error("File not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingFiles(): Promise<QueuedFile[]> {
    const allFiles = await this.getQueuedFiles()
    return allFiles.filter((file) => file.status === "pending" || file.status === "failed")
  }

  async clearQueue(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineQueueService = new OfflineQueueService()
