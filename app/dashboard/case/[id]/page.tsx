'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Case, AuditEntry, Document as DocType } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { AuditTrail } from '@/components/audit-trail'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
  Pencil,
  Download,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'

export default function CaseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [documents, setDocuments] = useState<DocType[]>([])
  const [activeTab, setActiveTab] = useState<'audit' | 'documents'>('audit')
  const [isProcessing, setIsProcessing] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [revisionComment, setRevisionComment] = useState('')
  const [approvalType, setApprovalType] = useState<'pmf' | 'risk'>('pmf')
  const [approvalComment, setApprovalComment] = useState('')

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

  const handleDownload = (doc: DocType) => {
    const link = document.createElement('a')
    link.href = doc.dataUrl
    link.download = doc.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canApprove = user && (user.roles.includes('approver') || user.roles.includes('admin')) && caseData?.status === 'pending_review'

  // Get decline reason from audit entries
  const declineEntry = auditEntries.find(entry => entry.action === 'declined')
  const declineReasonText = declineEntry?.comment || 'No reason provided'
  const declinedBy = declineEntry?.userName
  const declinedAt = declineEntry?.timestamp

  // Check if user has already approved
  const hasUserApproved = (type: 'pmf' | 'risk') => {
    if (!caseData?.approvals || !user) return false
    if (type === 'pmf') {
      return caseData.approvals.pmfApproverId === user.id
    }
    return caseData.approvals.riskApproverId === user.id
  }

  // Check what approvals are still needed
  const getApprovalStatus = () => {
    const approvals = caseData?.approvals || {}
    return {
      pmfApproved: !!approvals.pmfApproverId,
      riskApproved: !!approvals.riskApproverId,
      pmfApprover: approvals.pmfApproverName,
      pmfApprovedAt: approvals.pmfApprovedAt,
      riskApprover: approvals.riskApproverName,
      riskApprovedAt: approvals.riskApprovedAt
    }
  }

  const approvalStatus = getApprovalStatus()

  const handleApprove = () => {
    if (!caseData || !user) return
    
    setIsProcessing(true)
    
    const currentApprovals = caseData.approvals || {}
    const newApprovals = { ...currentApprovals }
    
    // Add the current user's approval
    if (approvalType === 'pmf') {
      newApprovals.pmfApproverId = user.id
      newApprovals.pmfApproverName = user.name
      newApprovals.pmfApprovedAt = new Date().toISOString()
      newApprovals.pmfComment = approvalComment || undefined
    } else {
      newApprovals.riskApproverId = user.id
      newApprovals.riskApproverName = user.name
      newApprovals.riskApprovedAt = new Date().toISOString()
      newApprovals.riskComment = approvalComment || undefined
    }
    
    // Check if both approvals are now complete
    const bothApproved = !!newApprovals.pmfApproverId && !!newApprovals.riskApproverId
    
    const updatedCase: Case = {
      ...caseData,
      status: bothApproved ? 'approved' : 'pending_review',
      approvals: newApprovals,
      ...(bothApproved && { 
        approvedAt: new Date().toISOString(),
        nextReviewDate: nextReviewDate || undefined
      }),
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }
    
    storage.updateCase(updatedCase)
    
    const approvalLabel = approvalType === 'pmf' ? 'PMF' : 'Risk'
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId: caseData.id,
      userId: user.id,
      userName: user.name,
      action: 'approved',
      comment: bothApproved 
        ? `Final approval (${approvalLabel}). Case fully approved.${nextReviewDate ? ` Next review: ${nextReviewDate}` : ''}`
        : `${approvalLabel} approval granted.${approvalComment ? ` Comment: ${approvalComment}` : ''} Awaiting ${approvalType === 'pmf' ? 'Risk' : 'PMF'} approval.`,
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    if (bothApproved) {
      toast.success('Case fully approved!')
    } else {
      toast.success(`${approvalLabel} approval recorded. Awaiting ${approvalType === 'pmf' ? 'Risk' : 'PMF'} approval.`)
    }
    
    setApprovalDialogOpen(false)
    setIsProcessing(false)
    setApprovalComment('')
    loadData()
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

  const getStatusBadge = (status: Case['status']) => {
    switch (status) {
      case 'auto_approved':
        return <Badge className="bg-success text-success-foreground">Auto Approved</Badge>
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>
      case 'pending_review':
        return <Badge className="bg-warning text-warning-foreground">Pending Review</Badge>
      case 'revision_requested':
        return <Badge variant="destructive">Revision Requested</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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

  const canEdit = caseData.status === 'draft' || caseData.status === 'revision_requested'

  return (
    <div className="p-6 space-y-6">
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
              {getStatusBadge(caseData.status)}
              <Badge variant="outline">
                {caseData.approvalType === 'auto' ? 'Auto' : caseData.approvalType === 'standard' ? 'Standard' : 'Manual'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{caseData.parentCompanyName}</p>
              {caseData.status === 'pending_review' && (
                <div className="flex items-center gap-1 ml-2">
                  <Badge variant={approvalStatus.pmfApproved ? 'default' : 'secondary'} className="text-xs">
                    PMF: {approvalStatus.pmfApproved ? 'Approved' : 'Pending'}
                  </Badge>
                  <Badge variant={approvalStatus.riskApproved ? 'default' : 'secondary'} className="text-xs">
                    Risk: {approvalStatus.riskApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Approval Actions for Approvers */}
          {canApprove && (
            <>
              {/* Request Revision */}
              <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
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
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
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
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Dual Approval Required</DialogTitle>
                    <DialogDescription>
                      This case requires approval from both OD and Risk teams
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Case Summary */}
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

                    {/* Approval Status */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Approval Status</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg border ${approvalStatus.pmfApproved ? 'bg-success/10 border-success' : 'bg-muted/50 border-border'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {approvalStatus.pmfApproved ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">PMF Approval</span>
                          </div>
                          {approvalStatus.pmfApproved ? (
                            <p className="text-xs text-muted-foreground">
                              {approvalStatus.pmfApprover}<br />
                              {formatDate(approvalStatus.pmfApprovedAt)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Pending</p>
                          )}
                        </div>
                        <div className={`p-3 rounded-lg border ${approvalStatus.riskApproved ? 'bg-success/10 border-success' : 'bg-muted/50 border-border'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {approvalStatus.riskApproved ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">Risk Approval</span>
                          </div>
                          {approvalStatus.riskApproved ? (
                            <p className="text-xs text-muted-foreground">
                              {approvalStatus.riskApprover}<br />
                              {formatDate(approvalStatus.riskApprovedAt)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Pending</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Approval Type Selection */}
                    <div className="space-y-2">
                      <Label>Your Approval Type *</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={approvalType === 'pmf' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setApprovalType('pmf')}
                          disabled={approvalStatus.pmfApproved}
                          className="flex-1"
                        >
                          PMF Approval
                          {approvalStatus.pmfApproved && ' (Done)'}
                        </Button>
                        <Button
                          type="button"
                          variant={approvalType === 'risk' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setApprovalType('risk')}
                          disabled={approvalStatus.riskApproved}
                          className="flex-1"
                        >
                          Risk Approval
                          {approvalStatus.riskApproved && ' (Done)'}
                        </Button>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <Label>Approval Comment (Optional)</Label>
                      <Textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Add any comments for your approval..."
                        rows={2}
                      />
                    </div>

                    {/* Next Review Date - only show if this will be final approval */}
                    {((approvalType === 'pmf' && approvalStatus.riskApproved) || 
                      (approvalType === 'risk' && approvalStatus.pmfApproved)) && (
                      <div className="space-y-2">
                        <Label>Next Review Date (Optional)</Label>
                        <Input
                          type="date"
                          value={nextReviewDate}
                          onChange={(e) => setNextReviewDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground">This will be the final approval</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
                    <Button 
                      className="bg-success hover:bg-success/90 text-success-foreground" 
                      onClick={handleApprove} 
                      disabled={isProcessing || (approvalType === 'pmf' && approvalStatus.pmfApproved) || (approvalType === 'risk' && approvalStatus.riskApproved)}
                    >
                      {isProcessing ? 'Processing...' : `Submit ${approvalType === 'pmf' ? 'PMF' : 'Risk'} Approval`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Activity
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Case Activity</SheetTitle>
                <SheetDescription>
                  Audit trail and document uploads
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={activeTab === 'audit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('audit')}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Audit Trail
                  </Button>
                  <Button
                    variant={activeTab === 'documents' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('documents')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Documents ({documents.length})
                  </Button>
                </div>
                
                {activeTab === 'audit' ? (
                  <AuditTrail entries={auditEntries} />
                ) : (
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        No documents uploaded
                      </p>
                    ) : (
                      documents.map(doc => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded by {doc.uploadedBy}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {canEdit && (
            <Link href={`/dashboard/case/${caseData.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Case
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Decline Reason Alert */}
      {caseData.status === 'declined' && (
        <Alert variant="destructive" className="mb-6">
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
        <Alert variant="default" className="mb-6 border-warning bg-warning/10">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Merchant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Merchant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Parent Company</p>
                  <p className="font-medium">{caseData.parentCompanyName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subsidiary</p>
                  <p className="font-medium">{caseData.subsidiaryName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DBA</p>
                  <p className="font-medium">{caseData.dba}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MCC</p>
                  <p className="font-medium">{caseData.mcc}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">SF Account #</p>
                  <p className="font-mono">{caseData.salesforceAccountNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Salesforce Link</p>
                  {caseData.salesforceLink ? (
                    <a 
                      href={caseData.salesforceLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open in Salesforce
                    </a>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Business Type</p>
                  <p className="font-medium">{caseData.businessType || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Years in Business</p>
                  <p className="font-medium">{caseData.yearsInBusiness || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Processing Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Annual Volume</p>
                  <p className="font-mono">{formatCurrency(caseData.annualProcessingVolume)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Ticket</p>
                  <p className="font-mono">{formatCurrency(caseData.averageTicketSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ADD</p>
                  <p className="font-medium">{caseData.advanceDeliveryDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNP Volume</p>
                  <p className="font-medium">{caseData.cnpVolume}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refund Rate</p>
                  <p className="font-medium">{caseData.refundReturnRate || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Chargeback Rate</p>
                  <p className="font-medium">{caseData.chargebackRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reserves & Guarantees - Only show for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Reserves & Guarantees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rolling Reserve */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Rolling Reserve</p>
                  {caseData.reserves?.rollingReservePercentage && caseData.reserves.rollingReservePercentage > 0 ? (
                    <p className="font-medium">
                      {caseData.reserves.rollingReservePercentage}% for {caseData.reserves.rollingReserveDays} days
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">Not configured</p>
                  )}
                </div>
                
                {/* Minimum Reserve */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Minimum Reserve</p>
                  {caseData.reserves?.minimumReserveAmount && caseData.reserves.minimumReserveAmount > 0 ? (
                    <div>
                      <p className="font-mono font-medium">{formatCurrency(caseData.reserves.minimumReserveAmount)}</p>
                      {caseData.reserves.minimumReservePercentage && caseData.reserves.minimumReservePercentage > 0 && (
                        <p className="text-xs text-muted-foreground">Daily hold: {caseData.reserves.minimumReservePercentage}%</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Not configured</p>
                  )}
                </div>
                
                {/* Guarantees */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Guarantees</p>
                  {caseData.guarantees?.some(g => g.enabled) ? (
                    caseData.guarantees.filter(g => g.enabled).map(g => (
                      <div key={g.type} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium capitalize">{g.type === 'loc' ? 'Letter of Credit' : g.type} Guarantee</p>
                        {g.amount && (
                          <p className="text-sm text-muted-foreground">
                            Amount: {formatCurrency(g.amount)}
                          </p>
                        )}
                        {g.type === 'corporate' && (
                          <p className="text-sm text-success">Covers 100% of exposure</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic p-3 bg-muted/30 rounded-lg">No guarantees configured</p>
                  )}
                </div>
                
                {/* Total Coverage Summary */}
                {(() => {
                  const rollingReserveAmount = caseData.exposure.dailyVolume * 
                    ((caseData.reserves?.rollingReservePercentage || 0) / 100) * 
                    (caseData.reserves?.rollingReserveDays || 0)
                  const minimumReserveAmount = caseData.reserves?.minimumReserveAmount || 0
                  const bankGuaranteeAmount = caseData.guarantees?.find(g => g.type === 'bank' && g.enabled)?.amount || 0
                  const locAmount = caseData.guarantees?.find(g => g.type === 'loc' && g.enabled)?.amount || 0
                  const totalReserveAmount = rollingReserveAmount + minimumReserveAmount + bankGuaranteeAmount + locAmount
                  const coverageRatio = caseData.exposure.totalExposure > 0 
                    ? (totalReserveAmount / caseData.exposure.totalExposure) * 100 
                    : 0

                  return (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Exposure Coverage</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Reserve</p>
                          <p className="font-mono font-bold">{formatCurrency(totalReserveAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Coverage Ratio</p>
                          <p className={`font-mono font-bold ${coverageRatio >= 100 ? 'text-success' : coverageRatio >= 50 ? 'text-warning' : ''}`}>
                            {coverageRatio.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Description - Only show for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.description ? (
                  <p className="whitespace-pre-wrap">{caseData.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description provided</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Snapshot - Only show for manual (high exposure) cases */}
          {caseData.approvalType === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.snapshotImage ? (
                  <img
                    src={caseData.snapshotImage}
                    alt="Case snapshot"
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">No snapshot uploaded</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Exposure Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Exposure Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Volume</span>
                <span className="font-mono">{formatCurrency(caseData.exposure.dailyVolume)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Exposure</span>
                <span className="font-mono">{formatCurrency(caseData.exposure.baseExposure)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chargeback (5%)</span>
                <span className="font-mono">{formatCurrency(caseData.exposure.chargebackExposure)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Refund (1%)</span>
                <span className="font-mono">{formatCurrency(caseData.exposure.refundReturnExposure)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Exposure</span>
                <span className="font-mono">{formatCurrency(caseData.exposure.totalExposure)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(caseData.createdAt)}</p>
              </div>
              {caseData.submittedAt && (
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(caseData.submittedAt)}</p>
                </div>
              )}
              {caseData.approvedAt && (
                <div>
                  <p className="text-muted-foreground">Approved</p>
                  <p className="font-medium">{formatDate(caseData.approvedAt)}</p>
                </div>
              )}
              {caseData.nextReviewDate && caseData.approvalType !== 'auto' && (
                <div>
                  <p className="text-muted-foreground">Next Review</p>
                  <p className="font-medium">{formatDate(caseData.nextReviewDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
