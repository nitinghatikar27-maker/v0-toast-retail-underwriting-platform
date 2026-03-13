'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { Case } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Plus
} from 'lucide-react'

interface DashboardMetrics {
  totalCases: number
  pendingApproval: number
  totalApproved: number
  totalExposure: number
  totalReserves: number
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([])
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
    const allCases = storage.getCases()
    const approvedCases = allCases.filter(c => 
      c.status === 'approved' || c.status === 'auto_approved'
    )
    const pendingCases = allCases.filter(c => 
      c.status === 'pending_review' || c.status === 'revision_requested'
    )

    const totalExposure = approvedCases.reduce((sum, c) => sum + c.exposure.totalExposure, 0)
    const totalReserves = approvedCases.reduce((sum, c) => {
      if (!c.reserves) return sum
      return sum + (c.reserves.minimumReserveAmount || 0)
    }, 0)

    setMetrics({
      totalCases: allCases.length,
      pendingApproval: pendingCases.length,
      totalApproved: approvedCases.length,
      totalExposure,
      totalReserves
    })

    setCases(approvedCases)
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

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Cases</CardTitle>
          <CardDescription>All approved cases in the portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No approved cases yet</p>
              <p className="text-sm text-muted-foreground mt-1">Submit a new request to get started</p>
              <Link href="/dashboard/submit">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>MCC</TableHead>
                    <TableHead>SF Account #</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Subsidiary</TableHead>
                    <TableHead className="text-right">Total Exposure</TableHead>
                    <TableHead className="text-right">Total Reserve</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead>Next Review</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map(caseItem => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-mono text-sm">{caseItem.caseNumber}</TableCell>
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
                      <TableCell>{formatDate(caseItem.approvedAt)}</TableCell>
                      <TableCell>
                        {caseItem.approvalType === 'auto' ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          formatDate(caseItem.nextReviewDate)
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={caseItem.approvalType === 'auto' ? 'secondary' : 'default'}>
                          {caseItem.approvalType === 'auto' ? 'Auto' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/case/${caseItem.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View case</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
