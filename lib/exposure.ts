import { Exposure } from './types'

export interface ExposureInput {
  annualProcessingVolume: number
  advanceDeliveryDays: number
  cnpVolume?: number // CNP Volume percentage (0-100)
}

export function calculateExposure(input: ExposureInput): Exposure {
  const { annualProcessingVolume, advanceDeliveryDays, cnpVolume = 0 } = input
  
  const dailyVolume = annualProcessingVolume / 365
  const cnpPercentage = cnpVolume / 100
  
  // Formula from submit request form:
  // Refund Exposure = Daily Volume × ADD × (CNP% / 100)
  // Chargeback Exposure = Daily Volume × 180 × (CNP% / 100)
  // Total Exposure = Refund Exposure + Chargeback Exposure
  const refundExposure = dailyVolume * advanceDeliveryDays * cnpPercentage
  const chargebackExposure = dailyVolume * 180 * cnpPercentage
  const totalExposure = refundExposure + chargebackExposure
  
  // Base exposure for compatibility
  const baseExposure = dailyVolume * advanceDeliveryDays

  return {
    dailyVolume,
    baseExposure,
    chargebackExposure,
    refundExposure,
    refundReturnExposure: refundExposure, // For compatibility
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
