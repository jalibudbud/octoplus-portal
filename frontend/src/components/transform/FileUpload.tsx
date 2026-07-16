import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { readHeader } from '@/lib/file-reader'
import type { Delimiter } from '@/lib/file-reader'

interface FileUploadProps {
  onFileSelected: (file: File, columns: string[], delimiter: Delimiter) => void
}

export function FileUpload({ onFileSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle')
  const [info, setInfo] = useState<{ name: string; columns: number; delimiter: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFile(file: File) {
    setStatus('reading')
    setErrorMsg(null)
    try {
      const { columns, delimiter } = await readHeader(file)
      setInfo({ name: file.name, columns: columns.length, delimiter })
      setStatus('done')
      onFileSelected(file, columns, delimiter)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to read file.')
      setStatus('error')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 border border-dashed border-border p-8 text-center cursor-pointer hover:bg-accent transition-colors"
      >
        <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground">
          Drop a CSV / TSV file here, or <span className="underline">browse</span>
        </p>
        <p className="text-[10px] text-muted-foreground">
          Only the header row is read — large files are safe to upload.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {status === 'reading' && (
        <p className="text-xs text-muted-foreground">Reading header…</p>
      )}

      {status === 'done' && info && (
        <div className="border border-border p-3 space-y-1">
          <p className="text-xs font-medium">{info.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {info.columns} columns detected · delimiter:{' '}
            <span className="font-mono">{info.delimiter === ';' ? 'semicolon (;)' : 'comma (,)'}</span>
          </p>
        </div>
      )}

      {status === 'error' && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  )
}
