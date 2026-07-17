const API_URL = import.meta.env.VITE_API_URL ?? ''

export interface UploadResult {
  key: string
  size: number
}

export async function uploadGeneratedCsv(
  csv: string,
  repo: string,
  filename: string,
): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
  form.append('repo', repo)

  const res = await fetch(`${API_URL}/api/files`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Upload failed (${res.status})`)
  }
  return res.json()
}
