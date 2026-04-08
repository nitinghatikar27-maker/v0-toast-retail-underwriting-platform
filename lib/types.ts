export type UserRole = 'admin' | 'user' | 'approver'

export type UserStatus = 'pending' | 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  password: string
  roles: UserRole[]
  approvalLimit?: number
  status?: UserStatus
  createdAt: string
}

export interface ApprovalMatrixEntry {
  id: string
  minExposure: number
  maxExposure: number
  approverId: string
  order: number
}

export interface AuditEntry {
  id: string
  caseId: string
  userId: string
  userName: string
  action: 'created' | 'submitted' | 'approved' | 'declined' | 'revision_requested' | 'updated' | 'document_uploaded'
  comment?: string
  fieldsModified?: string[]
  timestamp: string
}

export interface Document {
  id: string
  caseId: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  dataUrl: string
}

export type CaseStatus = 'draft' | 'pending_review' | 'pending_pmf_approval' | 'pending_risk_approval' | 'revision_requested' | 'approved' | 'declined' | 'auto_approved'
export type ApprovalType = 'auto' | 'manual' | 'standard' | 'abbreviated' | 'full_review'

export interface Exposure {
  dailyVolume: number
  baseExposure: number
  chargebackExposure: number
  refundExposure: number
  refundReturnExposure: number // Deprecated, kept for compatibility
  totalExposure: number
}

export interface Reserves {
  rollingReservePercentage: number
  rollingReserveDays: number
  minimumReservePercentage: number
  minimumReserveAmount: number
}

export interface Guarantee {
  type: 'corporate' | 'bank' | 'loc'
  enabled: boolean
  amount?: number
  expiryDate?: string
  autoRenewal?: boolean
}

export interface Case {
  id: string
  caseNumber: string
  
  // Section A - Merchant Information
  parentCompanyName: string
  subsidiaryName: string
  dba: string
  mcc: string
  salesforceAccountNumber: string
  salesforceLink?: string
  aeName: string
  businessType?: string
  yearsInBusiness?: number
  websiteUrl?: string
  businessAddress?: string
  
  // Section B - Processing Profile
  annualProcessingVolume: number
  averageTicketSize: number
  highestTicketSize?: number
  cnpVolume: number
  advanceDeliveryDays: number
  refundReturnRate?: number
  chargebackRate?: number
  
  // Section C - Exposure Summary (auto-calculated)
  exposure: Exposure
  
  // Section D - Reserves & Guarantees
  reserves?: Reserves
  guarantees?: Guarantee[]
  
  // Section E - Case Description
  snapshotImage?: string
  description?: string
  
  // Workflow
  status: CaseStatus
  approvalType: ApprovalType
  assignedApproverId?: string
  lockedFields?: string[]
  
  // Dual Approval
  approvals?: {
    pmfApproverId?: string
    pmfApproverName?: string
    pmfApprovedAt?: string
    pmfComment?: string
    riskApproverId?: string
    riskApproverName?: string
    riskApprovedAt?: string
    riskComment?: string
  }
  
  // Dates
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  nextReviewDate?: string
  
  // User info
  createdBy: string
  lastModifiedBy: string
  lastModifiedAt: string
}

export interface ChatMessage {
  id: string
  caseId: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  isRead: boolean
  readBy: string[]
}

export interface Notification {
  id: string
  userId: string
  type: 'chat' | 'case_update' | 'approval_request'
  title: string
  message: string
  caseId?: string
  timestamp: string
  isRead: boolean
}

export interface AppState {
  users: User[]
  cases: Case[]
  auditTrail: AuditEntry[]
  documents: Document[]
  approvalMatrix: ApprovalMatrixEntry[]
  chatMessages: ChatMessage[]
  notifications: Notification[]
  currentUserId: string | null
}
