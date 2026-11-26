'use client'

import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { previewCurriculumImport, type CurriculumPreview } from '@/control/controllers/curriculum.controller'
import { CsvPreview } from '@/presentation/portals/admin/curriculum/csv-preview'
import { CsvUpload, type UploadedCsv } from '@/presentation/portals/admin/curriculum/csv-upload'

interface CsvImportProps {
  careers: { id: string; name: string }[]
  initialCareerId: string | null
}

// Curriculum import flow: upload a file, then review its preview and errors.
export function CsvImport({ careers, initialCareerId }: CsvImportProps) {
  const [preview, setPreview] = useState<CurriculumPreview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const review = async (file: UploadedCsv | null) => {
    setPreview(null)
    setMessage(null)
    if (!file) return
    setPending(true)
    try {
      const result = await previewCurriculumImport({ careerId: file.careerId, text: file.text })
      setPreview(result.preview)
      setMessage(result.preview ? null : result.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <CsvUpload careers={careers} initialCareerId={initialCareerId} onUploaded={review} />
      {pending && (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Revisando el archivo…
        </p>
      )}
      {message && (
        <p role="alert" className="mt-5 text-sm font-semibold text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      {preview && <CsvPreview preview={preview} />}
    </>
  )
}
