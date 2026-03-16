'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Case, AuditEntry, Guarantee, Document as DocType } from '@/lib/types'
import { calculateExposure, formatCurrency } from '@/lib/exposure'
import { AuditTrail } from '@/components/audit-trail'
import { DocumentUpload } from '@/components/document-upload'
import { Chatter } from '@/components/chatter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  Calculator, 
  Shield, 
  FileText, 
  History, 
  Upload,
  ChevronDown,
  Send,
  ImageIcon,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageCircle,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function CaseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [documents, setDocuments] = useState<DocType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'chatter' | 'audit' | 'documents'>('chatter')
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(() => {
    const foundCase = storage.getCaseById(resolvedParams.id)
    if (foundCase) {
      setCaseData(foundCase)
    }
    setAuditEntries(storage.getAuditTrailForCase(resolvedParams.id))
    setDocuments(storage.getDocumentsForCase(resolvedParams.id))
  }, [resolvedParams.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateField = <K extends keyof Case>(field: K, value: Case[K]) => {
    if (!caseData) return
    
    // Check if field is locked
    if (caseData.lockedFields && !caseData.lockedFields.includes(field as string)) {
      // Field not locked, or no locked fields specified
    }
    
    const updated = { ...caseData, [field]: value, lastModifiedAt: new Date().toISOString() }
    
    // Recalculate exposure if processing fields change
    if (field === 'annualProcessingVolume' || field === 'advanceDeliveryDays') {
      const exposure = calculateExposure({
        annualProcessingVolume: field === 'annualProcessingVolume' ? value as number : caseData.annualProcessingVolume,
        advanceDeliveryDays: field === 'advanceDeliveryDays' ? value as number : caseData.advanceDeliveryDays
      })
      updated.exposure = exposure
    }
    
    setCaseData(updated)
  }

  const updateGuarantee = (type: Guarantee['type'], updates: Partial<Guarantee>) => {
    if (!caseData) return
    
    const guarantees = caseData.guarantees || []
    const existingIndex = guarantees.findIndex(g => g.type === type)
    
    if (existingIndex >= 0) {
      guarantees[existingIndex] = { ...guarantees[existingIndex], ...updates }
    } else {
      guarantees.push({ type, enabled: false, ...updates })
    }
    
    updateField('guarantees', guarantees)
  }

  const getGuarantee = (type: Guarantee['type']): Guarantee | undefined => {
    return caseData?.guarantees?.find(g => g.type === type)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      updateField('snapshotImage', reader.result as string)
      toast.success('Snapshot image uploaded')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!caseData || !user) return
    
    caseData.lastModifiedBy = user.id
    caseData.lastModifiedAt = new Date().toISOString()
    storage.updateCase(caseData)
    
    toast.success('Case saved')
    loadData()
  }

  const handleSubmit = () => {
    if (!caseData || !user) return
    
    setIsSubmitting(true)
    
    // For exposure > $200K with PMF pre-approval, go to Risk approval only
    const hasPmfApproval = !!caseData.approvals?.pmfApproverId
    
    // Find the appropriate approver based on exposure
    const approverId = storage.getApproverForExposure(caseData.exposure.totalExposure)
    
    // Manual form submission always goes to Risk approval (PMF already approved)
    const newStatus: Case['status'] = 'pending_risk_approval'
    const auditComment = 'Manual form completed. Case submitted for Risk approval.'
    const toastMessage = 'Case submitted for Risk approval!'
    
    const updatedCase: Case = {
      ...caseData,
      status: newStatus,
      assignedApproverId: approverId === 'auto' ? undefined : approverId,
      submittedAt: new Date().toISOString(),
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    // Add audit entry
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: caseData.id,
      userId: user.id,
      userName: user.name,
      action: 'submitted',
      comment: auditComment,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success(toastMessage)
    router.push('/dashboard')
    setIsSubmitting(false)
  }

  const handleApprove = () => {
    if (!caseData || !user) return
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...caseData,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      nextReviewDate: nextReviewDate || undefined,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: caseData.id,
      userId: user.id,
      userName: user.name,
      action: 'approved',
      comment: nextReviewDate ? `Case approved. Next review: ${nextReviewDate}` : 'Case approved',
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Case approved successfully')
    setApprovalDialogOpen(false)
    setIsProcessing(false)
    router.push('/dashboard')
  }

  const handleDecline = () => {
    if (!caseData || !user || !declineReason.trim()) return
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...caseData,
      status: 'declined',
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: caseData.id,
      userId: user.id,
      userName: user.name,
      action: 'declined',
      comment: declineReason,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Case declined')
    setDeclineDialogOpen(false)
    setIsProcessing(false)
    router.push('/dashboard')
  }

  const handleRequestRevision = () => {
    if (!caseData || !user || !revisionComment.trim()) return
    
    setIsProcessing(true)
    
    const updatedCase: Case = {
      ...caseData,
      status: 'revision_requested',
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: caseData.id,
      userId: user.id,
      userName: user.name,
      action: 'revision_requested',
      comment: revisionComment,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Revision requested')
    setRevisionDialogOpen(false)
    setIsProcessing(false)
    router.push('/dashboard')
  }

  const canApprove = user && (user.roles.includes('approver') || user.roles.includes('admin')) && caseData?.status === 'pending_review'

  // Get decline reason from audit entries
  const declineEntry = auditEntries.find(entry => entry.action === 'declined')
  const declineReasonText = declineEntry?.comment || 'No reason provided'
  const declinedBy = declineEntry?.userName
  const declinedAt = declineEntry?.timestamp

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Case not found</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const isEditable = caseData.status === 'draft' || caseData.status === 'revision_requested'

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {caseData.caseNumber}
                  </h1>
                  <Badge variant={caseData.status === 'draft' ? 'secondary' : 'default'}>
                    {caseData.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{caseData.parentCompanyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditable && (
                <>
                  <Button variant="outline" onClick={handleSave}>
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </>
              )}

              {/* Approval Actions for Approvers */}
              {canApprove && (
                <div className="flex items-center gap-2">
                  {/* Request Revision */}
                  <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Request Revision
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                          Specify what changes are needed before approval
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Revision Comments *</Label>
                          <Textarea
                            value={revisionComment}
                            onChange={(e) => setRevisionComment(e.target.value)}
                            placeholder="Describe the required changes..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRequestRevision} disabled={isProcessing || !revisionComment.trim()}>
                          {isProcessing ? 'Processing...' : 'Request Revision'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Decline */}
                  <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Decline Case</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for declining this case
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Decline Reason *</Label>
                          <Textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Enter the reason for declining..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDecline} disabled={isProcessing || !declineReason.trim()}>
                          {isProcessing ? 'Processing...' : 'Decline Case'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Approve */}
                  <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-success hover:bg-success/90 text-success-foreground">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Case</DialogTitle>
                        <DialogDescription>
                          Review the case details and set a next review date
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Case:</span>
                            <span className="font-medium">{caseData?.caseNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Company:</span>
                            <span className="font-medium">{caseData?.parentCompanyName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Exposure:</span>
                            <span className="font-mono font-bold">{formatCurrency(caseData?.exposure.totalExposure || 0)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Next Review Date (Optional)</Label>
                          <Input
                            type="date"
                            value={nextReviewDate}
                            onChange={(e) => setNextReviewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleApprove} disabled={isProcessing}>
                          {isProcessing ? 'Processing...' : 'Approve Case'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>

          {/* Decline Reason Alert */}
          {caseData.status === 'declined' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Case Declined</AlertTitle>
              <AlertDescription>
                <p className="mt-1">{declineReasonText}</p>
                {declinedBy && declinedAt && (
                  <p className="mt-2 text-xs opacity-80">
                    Declined by {declinedBy} on {formatDate(declinedAt)}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Revision Requested Alert */}
          {caseData.status === 'revision_requested' && (
            <Alert variant="default" className="border-warning bg-warning/10">
              <RotateCcw className="h-4 w-4 text-warning" />
              <AlertTitle>Revision Requested</AlertTitle>
              <AlertDescription>
                {(() => {
                  const revisionEntry = auditEntries.find(entry => entry.action === 'revision_requested')
                  return (
                    <>
                      <p className="mt-1">{revisionEntry?.comment || 'Revisions requested'}</p>
                      {revisionEntry?.userName && revisionEntry?.timestamp && (
                        <p className="mt-2 text-xs opacity-80">
                          Requested by {revisionEntry.userName} on {formatDate(revisionEntry.timestamp)}
                        </p>
                      )}
                    </>
                  )
                })()}
              </AlertDescription>
            </Alert>
          )}

          {/* Section A - Merchant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Section A - Merchant Information
              </CardTitle>
              <CardDescription>Basic merchant details (pre-filled from intake)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentCompanyName">Parent Company Name</Label>
                  <Input
                    id="parentCompanyName"
                    value={caseData.parentCompanyName}
                    onChange={(e) => updateField('parentCompanyName', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subsidiaryName">Subsidiary Name</Label>
                  <Input
                    id="subsidiaryName"
                    value={caseData.subsidiaryName}
                    onChange={(e) => updateField('subsidiaryName', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dba">DBA (Doing Business As)</Label>
                  <Input
                    id="dba"
                    value={caseData.dba}
                    onChange={(e) => updateField('dba', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcc">MCC (Merchant Category Code)</Label>
                  <Input
                    id="mcc"
                    value={caseData.mcc}
                    onChange={(e) => updateField('mcc', e.target.value)}
                    placeholder="e.g., 5812"
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesforceAccountNumber">Salesforce Account Number</Label>
                  <Input
                    id="salesforceAccountNumber"
                    value={caseData.salesforceAccountNumber}
                    onChange={(e) => updateField('salesforceAccountNumber', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesforceLink">Salesforce Link *</Label>
                  <Input
                    id="salesforceLink"
                    type="url"
                    value={caseData.salesforceLink || ''}
                    onChange={(e) => updateField('salesforceLink', e.target.value)}
                    placeholder="https://toast.lightning.force.com/..."
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aeName">AE Name *</Label>
                  <Input
                    id="aeName"
                    value={caseData.aeName || ''}
                    onChange={(e) => updateField('aeName', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brickAndMortar">Brick & Mortar *</Label>
                  <Select
                    value={caseData.brickAndMortar || ''}
                    onValueChange={(value: string) => updateField('brickAndMortar', value)}
                    disabled={!isEditable}
                  >
                    <SelectTrigger id="brickAndMortar">
                      <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Website URL - Only for manual (high exposure) cases */}
                {caseData.approvalType === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={caseData.websiteUrl || ''}
                      onChange={(e) => updateField('websiteUrl', e.target.value)}
                      placeholder="https://example.com"
                      disabled={!isEditable}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section B - Processing Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Section B - Processing Profile
              </CardTitle>
              <CardDescription>Transaction and processing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualProcessingVolume">Annual Processing Volume (USD)</Label>
                  <Input
                    id="annualProcessingVolume"
                    type="number"
                    min="0"
                    value={caseData.annualProcessingVolume}
                    onChange={(e) => updateField('annualProcessingVolume', parseFloat(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageTicketSize">Average Ticket Size (USD)</Label>
                  <Input
                    id="averageTicketSize"
                    type="number"
                    min="0"
                    step="0.01"
                    value={caseData.averageTicketSize}
                    onChange={(e) => updateField('averageTicketSize', parseFloat(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpVolume">CNP Volume (%)</Label>
                  <Input
                    id="cnpVolume"
                    type="number"
                    min="0"
                    max="100"
                    value={caseData.cnpVolume}
                    onChange={(e) => updateField('cnpVolume', parseFloat(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advanceDeliveryDays">Advance Delivery Days (ADD)</Label>
                  <Input
                    id="advanceDeliveryDays"
                    type="number"
                    min="0"
                    value={caseData.advanceDeliveryDays}
                    onChange={(e) => updateField('advanceDeliveryDays', parseFloat(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
{/* Refund/Return Rate and Chargeback Rate - Only for manual (high exposure) cases */}
                {caseData.approvalType === 'manual' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="refundReturnRate">Refund/Return Rate (%)</Label>
                      <Input
                        id="refundReturnRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={caseData.refundReturnRate || ''}
                        onChange={(e) => updateField('refundReturnRate', parseFloat(e.target.value) || 0)}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chargebackRate">Chargeback Rate (%)</Label>
                      <Input
                        id="chargebackRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={caseData.chargebackRate || ''}
                        onChange={(e) => updateField('chargebackRate', parseFloat(e.target.value) || 0)}
                        disabled={!isEditable}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Description Section - Only for standard (low exposure) cases */}
          {caseData.approvalType === 'standard' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Business Description
                </CardTitle>
                <CardDescription>
                  Provide a brief description of the business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Description *</Label>
                  <Textarea
                    id="businessDescription"
                    value={caseData.businessDescription || ''}
                    onChange={(e) => {
                      updateField('businessDescription', e.target.value)
                      // Auto-resize the textarea
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    placeholder="Describe the nature of the business, products/services offered, target customers, etc."
                    className="min-h-[100px] resize-none overflow-hidden"
                    style={{ height: 'auto' }}
                    disabled={!isEditable}
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps approvers understand the business context
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exposure Calculator - Only for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Section C - Exposure Calculator
                </CardTitle>
                <CardDescription>
                  Calculated exposure based on processing profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.exposure && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Daily Volume</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.exposure.dailyVolume)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Refund Exposure</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.exposure.refundExposure)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Chargeback Exposure</p>
                      <p className="text-lg font-semibold">{formatCurrency(caseData.exposure.chargebackExposure)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary">
                      <p className="text-sm text-primary">Total Exposure</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(caseData.exposure.totalExposure)}</p>
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Calculation Formula:</p>
                  <p>Daily Volume = Annual Volume / 365</p>
                  <p>Refund Exposure = Daily Volume × ADD × (CNP% / 100)</p>
                  <p>Chargeback Exposure = Daily Volume × 180 × (CNP% / 100)</p>
                  <p>Total Exposure = Refund Exposure + Chargeback Exposure</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section D - Reserves & Guarantees - Only for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Section D - Reserves & Guarantees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rolling Reserve */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <span className="font-medium">Rolling Reserve Calculator</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reserve Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={caseData.reserves?.rollingReservePercentage || ''}
                        onChange={(e) => updateField('reserves', {
                          ...caseData.reserves,
                          rollingReservePercentage: parseFloat(e.target.value) || 0
                        })}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reserve Days</Label>
                      <Input
                        type="number"
                        min="0"
                        value={caseData.reserves?.rollingReserveDays || ''}
                        onChange={(e) => updateField('reserves', {
                          ...caseData.reserves,
                          rollingReserveDays: parseInt(e.target.value) || 0
                        })}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                  
                  {/* Rolling Reserve Total Calculation */}
                  {(caseData.reserves?.rollingReservePercentage || 0) > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Total Rolling Reserve Amount</p>
                          <p className="text-xs text-muted-foreground">
                            Daily Volume x Reserve % x Reserve Days = {formatCurrency(caseData.exposure.dailyVolume)} x {caseData.reserves?.rollingReservePercentage || 0}% x {caseData.reserves?.rollingReserveDays || 0} days
                          </p>
                        </div>
                        <p className="text-lg font-mono font-bold">
                          {formatCurrency(
                            caseData.exposure.dailyVolume * 
                            ((caseData.reserves?.rollingReservePercentage || 0) / 100) * 
                            (caseData.reserves?.rollingReserveDays || 0)
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Minimum Reserve */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <span className="font-medium">Minimum Reserve Calculator</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Daily Hold Percentage (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={caseData.reserves?.minimumReservePercentage || ''}
                        onChange={(e) => updateField('reserves', {
                          ...caseData.reserves,
                          minimumReservePercentage: parseFloat(e.target.value) || 0
                        })}
                        disabled={!isEditable}
                      />
                      <p className="text-xs text-muted-foreground">Percentage of daily transactions held until target is reached</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={caseData.reserves?.minimumReserveAmount || ''}
                        onChange={(e) => updateField('reserves', {
                          ...caseData.reserves,
                          minimumReserveAmount: parseFloat(e.target.value) || 0
                        })}
                        disabled={!isEditable}
                      />
                      <p className="text-xs text-muted-foreground">Hold daily transactions until this amount is reached</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Total Exposure Coverage Summary */}
              {(() => {
                const rollingReserveAmount = caseData.exposure.dailyVolume * 
                  ((caseData.reserves?.rollingReservePercentage || 0) / 100) * 
                  (caseData.reserves?.rollingReserveDays || 0)
                const minimumReserveAmount = caseData.reserves?.minimumReserveAmount || 0
                const bankGuaranteeAmount = getGuarantee('bank')?.enabled ? (getGuarantee('bank')?.amount || 0) : 0
                const locAmount = getGuarantee('loc')?.enabled ? (getGuarantee('loc')?.amount || 0) : 0
                // Corporate guarantee equals total exposure when enabled
                const corporateGuaranteeAmount = getGuarantee('corporate')?.enabled ? caseData.exposure.totalExposure : 0
                const totalReserveAmount = corporateGuaranteeAmount > 0 
                  ? caseData.exposure.totalExposure  // If corporate guarantee is enabled, total reserve equals total exposure
                  : rollingReserveAmount + minimumReserveAmount + bankGuaranteeAmount + locAmount
                const coverageRatio = caseData.exposure.totalExposure > 0 
                  ? (totalReserveAmount / caseData.exposure.totalExposure) * 100 
                  : 0

                return (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-4">
                    <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Total Exposure Coverage</p>
                    
                    {/* Breakdown */}
                    <div className="bg-card rounded-lg p-3 border space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Reserve Breakdown</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {corporateGuaranteeAmount > 0 ? (
                          <div className="flex justify-between col-span-2">
                            <span className="text-success font-medium">Corporate Guarantee (100% Coverage):</span>
                            <span className="font-mono text-success font-bold">{formatCurrency(corporateGuaranteeAmount)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rolling Reserve:</span>
                              <span className="font-mono">{formatCurrency(rollingReserveAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Minimum Reserve:</span>
                              <span className="font-mono">{formatCurrency(minimumReserveAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bank Guarantee:</span>
                              <span className="font-mono">{formatCurrency(bankGuaranteeAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Letter of Credit:</span>
                              <span className="font-mono">{formatCurrency(locAmount)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Reserve Amount */}
                      <div className="bg-card rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground">Total Reserve Amount</p>
                        <p className="text-lg font-mono font-bold">
                          {formatCurrency(totalReserveAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Rolling + Min + Bank + LOC</p>
                      </div>
                      
                      {/* Total Exposure */}
                      <div className="bg-card rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground">Total Exposure</p>
                        <p className="text-lg font-mono font-bold">
                          {formatCurrency(caseData.exposure.totalExposure)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">From Section C</p>
                      </div>
                      
                      {/* Coverage Ratio */}
                      <div className={`rounded-lg p-3 border ${coverageRatio >= 100 ? 'bg-success/10 border-success/30' : coverageRatio >= 50 ? 'bg-warning/10 border-warning/30' : 'bg-card'}`}>
                        <p className="text-xs text-muted-foreground">Coverage Ratio</p>
                        <p className={`text-lg font-mono font-bold ${coverageRatio >= 100 ? 'text-success' : coverageRatio >= 50 ? 'text-warning' : ''}`}>
                          {coverageRatio.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Total Reserve / Exposure</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {/* Corporate Guarantee */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Corporate Guarantee</p>
                    <p className="text-sm text-muted-foreground">Covers 100% of exposure when enabled</p>
                  </div>
                  <Select
                    value={getGuarantee('corporate')?.enabled ? 'yes' : 'no'}
                    onValueChange={(v) => updateGuarantee('corporate', { enabled: v === 'yes' })}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {getGuarantee('corporate')?.enabled && (
                  <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success">
                    Corporate guarantee covers 100% of exposure
                  </div>
                )}
              </div>

              <Separator />

              {/* Bank Guarantee */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bank Guarantee</p>
                  </div>
                  <Select
                    value={getGuarantee('bank')?.enabled ? 'yes' : 'no'}
                    onValueChange={(v) => updateGuarantee('bank', { enabled: v === 'yes' })}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {getGuarantee('bank')?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={getGuarantee('bank')?.amount || ''}
                        onChange={(e) => updateGuarantee('bank', { amount: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={getGuarantee('bank')?.expiryDate || ''}
                        onChange={(e) => updateGuarantee('bank', { expiryDate: e.target.value })}
                        disabled={!isEditable || getGuarantee('bank')?.autoRenewal}
                        className={getGuarantee('bank')?.autoRenewal ? 'opacity-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto Renewal</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={getGuarantee('bank')?.autoRenewal || false}
                          onCheckedChange={(checked) => updateGuarantee('bank', { autoRenewal: checked })}
                          disabled={!isEditable}
                        />
                        <span className="text-sm">{getGuarantee('bank')?.autoRenewal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Letter of Credit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Letter of Credit (LOC)</p>
                  </div>
                  <Select
                    value={getGuarantee('loc')?.enabled ? 'yes' : 'no'}
                    onValueChange={(v) => updateGuarantee('loc', { enabled: v === 'yes' })}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {getGuarantee('loc')?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={getGuarantee('loc')?.amount || ''}
                        onChange={(e) => updateGuarantee('loc', { amount: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={getGuarantee('loc')?.expiryDate || ''}
                        onChange={(e) => updateGuarantee('loc', { expiryDate: e.target.value })}
                        disabled={!isEditable || getGuarantee('loc')?.autoRenewal}
                        className={getGuarantee('loc')?.autoRenewal ? 'opacity-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto Renewal</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={getGuarantee('loc')?.autoRenewal || false}
                          onCheckedChange={(checked) => updateGuarantee('loc', { autoRenewal: checked })}
                          disabled={!isEditable}
                        />
                        <span className="text-sm">{getGuarantee('loc')?.autoRenewal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Section E - Case Description & Review - Only for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Section E - Case Description & Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Next Review Date */}
              <div className="space-y-2">
                <Label htmlFor="nextReviewDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next Review Date
                </Label>
                <Input
                  id="nextReviewDate"
                  type="date"
                  value={caseData.nextReviewDate ? caseData.nextReviewDate.split('T')[0] : ''}
                  onChange={(e) => updateField('nextReviewDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  disabled={!isEditable}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">Set the date for the next case review</p>
              </div>

              <Separator />
              {/* Snapshot */}
              <div className="space-y-2">
                <Label>Snapshot</Label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {caseData.snapshotImage ? (
                  <div className="relative">
                    <img
                      src={caseData.snapshotImage}
                      alt="Snapshot"
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                    {isEditable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        Replace Image
                      </Button>
                    )}
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${isEditable ? 'cursor-pointer hover:border-primary' : ''}`}
                    onClick={() => isEditable && imageInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isEditable ? 'Click to upload a snapshot image' : 'No snapshot uploaded'}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={caseData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter case description, notes, and analysis..."
                  className="min-h-[200px] resize-y"
                  disabled={!isEditable}
                />
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Right Side Chatter Panel */}
      <div className="w-[400px] border-l bg-card flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'chatter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('chatter')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chatter
            </Button>
            <Button
              variant={activeTab === 'audit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('audit')}
            >
              <History className="h-4 w-4 mr-2" />
              Audit
            </Button>
            <Button
              variant={activeTab === 'documents' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('documents')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Docs ({documents.length})
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chatter' ? (
            <Chatter caseId={caseData.id} caseName={caseData.caseNumber} />
          ) : activeTab === 'audit' ? (
            <div className="p-4 overflow-auto h-full">
              <AuditTrail entries={auditEntries} />
            </div>
          ) : (
            <div className="p-4 overflow-auto h-full">
              <DocumentUpload
                caseId={caseData.id}
                documents={documents}
                onDocumentAdded={loadData}
                onDocumentDeleted={loadData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
