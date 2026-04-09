'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink, BookOpen } from 'lucide-react'

export default function DocumentationPage() {
  const handleOpenTechnicalGuide = () => {
    window.open('/Toast_Platform_Technical_Guide.html', '_blank')
  }

  const handleDownloadHTML = () => {
    window.open('/Toast_Retail_Underwriting_Platform_Documentation.html', '_blank')
  }

  const handleDownloadMD = () => {
    const link = document.createElement('a')
    link.href = '/Toast_Retail_Underwriting_Platform_Documentation.md'
    link.download = 'Toast_Retail_Underwriting_Platform_Documentation.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Platform Documentation
        </h1>
        <p className="text-muted-foreground">Guides and resources for your tech team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Guide - NEW */}
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Technical Guide (Plain English)
            </CardTitle>
            <CardDescription>
              Written in plain English for technical teams - No jargon!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-3 rounded border border-green-200 text-sm">
              <p className="font-semibold text-green-800 mb-2">Includes:</p>
              <ul className="text-sm space-y-1 text-green-700">
                <li>✓ How the platform works (step by step)</li>
                <li>✓ User roles and what they can do</li>
                <li>✓ Case submission process</li>
                <li>✓ Exposure calculation explained</li>
                <li>✓ Approval workflow and tiers</li>
                <li>✓ Dashboard and monitoring</li>
                <li>✓ Data management and storage</li>
                <li>✓ Audit trail and compliance</li>
              </ul>
            </div>
            <Button onClick={handleOpenTechnicalGuide} className="w-full bg-green-600 hover:bg-green-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Technical Guide
            </Button>
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use browser "Print" (Ctrl+P) and select "Save as PDF" to download
            </p>
          </CardContent>
        </Card>

        {/* Original Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Full Platform Documentation
            </CardTitle>
            <CardDescription>
              Complete reference with all details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Download full documentation in multiple formats:</p>
            <div className="space-y-2">
              <Button onClick={handleDownloadHTML} variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                HTML Format
              </Button>
              <Button onClick={handleDownloadMD} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Markdown Format
              </Button>
            </div>
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
