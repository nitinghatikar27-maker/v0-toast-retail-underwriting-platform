'use client'

import { AuditEntry } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  FileEdit, 
  Upload, 
  Plus, 
  Send, 
  RotateCcw 
} from 'lucide-react'

interface AuditTrailProps {
  entries: AuditEntry[]
}

export function AuditTrail({ entries }: AuditTrailProps) {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4" />
      case 'submitted':
        return <Send className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'declined':
        return <XCircle className="h-4 w-4" />
      case 'revision_requested':
        return <RotateCcw className="h-4 w-4" />
      case 'updated':
        return <FileEdit className="h-4 w-4" />
      case 'document_uploaded':
        return <Upload className="h-4 w-4" />
      default:
        return <FileEdit className="h-4 w-4" />
    }
  }

  const getActionColor = (action: AuditEntry['action']) => {
    switch (action) {
      case 'approved':
        return 'bg-success text-success-foreground'
      case 'declined':
        return 'bg-destructive text-destructive-foreground'
      case 'revision_requested':
        return 'bg-warning text-warning-foreground'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const getActionLabel = (action: AuditEntry['action']) => {
    switch (action) {
      case 'created':
        return 'Created'
      case 'submitted':
        return 'Submitted'
      case 'approved':
        return 'Approved'
      case 'declined':
        return 'Declined'
      case 'revision_requested':
        return 'Revision Requested'
      case 'updated':
        return 'Updated'
      case 'document_uploaded':
        return 'Document Uploaded'
      default:
        return action
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activity yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {sortedEntries.map((entry, index) => (
          <div key={entry.id} className="relative pl-6">
            {index !== sortedEntries.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
            )}
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              {getActionIcon(entry.action)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getActionColor(entry.action)}>
                  {getActionLabel(entry.action)}
                </Badge>
                <span className="text-sm font-medium">{entry.userName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.timestamp)}
              </p>
              {entry.comment && (
                <p className="text-sm text-muted-foreground mt-1">
                  {entry.comment}
                </p>
              )}
              {entry.fieldsModified && entry.fieldsModified.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Modified: {entry.fieldsModified.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
