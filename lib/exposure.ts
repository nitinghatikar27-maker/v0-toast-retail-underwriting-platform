import { Exposure } from './types'

export interface ExposureInput {
  annualProcessingVolume: number
  advanceDeliveryDays: number
}

export function calculateExposure(input: ExposureInput): Exposure {
  const { annualProcessingVolume, advanceDeliveryDays } = input
  
  // Daily Volume = Annual Processing Volume / 365
  const dailyVolume = annualProcessingVolume / 365
  
  // Base Exposure = Daily Volume × ADD
  const baseExposure = dailyVolume * advanceDeliveryDays
  
  // Chargeback Exposure = Daily Volume × 5%
  const chargebackExposure = dailyVolume * 0.05
  
  // Refund/Return Exposure = Daily Volume × 1%
  const refundReturnExposure = dailyVolume * 0.01
  
  // TOTAL EXPOSURE = Base Exposure + Chargeback Exposure + Refund/Return Exposure
  const totalExposure = baseExposure + chargebackExposure + refundReturnExposure

  return {
    dailyVolume,
    baseExposure,
    chargebackExposure,
    refundExposure: refundReturnExposure,
    refundReturnExposure,
    totalExposure
  }
}

export type ExposureDecision = 'auto_approved' | 'abbreviated_review' | 'full_credit_review' | 'manual'

export function getExposureDecision(totalExposure: number, advanceDeliveryDays: number): ExposureDecision {
  // Auto Approved: exposure <= $200K AND ADD <= 3 days
  if (totalExposure <= 200000 && advanceDeliveryDays <= 3) {
    return 'auto_approved'
  }
  
  // Abbreviated review: exposure > $200K AND < $500K AND ADD between 4 to 45 days
  if (totalExposure > 200000 && totalExposure < 500000 && advanceDeliveryDays >= 4 && advanceDeliveryDays <= 45) {
    return 'abbreviated_review'
  }
  
  // Full credit review: exposure >= $500K AND ADD > 45 days
  if (totalExposure >= 500000 && advanceDeliveryDays > 45) {
    return 'full_credit_review'
  }
  
  // Default to manual if criteria don't match
  return 'manual'
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
