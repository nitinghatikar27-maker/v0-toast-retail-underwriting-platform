'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { Case } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign,
  Shield,
  Eye,
  Plus,
  Edit,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar
} from 'lucide-react'

interface DashboardMetrics {
  totalCases: number
  pendingApproval: number
  totalApproved: number
  totalExposure: number
  totalReserves: number
}

export default function DashboardPage() {
  const [allCases, setAllCases] = useState<Case[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCases: 0,
    pendingApproval: 0,
    totalApproved: 0,
    totalExposure: 0,
    totalReserves: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const cases = storage.getCases()
    const approvedCases = cases.filter(c => 
      c.status === 'approved' || c.status === 'auto_approved'
    )
    const pendingCases = cases.filter(c => 
      c.status === 'pending_review' || c.status === 'revision_requested' || c.status === 'draft'
    )

    const totalExposure = approvedCases.reduce((sum, c) => sum + c.exposure.totalExposure, 0)
    const totalReserves = approvedCases.reduce((sum, c) => {
      if (!c.reserves) return sum
      return sum + (c.reserves.minimumReserveAmount || 0)
    }, 0)

    setMetrics({
      totalCases: cases.length,
      pendingApproval: pendingCases.length,
      totalApproved: approvedCases.length,
      totalExposure,
      totalReserves
    })

    setAllCases(cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const approvedCases = allCases.filter(c => c.status === 'approved' || c.status === 'auto_approved')
  const pendingCases = allCases.filter(c => c.status === 'pending_review' || c.status === 'revision_requested' || c.status === 'draft')

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportToExcel = () => {
    const approvedCasesData = approvedCases.map(c => ({
      'Case Number': c.caseNumber,
      'Status': c.status === 'auto_approved' ? 'Auto Approved' : 'Approved',
      'AE Name': c.aeName || '',
      'Parent Company': c.parentCompanyName,
      'Subsidiary': c.subsidiaryName,
      'DBA': c.dba,
      'MCC': c.mcc,
      'SF Account #': c.salesforceAccountNumber,
      'Annual Volume': c.annualProcessingVolume,
      'Average Ticket': c.averageTicketSize,
      'CNP Volume %': c.cnpVolume,
      'ADD': c.advanceDeliveryDays,
      'Daily Volume': c.exposure.dailyVolume,
      'Base Exposure': c.exposure.baseExposure,
      'Chargeback Exposure': c.exposure.chargebackExposure,
      'Refund Exposure': c.exposure.refundReturnExposure,
      'Total Exposure': c.exposure.totalExposure,
      'Reserve %': c.reserves?.rollingReservePercentage || 0,
      'Reserve Amount': c.reserves?.minimumReserveAmount || 0,
      'Approval Type': c.approvalType,
      'Created Date': formatDate(c.createdAt),
      'Approved Date': formatDate(c.approvedAt),
      'Next Review Date': formatDate(c.nextReviewDate)
    }))

    // Convert to CSV
    if (approvedCasesData.length === 0) {
      alert('No approved cases to export')
      return
    }

    const headers = Object.keys(approvedCasesData[0])
    const csvContent = [
      headers.join(','),
      ...approvedCasesData.map(row => 
        headers.map(h => {
          const val = row[h as keyof typeof row]
          // Escape commas and quotes in string values
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `approved_cases_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportCaseToPDF = (caseItem: Case) => {
    // Create a printable HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Case ${caseItem.caseNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #FF4C29; border-bottom: 2px solid #FF4C29; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .section { margin-bottom: 20px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 200px; color: #555; }
          .value { flex: 1; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
          .approved { background: #dcfce7; color: #166534; }
          .pending { background: #fef3c7; color: #92400e; }
          .declined { background: #fecaca; color: #991b1b; }
          .exposure-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .exposure-table th, .exposure-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .exposure-table th { background: #f5f5f5; }
          .total-row { font-weight: bold; background: #f0f9ff; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>Toast Underwriting Case Report</h1>
        <div class="section">
          <div class="row">
            <span class="label">Case Number:</span>
            <span class="value">${caseItem.caseNumber}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status ${caseItem.status === 'approved' || caseItem.status === 'auto_approved' ? 'approved' : caseItem.status === 'declined' ? 'declined' : 'pending'}">
                ${caseItem.status.replace('_', ' ').toUpperCase()}
              </span>
            </span>
          </div>
          <div class="row">
            <span class="label">Approval Type:</span>
            <span class="value">${getApprovalTypeLabel(caseItem.approvalType)}</span>
          </div>
        </div>

        <h2>Section A - Merchant Information</h2>
        <div class="section">
          <div class="row"><span class="label">AE Name:</span><span class="value">${caseItem.aeName || '-'}</span></div>
          <div class="row"><span class="label">Parent Company:</span><span class="value">${caseItem.parentCompanyName}</span></div>
          <div class="row"><span class="label">Subsidiary:</span><span class="value">${caseItem.subsidiaryName || '-'}</span></div>
          <div class="row"><span class="label">DBA:</span><span class="value">${caseItem.dba || '-'}</span></div>
          <div class="row"><span class="label">MCC:</span><span class="value">${caseItem.mcc || '-'}</span></div>
          <div class="row"><span class="label">SF Account #:</span><span class="value">${caseItem.salesforceAccountNumber}</span></div>
        </div>

        <h2>Section B - Processing Profile</h2>
        <div class="section">
          <div class="row"><span class="label">Annual Processing Volume:</span><span class="value">$${caseItem.annualProcessingVolume.toLocaleString()}</span></div>
          <div class="row"><span class="label">Average Ticket Size:</span><span class="value">$${caseItem.averageTicketSize.toLocaleString()}</span></div>
          <div class="row"><span class="label">CNP Volume:</span><span class="value">${caseItem.cnpVolume}%</span></div>
          <div class="row"><span class="label">Advance Delivery Days:</span><span class="value">${caseItem.advanceDeliveryDays}</span></div>
        </div>

        <h2>Section C - Exposure Summary</h2>
        <div class="section">
          <table class="exposure-table">
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Daily Volume</td><td>$${caseItem.exposure.dailyVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr><td>Base Exposure</td><td>$${caseItem.exposure.baseExposure.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr><td>Chargeback Exposure</td><td>$${caseItem.exposure.chargebackExposure.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr><td>Refund/Return Exposure</td><td>$${caseItem.exposure.refundReturnExposure.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr class="total-row"><td>Total Exposure</td><td>$${caseItem.exposure.totalExposure.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
          </table>
        </div>

        ${caseItem.reserves ? `
        <h2>Section D - Reserves</h2>
        <div class="section">
          <div class="row"><span class="label">Rolling Reserve %:</span><span class="value">${caseItem.reserves.rollingReservePercentage || 0}%</span></div>
          <div class="row"><span class="label">Rolling Reserve Days:</span><span class="value">${caseItem.reserves.rollingReserveDays || 0}</span></div>
          <div class="row"><span class="label">Minimum Reserve %:</span><span class="value">${caseItem.reserves.minimumReservePercentage || 0}%</span></div>
          <div class="row"><span class="label">Minimum Reserve Amount:</span><span class="value">$${(caseItem.reserves.minimumReserveAmount || 0).toLocaleString()}</span></div>
        </div>
        ` : ''}

        <h2>Section E - Case Details</h2>
        <div class="section">
          <div class="row"><span class="label">Description:</span><span class="value">${caseItem.description || '-'}</span></div>
          <div class="row"><span class="label">Next Review Date:</span><span class="value">${caseItem.nextReviewDate ? new Date(caseItem.nextReviewDate).toLocaleDateString() : '-'}</span></div>
        </div>

        <h2>Timeline</h2>
        <div class="section">
          <div class="row"><span class="label">Created:</span><span class="value">${new Date(caseItem.createdAt).toLocaleString()}</span></div>
          ${caseItem.approvedAt ? `<div class="row"><span class="label">Approved:</span><span class="value">${new Date(caseItem.approvedAt).toLocaleString()}</span></div>` : ''}
          <div class="row"><span class="label">Last Modified:</span><span class="value">${new Date(caseItem.lastModifiedAt).toLocaleString()}</span></div>
        </div>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          Generated on ${new Date().toLocaleString()} | Toast Underwriting System
        </footer>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const getStatusBadge = (status: Case['status']) => {
    switch (status) {
      case 'auto_approved':
        return <Badge className="bg-success text-success-foreground">Auto Approved</Badge>
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>
      case 'draft':
        return <Badge variant="outline" className="border-warning text-warning">Draft</Badge>
      case 'pending_review':
        return <Badge className="bg-warning text-warning-foreground">Pending Review</Badge>
      case 'pending_risk_approval':
        return <Badge className="bg-warning text-warning-foreground">Pending Approval</Badge>
      case 'revision_requested':
        return <Badge variant="outline" className="border-destructive text-destructive">Revision Requested</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApprovalTypeLabel = (approvalType: string) => {
    switch (approvalType) {
      case 'auto': return 'Auto'
      case 'standard': return 'Standard'
      case 'abbreviated': return 'Abbreviated'
      case 'full_review': return 'Full Review'
      case 'manual': return 'Manual'
      default: return approvalType
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Overview of approved cases and portfolio metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={exportToExcel} disabled={approvedCases.length === 0}>
            <FileSpreadsheet className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export Approved (CSV)</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Link href="/dashboard/submit">
            <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Submit New Request</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{metrics.totalCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-warning">{metrics.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-success">{metrics.totalApproved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Exposure</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{formatCurrency(metrics.totalExposure)}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Reserves</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{formatCurrency(metrics.totalReserves)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table with Tabs */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg">All Cases</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage all underwriting cases</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-3 sm:mb-4 h-auto flex-wrap">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All ({allCases.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3">Pending ({pendingCases.length})</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 sm:px-3">Approved ({approvedCases.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderCasesTable(allCases)}
            </TabsContent>
            
            <TabsContent value="pending">
              {pendingCases.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending cases</p>
                </div>
              ) : (
                renderCasesTable(pendingCases)
              )}
            </TabsContent>
            
            <TabsContent value="approved">
              {approvedCases.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved cases yet</p>
                </div>
              ) : (
                renderCasesTable(approvedCases)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  function renderCasesTable(cases: Case[]) {
    if (cases.length === 0) {
      return (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No cases found</p>
          <p className="text-sm text-muted-foreground mt-1">Submit a new request to get started</p>
          <Link href="/dashboard/submit">
            <Button className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MCC</TableHead>
              <TableHead>SF Account #</TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Subsidiary</TableHead>
              <TableHead className="text-right">Total Exposure</TableHead>
              <TableHead className="text-right">Total Reserve</TableHead>
              <TableHead>Created/Approved</TableHead>
              <TableHead>Next Review</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map(caseItem => (
              <TableRow key={caseItem.id}>
                <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(caseItem.status)}
                    {caseItem.status === 'pending_review' && caseItem.approvals && (
                      <div className="flex gap-1 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${caseItem.approvals.pmfApproverId ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          PMF: {caseItem.approvals.pmfApproverId ? 'Yes' : 'No'}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${caseItem.approvals.riskApproverId ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          Risk: {caseItem.approvals.riskApproverId ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{caseItem.mcc || '-'}</TableCell>
                <TableCell className="font-mono text-sm">{caseItem.salesforceAccountNumber}</TableCell>
                <TableCell className="font-medium">{caseItem.parentCompanyName}</TableCell>
                <TableCell>{caseItem.subsidiaryName || '-'}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(caseItem.exposure.totalExposure)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(caseItem.reserves?.minimumReserveAmount || 0)}
                </TableCell>
                <TableCell>
                  {caseItem.approvedAt ? formatDate(caseItem.approvedAt) : formatDate(caseItem.createdAt)}
                </TableCell>
                <TableCell>
                  {caseItem.nextReviewDate ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(caseItem.nextReviewDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    caseItem.approvalType === 'auto' ? 'secondary' : 
                    caseItem.approvalType === 'abbreviated' || caseItem.approvalType === 'standard' ? 'outline' : 
                    'default'
                  }>
                    {getApprovalTypeLabel(caseItem.approvalType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(caseItem.status === 'draft' || caseItem.status === 'revision_requested') && (
                      <Link href={`/dashboard/case/${caseItem.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit case</span>
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/case/${caseItem.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View case</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => exportCaseToPDF(caseItem)}>
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Export PDF</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}
