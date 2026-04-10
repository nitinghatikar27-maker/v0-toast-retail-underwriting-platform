'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Exposure, Case, AuditEntry, ChatMessage } from '@/lib/types'
import { calculateExposure, getExposureDecision, formatCurrency } from '@/lib/exposure'
import { ExposureCalculator, DecisionBanner } from '@/components/exposure-calculator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calculator, CheckCircle, FileText, MessageCircle, Save, XCircle } from 'lucide-react'
import { MCCSelector } from '@/components/mcc-selector'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface FormData {
  parentCompanyName: string
  subsidiaryName: string
  dba: string
  mcc: string
  salesforceAccountNumber: string
  salesforceLink: string
  aeName: string
  annualProcessingVolume: string
  advanceDeliveryDays: string
  averageTicketSize: string
  cnpVolume: string
  brickAndMortar: string
  businessDescription: string
}

export default function SubmitRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    parentCompanyName: '',
    subsidiaryName: '',
    dba: '',
    mcc: '',
    salesforceAccountNumber: '',
    salesforceLink: '',
    aeName: '',
    annualProcessingVolume: '',
    advanceDeliveryDays: '',
    averageTicketSize: '',
    cnpVolume: '',
    brickAndMortar: '',
    businessDescription: ''
  })
  const [exposure, setExposure] = useState<Exposure | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialNotes, setInitialNotes] = useState('')
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const AUTOSAVE_KEY = 'toast_submit_request_draft'

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        setFormData({
          parentCompanyName: '',
          subsidiaryName: '',
          dba: '',
          mcc: '',
          salesforceAccountNumber: '',
          salesforceLink: '',
          aeName: '',
          annualProcessingVolume: '',
          advanceDeliveryDays: '',
          averageTicketSize: '',
          cnpVolume: '',
          brickAndMortar: '',
          businessDescription: '',
          ...parsed.formData
        })
        setInitialNotes(parsed.initialNotes || '')
        setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null)
      } catch {
        // Invalid saved data, ignore
      }
    }
  }, [])

  // Auto-save form data when it changes
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const hasData = Object.values(formData).some(v => v.trim() !== '') || initialNotes.trim() !== ''
      if (hasData) {
        const draftData = {
          formData,
          initialNotes,
          savedAt: new Date().toISOString()
        }
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData))
        setLastSaved(new Date())
      }
    }, 1000) // Auto-save 1 second after typing stops

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, initialNotes])

  // Clear draft when form is submitted
  const clearDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  const isFormComplete = useCallback(() => {
    return (
      (formData.parentCompanyName || '').trim() !== '' &&
      (formData.subsidiaryName || '').trim() !== '' &&
      (formData.dba || '').trim() !== '' &&
      (formData.mcc || '').trim() !== '' &&
      (formData.salesforceAccountNumber || '').trim() !== '' &&
      (formData.salesforceLink || '').trim() !== '' &&
      (formData.aeName || '').trim() !== '' &&
      (formData.annualProcessingVolume || '') !== '' &&
      (formData.advanceDeliveryDays || '') !== '' &&
      (formData.averageTicketSize || '') !== '' &&
      (formData.cnpVolume || '') !== '' &&
      (formData.brickAndMortar || '') !== '' &&
      (formData.businessDescription || '').trim() !== '' &&
      parseFloat(formData.annualProcessingVolume || '0') > 0 &&
      parseFloat(formData.advanceDeliveryDays || '0') >= 0 &&
      parseFloat(formData.averageTicketSize || '0') > 0 &&
      parseFloat(formData.cnpVolume || '0') >= 0 &&
      parseFloat(formData.cnpVolume || '0') <= 100
    )
  }, [formData])

  useEffect(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current)
    }

    if (isFormComplete()) {
      setIsCalculating(true)
      calculationTimeoutRef.current = setTimeout(() => {
        const calculatedExposure = calculateExposure({
          annualProcessingVolume: parseFloat(formData.annualProcessingVolume),
          advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays)
        })
        setExposure(calculatedExposure)
        setIsCalculating(false)
      }, 300) // 300ms debounce for calculation
    } else {
      setExposure(null)
    }

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current)
      }
    }
  }, [formData, isFormComplete])

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleDecline = () => {
    if (!user || !declineReason.trim()) return
    
    setIsSubmitting(true)
    
    // Calculate exposure if available
    let caseExposure = exposure
    if (!caseExposure && formData.annualProcessingVolume && formData.advanceDeliveryDays) {
      caseExposure = calculateExposure({
        annualProcessingVolume: parseFloat(formData.annualProcessingVolume) || 0,
        advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays) || 0
      })
    }
    
    if (!caseExposure) {
      caseExposure = {
        dailyVolume: 0,
        baseExposure: 0,
        chargebackExposure: 0,
        refundExposure: 0,
        refundReturnExposure: 0,
        totalExposure: 0
      }
    }

    const caseId = generateId()
    const newCase: Case = {
      id: caseId,
      caseNumber: storage.generateCaseNumber(),
      parentCompanyName: formData.parentCompanyName || 'Declined Case',
      subsidiaryName: formData.subsidiaryName || '',
      dba: formData.dba || '',
      mcc: formData.mcc || '',
      salesforceAccountNumber: formData.salesforceAccountNumber || '',
      salesforceLink: formData.salesforceLink || undefined,
      aeName: formData.aeName || '',
      annualProcessingVolume: parseFloat(formData.annualProcessingVolume) || 0,
      averageTicketSize: parseFloat(formData.averageTicketSize) || 0,
      cnpVolume: parseFloat(formData.cnpVolume) || 0,
      advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays) || 0,
      exposure: caseExposure,
      status: 'declined',
      approvalType: 'manual',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }

    storage.addCase(newCase)

    // Add audit entry with decline reason
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId,
      userId: user.id,
      userName: user.name,
      action: 'declined',
      comment: declineReason.trim(),
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)

    toast.success('Case declined')
    clearDraft()
    setDeclineDialogOpen(false)
    setIsSubmitting(false)
    router.push('/dashboard')
  }

  const handleSaveAsDraft = () => {
    if (!user) return
    
    // Calculate exposure if we have enough data, otherwise use default
    let caseExposure = exposure
    if (!caseExposure && formData.annualProcessingVolume && formData.advanceDeliveryDays) {
      caseExposure = calculateExposure({
        annualProcessingVolume: parseFloat(formData.annualProcessingVolume) || 0,
        advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays) || 0
      })
    }
    
    // Create default exposure if still null
    if (!caseExposure) {
      caseExposure = {
        dailyVolume: 0,
        baseExposure: 0,
        chargebackExposure: 0,
        refundReturnExposure: 0,
        totalExposure: 0
      }
    }

    const caseId = generateId()
    const newCase: Case = {
      id: caseId,
      caseNumber: storage.generateCaseNumber(),
      parentCompanyName: formData.parentCompanyName || 'Draft Case',
      subsidiaryName: formData.subsidiaryName || '',
      dba: formData.dba || '',
      mcc: formData.mcc || '',
      salesforceAccountNumber: formData.salesforceAccountNumber || '',
      salesforceLink: formData.salesforceLink || undefined,
      aeName: formData.aeName || '',
      annualProcessingVolume: parseFloat(formData.annualProcessingVolume) || 0,
      averageTicketSize: parseFloat(formData.averageTicketSize) || 0,
      cnpVolume: parseFloat(formData.cnpVolume) || 0,
      advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays) || 0,
      exposure: caseExposure,
      status: 'draft',
      approvalType: 'manual',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString()
    }

    storage.addCase(newCase)

    // Add audit entry
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId,
      userId: user.id,
      userName: user.name,
      action: 'created',
      comment: 'Case saved as draft',
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)

    // Add initial notes as a chat message if provided
    if (initialNotes.trim()) {
      const chatMessage: ChatMessage = {
        id: generateId(),
        caseId,
        senderId: user.id,
        senderName: user.name,
        message: initialNotes.trim(),
        timestamp: new Date().toISOString(),
        isRead: true,
        readBy: [user.id]
      }
      storage.addChatMessage(chatMessage)
    }

    toast.success('Case saved as draft')
    clearDraft()
    router.push('/dashboard')
  }

  const handleSubmit = () => {
    if (!user || !exposure) return
    setIsSubmitting(true)

    try {
      const totalExposure = exposure.totalExposure
      const add = parseFloat(formData.advanceDeliveryDays)
      
      let approvalTypeValue: ApprovalType
      let initialStatus: CaseStatus
      
      if (totalExposure <= 200000 && add <= 3) {
        approvalTypeValue = 'auto'
        initialStatus = 'auto_approved'
      } else if ((totalExposure > 200000 && totalExposure <= 500000) || (add >= 4 && add <= 45)) {
        approvalTypeValue = 'abbreviated'
        initialStatus = 'pending_risk_approval'
      } else if (totalExposure > 500000 || add > 45) {
        approvalTypeValue = 'full_review'
        initialStatus = 'pending_risk_approval'
      } else {
      approvalTypeValue = 'manual'
      initialStatus = 'pending_risk_approval'
    }

      const caseId = generateId()
      
      const newCase: Case = {
        id: caseId,
        caseNumber: storage.generateCaseNumber(),
        parentCompanyName: formData.parentCompanyName,
        subsidiaryName: formData.subsidiaryName,
        dba: formData.dba,
        mcc: formData.mcc,
        salesforceAccountNumber: formData.salesforceAccountNumber,
        salesforceLink: formData.salesforceLink || undefined,
        aeName: formData.aeName,
        annualProcessingVolume: parseFloat(formData.annualProcessingVolume),
        averageTicketSize: parseFloat(formData.averageTicketSize),
        cnpVolume: parseFloat(formData.cnpVolume),
        advanceDeliveryDays: add,
        brickAndMortar: formData.brickAndMortar as 'yes' | 'no' | undefined,
        businessDescription: formData.businessDescription || undefined,
        exposure,
        status: initialStatus,
        approvalType: approvalTypeValue,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date().toISOString(),
      approvals: {}
    }

      const auditEntry: AuditEntry = {
        id: generateId(),
        caseId,
        userId: user.id,
        userName: user.name,
        action: 'submitted',
        comment: `Case submitted - ${approvalTypeValue === 'auto' ? 'Auto Approved' : approvalTypeValue === 'abbreviated' ? 'Abbreviated Review' : 'Full Credit Review'}`,
        timestamp: new Date().toISOString()
      }

      storage.batchUpdate((state) => {
        state.cases.push(newCase)
        state.auditTrail.push(auditEntry)
        if (initialNotes.trim()) {
          const chatMessage: ChatMessage = {
            id: generateId(),
            caseId,
            senderId: user.id,
            senderName: user.name,
            message: initialNotes.trim(),
            timestamp: new Date().toISOString(),
            isRead: true,
            readBy: [user.id]
          }
          state.chatMessages.push(chatMessage)
        }
      })

      clearDraft()
      toast.success('Case submitted successfully!')
      router.replace('/dashboard')
    } catch (error) {
      console.error('[v0] Submit error:', error)
      console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      toast.error('Failed to submit case. Please try again.')
      setIsSubmitting(false)
    }
  }

  const decision = exposure && formData.advanceDeliveryDays 
    ? getExposureDecision(exposure.totalExposure, parseFloat(formData.advanceDeliveryDays)) 
    : null

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Submit Request</h1>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">Enter merchant information</p>
              {lastSaved && (
                <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={handleSaveAsDraft}>
            <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save as Draft</span>
            <span className="sm:hidden ml-1">Save</span>
          </Button>
          <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={handleSubmit} disabled={!isFormComplete() || isSubmitting || !exposure}>
            {isSubmitting ? 'Processing...' : 'Submit'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Merchant Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Enter the basic merchant details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aeName">AE Name *</Label>
                <Input
                  id="aeName"
                  value={formData.aeName}
                  onChange={handleChange('aeName')}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentCompanyName">Parent Company Name *</Label>
                  <Input
                    id="parentCompanyName"
                    value={formData.parentCompanyName}
                    onChange={handleChange('parentCompanyName')}
                    placeholder="Enter parent company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subsidiaryName">Subsidiary Name *</Label>
                  <Input
                    id="subsidiaryName"
                    value={formData.subsidiaryName}
                    onChange={handleChange('subsidiaryName')}
                    placeholder="Enter subsidiary name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dba">DBA (Doing Business As) *</Label>
                  <Input
                    id="dba"
                    value={formData.dba}
                    onChange={handleChange('dba')}
                    placeholder="Enter DBA name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcc">MCC (Merchant Category Code) *</Label>
                  <MCCSelector
                    value={formData.mcc}
                    onChange={(val) => setFormData(prev => ({ ...prev, mcc: val }))}
                  />
                  <p className="text-xs text-muted-foreground">Search by code or business description</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesforceAccountNumber">Salesforce Account Number *</Label>
                  <Input
                    id="salesforceAccountNumber"
                    value={formData.salesforceAccountNumber}
                    onChange={handleChange('salesforceAccountNumber')}
                    placeholder="e.g., 0018X00002ABC123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesforceLink">Salesforce Link *</Label>
                  <Input
                    id="salesforceLink"
                    type="url"
                    value={formData.salesforceLink}
                    onChange={handleChange('salesforceLink')}
                    placeholder="https://toast.lightning.force.com/..."
                  />
                  <p className="text-xs text-muted-foreground">Direct link to Salesforce record</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brickAndMortar">Brick & Mortar *</Label>
                  <Select
                    key={formData.brickAndMortar || 'unselected'}
                    defaultValue={formData.brickAndMortar || undefined}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, brickAndMortar: value }))}
                  >
                    <SelectTrigger id="brickAndMortar">
                      <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Does this business have a physical location?</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Processing Profile
              </CardTitle>
              <CardDescription>
                Enter processing volume and transaction details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualProcessingVolume">Annual Processing Volume (USD) *</Label>
                  <Input
                    id="annualProcessingVolume"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.annualProcessingVolume}
                    onChange={handleChange('annualProcessingVolume')}
                    placeholder="e.g., 5000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advanceDeliveryDays">Advance Delivery Days (ADD) *</Label>
                  <Input
                    id="advanceDeliveryDays"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.advanceDeliveryDays}
                    onChange={handleChange('advanceDeliveryDays')}
                    placeholder="e.g., 14"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageTicketSize">Average Ticket Size (USD) *</Label>
                  <Input
                    id="averageTicketSize"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.averageTicketSize}
                    onChange={handleChange('averageTicketSize')}
                    placeholder="e.g., 45.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpVolume">CNP Volume (%) *</Label>
                  <Input
                    id="cnpVolume"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.cnpVolume}
                    onChange={handleChange('cnpVolume')}
                    placeholder="e.g., 25"
                  />
                  <p className="text-xs text-muted-foreground">Card Not Present percentage (0-100)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Description Section */}
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
                  value={formData.businessDescription}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, businessDescription: e.target.value }))
                    // Auto-resize the textarea
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Describe the nature of the business, products/services offered, target customers, etc."
                  className="min-h-[100px] resize-none overflow-hidden"
                  style={{ height: 'auto' }}
                />
                <p className="text-xs text-muted-foreground">
                  This helps approvers understand the business context
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Decision Banner - shown below form on larger screens */}
          {exposure && decision && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Decision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DecisionBanner decision={decision} />
                
                <Separator className="my-4" />
                
                <div className="flex justify-end gap-3">
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  
                  {/* Decline Button with Dialog */}
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
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Company:</span>
                            <span className="font-medium">{formData.parentCompanyName || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Exposure:</span>
                            <span className="font-mono font-bold">{formatCurrency(exposure?.totalExposure || 0)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="declineReason">Decline Reason *</Label>
                          <Textarea
                            id="declineReason"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Enter the reason for declining this case..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDecline} disabled={isSubmitting || !declineReason.trim()}>
                          {isSubmitting ? 'Processing...' : 'Decline Case'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" onClick={handleSaveAsDraft}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Submit for Approval'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Exposure Calculator */}
        <div className="space-y-4 sm:space-y-6">
          {/* Approval Criteria Guide */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg">Approval Criteria</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-success mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Auto Approved</p>
                  <p className="text-xs text-muted-foreground">Exposure &le; $200K AND ADD &le; 3 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Abbreviated Review</p>
                  <p className="text-xs text-muted-foreground">(Exposure &gt; $200K AND &le; $500K) OR (ADD &ge; 4-45 days)</p>
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="font-semibold text-yellow-900">Financial Docs Required:</p>
                    <p className="text-yellow-800 mt-1">Codat data for latest 2 years. If unavailable: 3-year financials with YTD statements</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Full Credit Review</p>
                  <p className="text-xs text-muted-foreground">Exposure &gt; $500K OR ADD &gt; 45 days</p>
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="font-semibold text-yellow-900">Financial Docs Required:</p>
                    <p className="text-yellow-800 mt-1">3-year financials with YTD and comparable YTD statements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sticky container for Exposure Calculator and Initial Notes */}
          <div className="sticky top-6 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exposure Calculator</CardTitle>
                {isCalculating && (
                  <CardDescription className="text-primary">
                    Calculating...
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
              {!isFormComplete() ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Complete all fields to calculate exposure
                  </p>
                </div>
              ) : isCalculating ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Calculating exposure...
                  </p>
                </div>
              ) : exposure ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {/* Base Exposure */}
                    <div className="border-b border-dashed pb-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Base Exposure</span>
                        <span className="font-mono font-semibold">{formatCurrency(exposure.baseExposure)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily Volume x ADD = {formatCurrency(exposure.dailyVolume)} x {formData.advanceDeliveryDays} days
                      </p>
                    </div>
                    
                    {/* Chargeback Exposure */}
                    <div className="border-b border-dashed pb-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Chargeback Exposure</span>
                        <span className="font-mono font-semibold">{formatCurrency(exposure.chargebackExposure)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily Volume x 5% = {formatCurrency(exposure.dailyVolume)} x 5%
                      </p>
                    </div>
                    
                    {/* Refund/Return Exposure */}
                    <div className="border-b border-dashed pb-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Refund/Return Exposure</span>
                        <span className="font-mono font-semibold">{formatCurrency(exposure.refundReturnExposure)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily Volume x 1% = {formatCurrency(exposure.dailyVolume)} x 1%
                      </p>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">Total Exposure</span>
                        <p className="text-xs text-muted-foreground">Base + Chargeback + Refund</p>
                      </div>
                      <span className="font-mono font-bold text-lg text-primary">{formatCurrency(exposure.totalExposure)}</span>
                    </div>
                  </div>
                  
                  {/* Daily Volume info */}
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <p className="font-medium text-foreground">Daily Volume: {formatCurrency(exposure.dailyVolume)}</p>
                    <p>Annual Volume / 365 = {formatCurrency(parseFloat(formData.annualProcessingVolume))} / 365</p>
                  </div>
                  
                  {/* Approval Criteria Decision */}
                  <DecisionBanner decision={getExposureDecision(exposure.totalExposure, parseFloat(formData.advanceDeliveryDays))} />
                </div>
              ) : null}
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Initial Notes
                </CardTitle>
                <CardDescription>
                  Add notes that will appear in the case chatter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any initial notes or context for this case..."
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  These notes will be added to the case chatter when created
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
