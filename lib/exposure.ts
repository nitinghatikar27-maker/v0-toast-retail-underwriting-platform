import { Exposure } from './types'

export interface ExposureInput {
  annualProcessingVolume: number
  advanceDeliveryDays: number
}

export function calculateExposure(input: ExposureInput): Exposure {
  const { annualProcessingVolume, advanceDeliveryDays } = input
  
  const dailyVolume = annualProcessingVolume / 365
  const baseExposure = dailyVolume * advanceDeliveryDays
  
  // Only calculate chargeback and refund exposure if ADD > 0
  const chargebackExposure = advanceDeliveryDays > 0 ? dailyVolume * 0.05 : 0 // 5%
  const refundReturnExposure = advanceDeliveryDays > 0 ? dailyVolume * 0.01 : 0 // 1%
  const totalExposure = baseExposure + chargebackExposure + refundReturnExposure

  return {
    dailyVolume,
    baseExposure,
    chargebackExposure,
    refundReturnExposure,
    totalExposure
  }
}

export type ExposureDecision = 'auto_approved' | 'manual_review_amber' | 'manual_review_red'

export function getExposureDecision(totalExposure: number): ExposureDecision {
  if (totalExposure <= 200000) {
    return 'auto_approved'
  } else if (totalExposure <= 500000) {
    return 'manual_review_amber'
  } else {
    return 'manual_review_red'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
