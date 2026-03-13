'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Case, AuditEntry, Guarantee, Document as DocType } from '@/lib/types'
import { calculateExposure, formatCurrency } from '@/lib/exposure'
import { AuditTrail } from '@/components/audit-trail'
import { DocumentUpload } from '@/components/document-upload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  ImageIcon
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
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'audit' | 'documents'>('audit')
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
    
    // Find the appropriate approver based on exposure
    const approverId = storage.getApproverForExposure(caseData.exposure.totalExposure)
    
    const updatedCase: Case = {
      ...caseData,
      status: 'pending_review',
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
      comment: 'Case submitted for approval',
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)
    
    toast.success('Case submitted for approval')
    router.push('/dashboard')
    setIsSubmitting(false)
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
    <div className="flex h-screen">
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
              <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
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
                      <DocumentUpload
                        caseId={caseData.id}
                        documents={documents}
                        onDocumentAdded={loadData}
                        onDocumentDeleted={loadData}
                      />
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
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
            </div>
          </div>

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
                  <Label htmlFor="salesforceAccountNumber">Salesforce Account Number</Label>
                  <Input
                    id="salesforceAccountNumber"
                    value={caseData.salesforceAccountNumber}
                    onChange={(e) => updateField('salesforceAccountNumber', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcc">MCC Code</Label>
                  <Input
                    id="mcc"
                    value={caseData.mcc || ''}
                    onChange={(e) => updateField('mcc', e.target.value)}
                    placeholder="e.g., 5812"
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type / Industry</Label>
                  <Input
                    id="businessType"
                    value={caseData.businessType || ''}
                    onChange={(e) => updateField('businessType', e.target.value)}
                    placeholder="e.g., Restaurant"
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    min="0"
                    value={caseData.yearsInBusiness || ''}
                    onChange={(e) => updateField('yearsInBusiness', parseInt(e.target.value) || 0)}
                    disabled={!isEditable}
                  />
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    value={caseData.businessAddress || ''}
                    onChange={(e) => updateField('businessAddress', e.target.value)}
                    disabled={!isEditable}
                  />
                </div>
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
                  <Label htmlFor="highestTicketSize">Highest Ticket Size (USD)</Label>
                  <Input
                    id="highestTicketSize"
                    type="number"
                    min="0"
                    step="0.01"
                    value={caseData.highestTicketSize || ''}
                    onChange={(e) => updateField('highestTicketSize', parseFloat(e.target.value) || 0)}
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
              </div>
            </CardContent>
          </Card>

          {/* Section C - Exposure Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Section C - Exposure Summary
              </CardTitle>
              <CardDescription>Auto-calculated exposure values (read-only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Daily Volume</p>
                  <p className="text-lg font-mono font-semibold">
                    {formatCurrency(caseData.exposure.dailyVolume)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Base Exposure</p>
                  <p className="text-lg font-mono font-semibold">
                    {formatCurrency(caseData.exposure.baseExposure)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Chargeback (5%)</p>
                  <p className="text-lg font-mono font-semibold">
                    {formatCurrency(caseData.exposure.chargebackExposure)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Refund/Return (1%)</p>
                  <p className="text-lg font-mono font-semibold">
                    {formatCurrency(caseData.exposure.refundReturnExposure)}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center bg-primary/10 rounded-lg p-4">
                <span className="font-semibold">Total Exposure</span>
                <span className="text-2xl font-mono font-bold">
                  {formatCurrency(caseData.exposure.totalExposure)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section D - Reserves & Guarantees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Section D - Reserves & Guarantees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rolling Reserve */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <span className="font-medium">Rolling Reserve Calculator</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
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
                </CollapsibleContent>
              </Collapsible>

              {/* Minimum Reserve */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <span className="font-medium">Minimum Reserve Calculator</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
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
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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

          {/* Section E - Case Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Section E - Case Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
        </div>
      </div>
    </div>
  )
}
