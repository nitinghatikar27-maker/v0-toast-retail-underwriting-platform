'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink } from 'lucide-react'

export default function DocumentationPage() {
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
          <FileText className="h-6 w-6" />
          Platform Documentation
        </h1>
        <p className="text-muted-foreground">Complete user guide and technical documentation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              HTML Document
            </CardTitle>
            <CardDescription>
              Formatted document that can be printed or saved as PDF. Open in browser to use File &gt; Print &gt; Save as PDF for Word-compatible format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadHTML} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Documentation (HTML)
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Tip: Use your browser&apos;s Print function (Ctrl+P / Cmd+P) and select &quot;Save as PDF&quot; to create a downloadable PDF document.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Markdown Document
            </CardTitle>
            <CardDescription>
              Plain text markdown format. Can be opened in any text editor or markdown viewer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadMD} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Documentation (MD)
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Markdown files can be converted to Word using tools like Pandoc or online converters.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentation Contents</CardTitle>
          <CardDescription>What&apos;s included in the documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">1. Platform Overview</h4>
              <p className="text-sm text-muted-foreground">Purpose, key features, and system requirements</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">2. User Roles</h4>
              <p className="text-sm text-muted-foreground">User, Approver, and Admin permissions</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">3. Authentication</h4>
              <p className="text-sm text-muted-foreground">Login, logout, and access request process</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">4. Dashboard</h4>
              <p className="text-sm text-muted-foreground">Metrics, cases table, and quick actions</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">5. Submit Request</h4>
              <p className="text-sm text-muted-foreground">Form sections, fields, and submission process</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">6. Exposure Calculation</h4>
              <p className="text-sm text-muted-foreground">Formulas, examples, and thresholds</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">7. Approval Workflow</h4>
              <p className="text-sm text-muted-foreground">Status flow, auto-approval, and risk approval</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">8. Case Management</h4>
              <p className="text-sm text-muted-foreground">Case details, activity, editing, and chatter</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">9. User Management</h4>
              <p className="text-sm text-muted-foreground">Admin functions for managing users</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">10. Data Export</h4>
              <p className="text-sm text-muted-foreground">CSV and PDF export capabilities</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">11. Audit Trail</h4>
              <p className="text-sm text-muted-foreground">Tracked actions and compliance logging</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">12. Technical Specs</h4>
              <p className="text-sm text-muted-foreground">Case number format, storage, and compatibility</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
