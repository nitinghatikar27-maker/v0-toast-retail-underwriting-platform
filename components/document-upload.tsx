'use client'

import { useState, useRef } from 'react'
import { Document as DocType } from '@/lib/types'
import { storage, generateId } from '@/lib/storage'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Upload, FileText, Trash2, Download, File } from 'lucide-react'

interface DocumentUploadProps {
  caseId: string
  documents: DocType[]
  onDocumentAdded: () => void
  onDocumentDeleted: () => void
}

export function DocumentUpload({ 
  caseId, 
  documents, 
  onDocumentAdded, 
  onDocumentDeleted 
}: DocumentUploadProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setIsUploading(true)

    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader()
        reader.onload = () => {
          const doc: DocType = {
            id: generateId(),
            caseId,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedBy: user.name,
            uploadedAt: new Date().toISOString(),
            dataUrl: reader.result as string
          }
          storage.addDocument(doc)
          
          // Add audit entry
          storage.addAuditEntry({
            id: generateId(),
            caseId,
            userId: user.id,
            userName: user.name,
            action: 'document_uploaded',
            comment: `Uploaded document: ${file.name}`,
            timestamp: new Date().toISOString()
          })
        }
        reader.readAsDataURL(file)
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    // Small delay to allow state to update
    setTimeout(() => {
      setIsUploading(false)
      onDocumentAdded()
      toast.success('Document(s) uploaded successfully')
    }, 500)

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = (docId: string, docName: string) => {
    storage.deleteDocument(docId)
    onDocumentDeleted()
    toast.success(`${docName} deleted`)
  }

  const handleDownload = (doc: DocType) => {
    const link = document.createElement('a')
    link.href = doc.dataUrl
    link.download = doc.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('word') || type.includes('document')) return '📝'
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
      
      <Button
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload Documents'}
      </Button>

      <ScrollArea className="h-[300px]">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No documents uploaded
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg">{getFileIcon(doc.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
