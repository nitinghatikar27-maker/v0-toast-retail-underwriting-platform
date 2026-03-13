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
  AlertCircle
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
      case 'revision_requested':
        return <Badge variant="outline" className="border-destructive text-destructive">Revision Requested</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of approved cases and portfolio metrics</p>
        </div>
        <Link href="/dashboard/submit">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Submit New Request
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.totalApproved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Exposure</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalExposure)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reserves</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalReserves)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>View and manage all underwriting cases</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Cases ({allCases.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCases.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedCases.length})</TabsTrigger>
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
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map(caseItem => (
              <TableRow key={caseItem.id}>
                <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
                <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
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
                  <Badge variant={caseItem.approvalType === 'auto' ? 'secondary' : 'default'}>
                    {caseItem.approvalType === 'auto' ? 'Auto' : 'Manual'}
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
