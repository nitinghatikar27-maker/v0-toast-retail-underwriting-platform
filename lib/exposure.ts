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

export type ExposureDecision = 'auto_approved' | 'manual_review_amber' | 'manual_review_red'

export function getExposureDecision(totalExposure: number): ExposureDecision {
  if (totalExposure <= 200000) {
    return 'auto_approved' // Standard: Direct dual approval (PMF + Risk)
  } else {
    // > $200K: PMF approval first, then manual form, then Risk approval
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
