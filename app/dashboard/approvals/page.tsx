'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Case, AuditEntry } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  ClipboardList,
  Clock
} from 'lucide-react'
import Link from 'next/link'

type DialogType = 'approve' | 'decline' | 'revision' | null

export default function ApprovalsPage() {
  const router = useRouter()
  const { user, isApprover, isAdmin } = useAuth()
  const [pendingCases, setPendingCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const [comment, setComment] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [revisionFields, setRevisionFields] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadPendingCases()
  }, [user])

  const loadPendingCases = () => {
    if (!user) return
    
    let cases: Case[]
    if (isAdmin) {
      // Admin sees all pending cases
      cases = storage.getCases().filter(c => 
        c.status === 'pending_review' || c.status === 'revision_requested'
      )
    } else if (isApprover) {
      // Approvers see only cases assigned to them
      cases = storage.getCasesForApprover(user.id)
    } else {
      cases = []
    }
    
    setPendingCases(cases)
  }

  const openDialog = (caseData: Case, type: DialogType) => {
    setSelectedCase(caseData)
    setDialogType(type)
    setComment('')
    setNextReviewDate('')
    setRevisionFields([])
  }

  const closeDialog = () => {
    setSelectedCase(null)
    setDialogType(null)
    setComment('')
    setNextReviewDate('')
    setRevisionFields([])
  }

  const handleApprove = () => {
    if (!selectedCase || !user) return
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...selectedCase,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      nextReviewDate: nextReviewDate || undefined,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: selectedCase.id,
      userId: user.id,
      userName: user.name,
      action: 'approved',
      comment: comment || 'Case approved',
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Case approved successfully')
    closeDialog()
    loadPendingCases()
    setIsProcessing(false)
  }

  const handleDecline = () => {
    if (!selectedCase || !user || !comment.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...selectedCase,
      status: 'declined',
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: selectedCase.id,
      userId: user.id,
      userName: user.name,
      action: 'declined',
      comment,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Case declined')
    closeDialog()
    loadPendingCases()
    setIsProcessing(false)
  }

  const handleRequestRevision = () => {
    if (!selectedCase || !user || !comment.trim()) {
      toast.error('Please provide revision instructions')
      return
    }
    
    if (revisionFields.length === 0) {
      toast.error('Please select at least one field to unlock for revision')
      return
    }
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...selectedCase,
      status: 'revision_requested',
      lockedFields: revisionFields,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: selectedCase.id,
      userId: user.id,
      userName: user.name,
      action: 'revision_requested',
      comment,
      fieldsModified: revisionFields,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Revision requested')
    closeDialog()
    loadPendingCases()
    setIsProcessing(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleRevisionField = (field: string) => {
    setRevisionFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const availableFields = [
    { value: 'parentCompanyName', label: 'Parent Company Name' },
    { value: 'subsidiaryName', label: 'Subsidiary Name' },
    { value: 'annualProcessingVolume', label: 'Annual Processing Volume' },
    { value: 'averageTicketSize', label: 'Average Ticket Size' },
    { value: 'cnpVolume', label: 'CNP Volume' },
    { value: 'advanceDeliveryDays', label: 'Advance Delivery Days' },
    { value: 'reserves', label: 'Reserves' },
    { value: 'guarantees', label: 'Guarantees' },
    { value: 'description', label: 'Description' }
  ]

  if (!isApprover && !isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You do not have approver permissions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Approvals</h1>
        <p className="text-muted-foreground">Review and approve pending cases</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingCases.filter(c => c.status === 'pending_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revision Requested</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingCases.filter(c => c.status === 'revision_requested').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Queue</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCases.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Cases</CardTitle>
          <CardDescription>Cases awaiting your review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">No pending cases</p>
              <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Subsidiary</TableHead>
                    <TableHead className="text-right">Total Exposure</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCases.map(caseItem => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
                      <TableCell className="font-medium">{caseItem.parentCompanyName}</TableCell>
                      <TableCell>{caseItem.subsidiaryName || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(caseItem.exposure.totalExposure)}
                      </TableCell>
                      <TableCell>{formatDate(caseItem.submittedAt)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={caseItem.status === 'pending_review' ? 'default' : 'secondary'}
                          className={caseItem.status === 'revision_requested' ? 'bg-warning text-warning-foreground' : ''}
                        >
                          {caseItem.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/case/${caseItem.id}`}>
                            <Button variant="ghost" size="sm" title="View full case form">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-success hover:text-success"
                            onClick={() => openDialog(caseItem, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDialog(caseItem, 'revision')}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDialog(caseItem, 'decline')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={dialogType === 'approve'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Case</DialogTitle>
            <DialogDescription>
              Approve {selectedCase?.caseNumber} - {selectedCase?.parentCompanyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Exposure</p>
              <p className="text-2xl font-mono font-bold">
                {formatCurrency(selectedCase?.exposure.totalExposure || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextReviewDate">Next Review Date (optional)</Label>
              <Input
                id="nextReviewDate"
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approveComment">Comment (optional)</Label>
              <Textarea
                id="approveComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any approval notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Approve Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={dialogType === 'decline'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Case</DialogTitle>
            <DialogDescription>
              Decline {selectedCase?.caseNumber} - {selectedCase?.parentCompanyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="declineReason">Reason for Declining *</Label>
              <Textarea
                id="declineReason"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide a reason for declining this case..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDecline}
              disabled={isProcessing || !comment.trim()}
            >
              {isProcessing ? 'Processing...' : 'Decline Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={dialogType === 'revision'} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Request changes to {selectedCase?.caseNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fields to Unlock for Revision *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableFields.map(field => (
                  <div key={field.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.value}
                      checked={revisionFields.includes(field.value)}
                      onCheckedChange={() => toggleRevisionField(field.value)}
                    />
                    <label
                      htmlFor={field.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionInstructions">Revision Instructions *</Label>
              <Textarea
                id="revisionInstructions"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe what changes are needed..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleRequestRevision}
              disabled={isProcessing || !comment.trim() || revisionFields.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Request Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
