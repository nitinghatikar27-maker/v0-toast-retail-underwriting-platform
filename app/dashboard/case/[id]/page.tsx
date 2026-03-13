'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { Case, AuditEntry, Document as DocType } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { AuditTrail } from '@/components/audit-trail'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
  Download
} from 'lucide-react'

export default function CaseViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [documents, setDocuments] = useState<DocType[]>([])
  const [activeTab, setActiveTab] = useState<'audit' | 'documents'>('audit')

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
                {caseData.approvalType === 'auto' ? 'Auto' : 'Manual'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{caseData.parentCompanyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

          {/* Reserves & Guarantees */}
          {(caseData.reserves || caseData.guarantees?.some(g => g.enabled)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Reserves & Guarantees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.reserves && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {caseData.reserves.rollingReservePercentage > 0 && (
                      <div>
                        <p className="text-muted-foreground">Rolling Reserve</p>
                        <p className="font-medium">
                          {caseData.reserves.rollingReservePercentage}% for {caseData.reserves.rollingReserveDays} days
                        </p>
                      </div>
                    )}
                    {caseData.reserves.minimumReserveAmount > 0 && (
                      <div>
                        <p className="text-muted-foreground">Minimum Reserve</p>
                        <p className="font-mono">{formatCurrency(caseData.reserves.minimumReserveAmount)}</p>
                      </div>
                    )}
                  </div>
                )}
                {caseData.guarantees?.filter(g => g.enabled).map(g => (
                  <div key={g.type} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium capitalize">{g.type} Guarantee</p>
                    {g.amount && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(g.amount)}
                      </p>
                    )}
                    {g.type === 'corporate' && (
                      <p className="text-sm text-success">Covers 100% of exposure</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {caseData.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{caseData.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Snapshot */}
          {caseData.snapshotImage && (
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={caseData.snapshotImage}
                  alt="Case snapshot"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
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
