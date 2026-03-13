'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { Exposure, Case, AuditEntry } from '@/lib/types'
import { calculateExposure, getExposureDecision, formatCurrency } from '@/lib/exposure'
import { ExposureCalculator, DecisionBanner } from '@/components/exposure-calculator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Calculator, CheckCircle, FileText } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  parentCompanyName: string
  subsidiaryName: string
  salesforceAccountNumber: string
  annualProcessingVolume: string
  advanceDeliveryDays: string
  averageTicketSize: string
  cnpVolume: string
}

export default function SubmitRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    parentCompanyName: '',
    subsidiaryName: '',
    salesforceAccountNumber: '',
    annualProcessingVolume: '',
    advanceDeliveryDays: '',
    averageTicketSize: '',
    cnpVolume: ''
  })
  const [exposure, setExposure] = useState<Exposure | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isFormComplete = useCallback(() => {
    return (
      formData.parentCompanyName.trim() !== '' &&
      formData.subsidiaryName.trim() !== '' &&
      formData.salesforceAccountNumber.trim() !== '' &&
      formData.annualProcessingVolume !== '' &&
      formData.advanceDeliveryDays !== '' &&
      formData.averageTicketSize !== '' &&
      formData.cnpVolume !== '' &&
      parseFloat(formData.annualProcessingVolume) > 0 &&
      parseFloat(formData.advanceDeliveryDays) > 0 &&
      parseFloat(formData.averageTicketSize) > 0 &&
      parseFloat(formData.cnpVolume) >= 0 &&
      parseFloat(formData.cnpVolume) <= 100
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
      }, 1500) // 1.5 second delay after all fields complete
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

  const handleSubmit = () => {
    if (!user || !exposure) return

    setIsSubmitting(true)

    const decision = getExposureDecision(exposure.totalExposure)
    const isAutoApproved = decision === 'auto_approved'

    const caseId = generateId()
    const newCase: Case = {
      id: caseId,
      caseNumber: storage.generateCaseNumber(),
      parentCompanyName: formData.parentCompanyName,
      subsidiaryName: formData.subsidiaryName,
      salesforceAccountNumber: formData.salesforceAccountNumber,
      annualProcessingVolume: parseFloat(formData.annualProcessingVolume),
      averageTicketSize: parseFloat(formData.averageTicketSize),
      cnpVolume: parseFloat(formData.cnpVolume),
      advanceDeliveryDays: parseFloat(formData.advanceDeliveryDays),
      exposure,
      status: isAutoApproved ? 'auto_approved' : 'draft',
      approvalType: isAutoApproved ? 'auto' : 'manual',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      lastModifiedBy: user.id,
      lastModifiedAt: new Date().toISOString(),
      ...(isAutoApproved && { approvedAt: new Date().toISOString() })
    }

    storage.addCase(newCase)

    // Add audit entry
    const auditEntry: AuditEntry = {
      id: generateId(),
      caseId,
      userId: user.id,
      userName: user.name,
      action: isAutoApproved ? 'approved' : 'created',
      comment: isAutoApproved 
        ? 'Auto-approved: Exposure within threshold' 
        : 'Case created and ready for manual review',
      timestamp: new Date().toISOString()
    }
    storage.addAuditEntry(auditEntry)

    if (isAutoApproved) {
      toast.success('Case auto-approved successfully!')
      router.push('/dashboard')
    } else {
      toast.success('Case created! Redirecting to manual review form...')
      router.push(`/dashboard/case/${caseId}/edit`)
    }
  }

  const decision = exposure ? getExposureDecision(exposure.totalExposure) : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit Request</h1>
          <p className="text-muted-foreground">Enter merchant information to calculate exposure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Merchant Information
              </CardTitle>
              <CardDescription>
                Enter the basic merchant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="salesforceAccountNumber">Salesforce Account Number *</Label>
                <Input
                  id="salesforceAccountNumber"
                  value={formData.salesforceAccountNumber}
                  onChange={handleChange('salesforceAccountNumber')}
                  placeholder="e.g., 0018X00002ABC123"
                />
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
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : decision === 'auto_approved' ? 'Submit & Auto-Approve' : 'Proceed to Manual Review'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Exposure Calculator */}
        <div className="space-y-6">
          <Card className="sticky top-6">
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
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Daily Volume</span>
                      <span className="font-mono">{formatCurrency(exposure.dailyVolume)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Base Exposure</span>
                      <span className="font-mono">{formatCurrency(exposure.baseExposure)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Chargeback (5%)</span>
                      <span className="font-mono">{formatCurrency(exposure.chargebackExposure)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Refund/Return (1%)</span>
                      <span className="font-mono">{formatCurrency(exposure.refundReturnExposure)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Exposure</span>
                    <span className="font-mono font-bold text-lg">{formatCurrency(exposure.totalExposure)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approval Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Auto-Approved:</span>
                <span className="font-mono">{'<='} $200,000</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-muted-foreground">Manual Review:</span>
                <span className="font-mono">$200K - $500K</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Enhanced Review:</span>
                <span className="font-mono">{'>'} $500,000</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
