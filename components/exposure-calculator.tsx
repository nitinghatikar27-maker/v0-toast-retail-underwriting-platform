'use client'

import { Exposure } from '@/lib/types'
import { formatCurrencyFull, getExposureDecision } from '@/lib/exposure'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ExposureCalculatorProps {
  exposure: Exposure | null
  advanceDeliveryDays?: number
  showDecision?: boolean
}

export function ExposureCalculator({ exposure, advanceDeliveryDays = 0, showDecision = false }: ExposureCalculatorProps) {
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

  const decision = getExposureDecision(exposure.totalExposure, advanceDeliveryDays)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Exposure Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Daily Volume (Annual / 365)</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.dailyVolume)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Base Exposure (Daily Volume x ADD)</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.baseExposure)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Chargeback Exposure (Daily Volume x 5%)</span>
            <span className="font-mono text-sm">{formatCurrencyFull(exposure.chargebackExposure)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Refund/Return Exposure (Daily Volume x 1%)</span>
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
          Auto Approved
        </p>
        <p className="text-sm text-success/80 mt-1">
          Criteria: Exposure &le; $200K AND ADD &le; 3 days. Case will be automatically approved.
        </p>
      </div>
    )
  }

  if (decision === 'abbreviated_review') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="text-blue-700 dark:text-blue-300 font-medium">
            Abbreviated Review
          </p>
          <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1">
            Criteria: (Exposure &gt; $200K AND &le; $500K) OR (ADD &ge; 4 days AND &le; 45 days). Case requires Risk approval.
          </p>
        </div>
        <DocumentRequirements type="abbreviated" />
      </div>
    )
  }

  if (decision === 'full_credit_review') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
          <p className="text-warning-foreground font-medium">
            Full Credit Review
          </p>
          <p className="text-sm text-warning-foreground/80 mt-1">
            Criteria: Exposure &gt; $500K OR ADD &gt; 45 days. Case requires Risk approval with additional documentation.
          </p>
        </div>
        <DocumentRequirements type="red" />
      </div>
    )
  }

  // Manual - doesn't fit the criteria
  return (
    <div className="rounded-lg bg-muted border border-border p-4">
      <p className="font-medium">
        Manual Review Required
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Case doesn't match standard approval criteria. Risk approval required for further review.
      </p>
    </div>
  )
}

function DocumentRequirements({ type }: { type: 'amber' | 'red' | 'abbreviated' }) {
  if (type === 'abbreviated') {
    return (
      <div className="rounded-lg bg-muted p-4">
        <p className="font-medium text-sm mb-2">Required Documents:</p>
        <p className="text-sm text-muted-foreground">
          Please provide Codat data for the latest 2 years.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          If Codat data is unavailable, please submit:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
          <li>Latest 3 years of financial statements</li>
          <li>Year-to-date (YTD) statements</li>
        </ul>
      </div>
    )
  }

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
