'use client'

import { Exposure } from '@/lib/types'
import { formatCurrencyFull, getExposureDecision } from '@/lib/exposure'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ExposureCalculatorProps {
  exposure: Exposure | null
  showDecision?: boolean
}

export function ExposureCalculator({ exposure, showDecision = false }: ExposureCalculatorProps) {
  if (!exposure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exposure Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Complete all fields to calculate exposure
          </p>
        </CardContent>
      </Card>
    )
  }

  const decision = getExposureDecision(exposure.totalExposure)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Exposure Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Base Exposure</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.baseExposure)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Chargeback Exposure (5%)</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.chargebackExposure)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Refund/Return Exposure (1%)</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.refundReturnExposure)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Exposure</span>
          <span className="font-mono font-bold text-lg">{formatCurrencyFull(exposure.totalExposure)}</span>
        </div>

        {showDecision && (
          <>
            <Separator />
            <DecisionBanner decision={decision} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface DecisionBannerProps {
  decision: ReturnType<typeof getExposureDecision>
}

export function DecisionBanner({ decision }: DecisionBannerProps) {
  if (decision === 'auto_approved') {
    return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-4">
        <p className="text-success font-medium">
          Exposure is within standard threshold (&le; $200K).
        </p>
        <p className="text-sm text-success/80 mt-1">
          Case will be submitted for PMF approval. No manual form required.
        </p>
      </div>
    )
  }

  // For exposure > $200K (manual_review_amber or manual_review_red)
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
        <p className="text-warning-foreground font-medium">
          Exposure exceeds $200K: PMF approval required.
        </p>
        <p className="text-sm text-warning-foreground/80 mt-1">
          After PMF approval, please submit the below information to get Risk approval.
        </p>
      </div>
      <DocumentRequirements type="red" />
    </div>
  )
}

function DocumentRequirements({ type }: { type: 'amber' | 'red' }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="font-medium text-sm mb-2">Required Documents:</p>
      {type === 'amber' ? (
        <p className="text-sm text-muted-foreground">
          Please provide the latest 36 months of Codat data.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground mt-2">
        {type === 'amber' ? 'Note: If Codat data is unavailable, please submit:' : 'Please submit:'}
      </p>
      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
        <li>Latest 3 years of financial statements</li>
        <li>Year-to-date (YTD) financials</li>
        <li>Latest 3 months of bank statements for the processing account</li>
      </ul>
    </div>
  )
}
