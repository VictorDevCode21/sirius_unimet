'use client'

import { useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Download, FileSpreadsheet, GraduationCap, UploadCloud, X } from 'lucide-react'
import { CURRICULUM_CSV_HEADERS, CURRICULUM_CSV_MAX_BYTES, inspectCurriculumCsv } from '@/domain/curriculum/csv-importer'
import { cn } from '@/presentation/lib/utils'

export interface UploadedCsv {
  careerId: string
  fileName: string
  text: string
  records: number
}

interface CsvUploadProps {
  careers: { id: string; name: string }[]
  initialCareerId: string | null
  onUploaded?: (file: UploadedCsv | null) => void
}

const TEMPLATE = `${CURRICULUM_CSV_HEADERS.join(',')}\nFBTMM01,Matemática Básica,3,1,1,,,\nBPTMI01,Matemáticas I,3,2,1,,FBTMM01,\n`

function rejectionMessage(rejection: FileRejection) {
  const code = rejection.errors[0]?.code
  if (code === 'file-too-large') return 'El archivo supera 1 MB.'
  if (code === 'file-invalid-type') return 'Solo se aceptan archivos .csv.'
  if (code === 'too-many-files') return 'Sube un solo archivo.'
  return 'No se pudo leer el archivo.'
}

// Career selector and drop zone that reads a curriculum CSV and checks its header.
export function CsvUpload({ careers, initialCareerId, onUploaded }: CsvUploadProps) {
  const [careerId, setCareerId] = useState(initialCareerId ?? careers[0]?.id ?? '')
  const [file, setFile] = useState<UploadedCsv | null>(null)
  const [error, setError] = useState<string | null>(null)

  const select = (next: UploadedCsv | null) => {
    setFile(next)
    onUploaded?.(next)
  }

  const onDrop = async (accepted: File[], rejected: FileRejection[]) => {
    setError(null)
    select(null)
    if (rejected.length) return setError(rejectionMessage(rejected[0]))
    const [upload] = accepted
    if (!upload) return
    const text = await upload.text()
    const inspection = inspectCurriculumCsv(text)
    if (inspection.error) return setError(inspection.error)
    select({ careerId, fileName: upload.name, text, records: inspection.records })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    maxSize: CURRICULUM_CSV_MAX_BYTES,
  })

  const changeCareer = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCareerId(event.target.value)
    if (file) select({ ...file, careerId: event.target.value })
  }

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`

  return (
    <section className="surface card-pad reveal reveal-1 grid gap-5" aria-labelledby="csv-upload-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="csv-upload-title" className="text-lg font-bold">
            Subir pensum en CSV
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Columnas: <code className="break-all font-mono text-xs">{CURRICULUM_CSV_HEADERS.join(',')}</code>. Las prelaciones se separan con{' '}
            <code className="font-mono text-xs">|</code>.
          </p>
        </div>
        <a href={templateHref} download="plantilla-pensum.csv" className="secondary-button shrink-0">
          <Download aria-hidden="true" /> Plantilla
        </a>
      </div>

      <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold sm:max-w-sm">
        Carrera
        <span className="field">
          <GraduationCap aria-hidden="true" />
          <select className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0" value={careerId} onChange={changeCareer}>
            {careers.map((career) => (
              <option key={career.id} value={career.id}>
                {career.name}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div
        {...getRootProps({
          className: cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-border px-6 py-10 text-center transition',
            isDragActive && 'border-[var(--brand-sky)] bg-[var(--status-progress-bg)]',
          ),
        })}
      >
        <input {...getInputProps({ 'aria-label': 'Archivo CSV del pensum' })} />
        <UploadCloud className="h-8 w-8 text-[var(--brand-sky)]" aria-hidden="true" />
        <p className="font-semibold">{isDragActive ? 'Suelta el archivo aquí' : 'Arrastra el archivo CSV o haz clic para elegirlo'}</p>
        <p className="text-xs text-muted-foreground">Un archivo .csv de hasta 1 MB</p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {file && (
        <div role="status" className="flex items-center gap-3 rounded-[1.25rem] border border-border px-4 py-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-[var(--status-passed)]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {file.records} {file.records === 1 ? 'materia' : 'materias'} en el archivo
            </p>
          </div>
          <button type="button" className="icon-button" onClick={() => select(null)} aria-label="Quitar archivo">
            <X />
          </button>
        </div>
      )}
    </section>
  )
}
