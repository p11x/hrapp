type StoredFile = {
  url: string
  filename: string
  size: number
  contentType: string
}

const fileStore = new Map<string, StoredFile>()

export const mockStorage = {
  ref: (path: string) => ({
    fullPath: path,
    name: path.split('/').pop() || '',
  }),

  uploadBytes: async (path: string, file: File) => {
    const url = URL.createObjectURL(file)
    fileStore.set(path, {
      url,
      filename: file.name,
      size: file.size,
      contentType: file.type,
    })
    return {
      ref: { fullPath: path, name: path.split('/').pop() || '' },
      metadata: { name: file.name, size: file.size, contentType: file.type },
    }
  },

  uploadBytesResumable: (_path: string, _file: File, _onProgress: (bytes: unknown) => void) => {
    return {
      ref: { getDownloadURL: async () => 'blob:test' },
    }
  },

  getDownloadURL: async (ref: { fullPath: string }) => {
    const stored = fileStore.get(ref.fullPath)
    return stored?.url || `blob:${ref.fullPath}`
  },

  getStoredFile: (path: string) => fileStore.get(path),
}