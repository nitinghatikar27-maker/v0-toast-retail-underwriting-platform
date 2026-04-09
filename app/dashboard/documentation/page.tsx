'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink, BookOpen } from 'lucide-react'

export default function DocumentationPage() {
  const handleOpenSalesGuide = () => {
    window.open('/Toast_Sales_Team_Guide.html', '_blank')
  }

  const handleOpenTechnicalGuide = () => {
    window.open('/Toast_Platform_Technical_Guide.html', '_blank')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Platform Documentation
        </h1>
        <p className="text-muted-foreground">Guides and resources for your team</p>
      </div>

      {/* Sales Team Guide - PRIMARY */}
      <Card className="border-2 border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            Sales Team User Guide
          </CardTitle>
          <CardDescription>
            For the sales team - How to use the platform to submit merchant requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded border border-red-200 text-sm">
            <p className="font-semibold text-red-800 mb-3">This guide covers:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-red-700">
              <div>
                <p>1. What is This Platform?</p>
                <p>2. How to Log In</p>
                <p>3. Understanding the Dashboard</p>
                <p>4. How to Submit a New Request</p>
                <p>5. The Request Form - Field by Field</p>
              </div>
              <div>
                <p>6. How Exposure is Calculated (Exact Formula)</p>
                <p>7. The Three Approval Tiers</p>
                <p>8. After You Submit - What Happens</p>
                <p>9. Tracking Your Cases</p>
                <p>10. Common Questions</p>
              </div>
            </div>
          </div>
          <Button onClick={handleOpenSalesGuide} className="w-full bg-red-600 hover:bg-red-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Sales Team Guide
          </Button>
          <p className="text-xs text-muted-foreground">
            Use browser Print (Ctrl+P) and select "Save as PDF" to download as Word/PDF
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Guide */}
        <Card className="border border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Technical Guide
            </CardTitle>
            <CardDescription>
              For tech teams - Platform architecture and logic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleOpenTechnicalGuide} variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Technical Guide
            </Button>
          </CardContent>
        </Card>

        {/* Exposure Formula Quick Reference */}
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Exposure Formula
            </CardTitle>
            <CardDescription>
              Quick reference for the calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono bg-gray-50 p-3 rounded">
            <p>Daily Volume = APV / 365</p>
            <p>Base Exposure = Daily Volume x ADD</p>
            <p>Chargeback = Daily Volume x 5%</p>
            <p>Refund = Daily Volume x 1%</p>
            <p className="font-bold pt-2 border-t">TOTAL = Base + Chargeback + Refund</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference for Your Team</CardTitle>
          <CardDescription>Essential concepts explained simply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">What is Exposure?</h4>
              <p className="text-sm text-blue-800">
                It's a dollar amount that shows the maximum monthly risk for a merchant. Calculated from how much money they process per month multiplied by risk factors.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">The 3 Approval Tiers</h4>
              <p className="text-sm text-purple-800">
                <strong>Auto:</strong> ≤$200K (instant approval)<br/>
                <strong>Abbreviated:</strong> $200K-$500K (quick review)<br/>
                <strong>Full:</strong> ≥$500K (detailed review)
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">How Cases Flow</h4>
              <p className="text-sm text-green-800">
                Submit → Calculate Exposure → Auto-Approve OR Route to Risk Team → Risk Team Reviews → Final Decision
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">User Roles</h4>
              <p className="text-sm text-orange-800">
                <strong>User:</strong> Submits cases<br/>
                <strong>Approver:</strong> Reviews & approves<br/>
                <strong>Admin:</strong> Manages everything
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use Documentation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How Your Tech Team Should Use This</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-900">
          <div>
            <p className="font-semibold mb-2">1. Start with the Technical Guide</p>
            <p className="text-sm">Open the "Technical Guide (Plain English)" - it explains everything in simple terms without technical jargon.</p>
          </div>
          <div>
            <p className="font-semibold mb-2">2. Print or Save as PDF</p>
            <p className="text-sm">Use your browser's Print function (Ctrl+P or Cmd+P) and save as PDF for a downloadable document.</p>
          </div>
          <div>
            <p className="font-semibold mb-2">3. Share with Team</p>
            <p className="text-sm">Send the PDF to team members or post it in your team documentation system.</p>
          </div>
          <div>
            <p className="font-semibold mb-2">4. Reference as Needed</p>
            <p className="text-sm">Use it during development, testing, and when explaining the system to stakeholders.</p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            The Technical Guide covers all aspects of how the platform works. If your team needs more specific information, contact the platform administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
