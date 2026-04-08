import { AppState, User, Case, AuditEntry, Document, ApprovalMatrixEntry, ChatMessage, Notification } from './types'

// Storage key for localStorage persistence - v2 with chat support
const STORAGE_KEY = 'toast_underwriting_data'

// In-memory cache to avoid repeated localStorage reads
let cachedState: AppState | null = null
let cacheTimestamp = 0
const CACHE_TTL = 100 // Cache for 100ms to batch rapid reads

// Default admin user as specified
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  name: 'Nitin Ghatikar',
  email: 'nitin.ghatikar@toasttab.com',
  password: 'Apple@123',
  roles: ['admin', 'user', 'approver'],
  approvalLimit: 10000000,
  status: 'active',
  createdAt: new Date().toISOString()
}

// Default approval matrix
const DEFAULT_APPROVAL_MATRIX: ApprovalMatrixEntry[] = [
  {
    id: 'matrix-1',
    minExposure: 0,
    maxExposure: 200000,
    approverId: 'auto',
    order: 1
  },
  {
    id: 'matrix-2',
    minExposure: 200001,
    maxExposure: 10000000,
    approverId: 'admin-1',
    order: 2
  }
]

const getInitialState = (): AppState => ({
  users: [DEFAULT_ADMIN],
  cases: [],
  auditTrail: [],
  documents: [],
  approvalMatrix: DEFAULT_APPROVAL_MATRIX,
  chatMessages: [],
  notifications: [],
  currentUserId: null
})

export const storage = {
  getState(): AppState {
    if (typeof window === 'undefined') {
      return getInitialState()
    }
    
    // Use cache if valid
    const now = Date.now()
    if (cachedState && (now - cacheTimestamp) < CACHE_TTL) {
      return cachedState
    }
    
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        const initial = getInitialState()
        this.setState(initial)
        return initial
      }
      cachedState = JSON.parse(data)
      cacheTimestamp = now
      return cachedState
    } catch {
      return getInitialState()
    }
  },

  setState(state: AppState): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    // Update cache immediately
    cachedState = state
    cacheTimestamp = Date.now()
  },
  
  // Invalidate cache when needed
  invalidateCache(): void {
    cachedState = null
    cacheTimestamp = 0
  },
  
  // Batch update to avoid multiple localStorage writes
  batchUpdate(updateFn: (state: AppState) => void): void {
    const state = this.getState()
    updateFn(state)
    this.setState(state)
  },

  // User operations
  getUsers(): User[] {
    return this.getState().users
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id)
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
  },

  addUser(user: User): void {
    const state = this.getState()
    state.users.push(user)
    this.setState(state)
  },

  updateUser(user: User): void {
    const state = this.getState()
    const index = state.users.findIndex(u => u.id === user.id)
    if (index !== -1) {
      state.users[index] = user
      this.setState(state)
    }
  },

  deleteUser(id: string): void {
    const state = this.getState()
    state.users = state.users.filter(u => u.id !== id)
    this.setState(state)
  },

  // Authentication
  getCurrentUser(): User | null {
    const state = this.getState()
    if (!state.currentUserId) return null
    return this.getUserById(state.currentUserId) || null
  },

  setCurrentUser(userId: string | null): void {
    const state = this.getState()
    state.currentUserId = userId
    this.setState(state)
  },

  login(email: string, password: string): User | null {
    const user = this.getUserByEmail(email)
    if (user && user.password === password) {
      // Don't allow login for pending or inactive users
      if (user.status === 'pending' || user.status === 'inactive') {
        return null
      }
      this.setCurrentUser(user.id)
      return user
    }
    return null
  },

  setUsers(users: User[]): void {
    const state = this.getState()
    state.users = users
    this.setState(state)
  },

  logout(): void {
    this.setCurrentUser(null)
  },

  // Case operations
  getCases(): Case[] {
    return this.getState().cases
  },

  getCaseById(id: string): Case | undefined {
    return this.getCases().find(c => c.id === id)
  },

  getCasesByStatus(status: Case['status']): Case[] {
    return this.getCases().filter(c => c.status === status)
  },

  getCasesForApprover(approverId: string): Case[] {
    return this.getCases().filter(c => 
      c.assignedApproverId === approverId && 
      (c.status === 'pending_review' || c.status === 'revision_requested')
    )
  },

  getApprovedCases(): Case[] {
    return this.getCases().filter(c => 
      c.status === 'approved' || c.status === 'auto_approved'
    )
  },

  addCase(caseData: Case): void {
    const state = this.getState()
    state.cases.push(caseData)
    this.setState(state)
  },

  updateCase(caseData: Case): void {
    const state = this.getState()
    const index = state.cases.findIndex(c => c.id === caseData.id)
    if (index !== -1) {
      state.cases[index] = caseData
      this.setState(state)
    }
  },

  generateCaseNumber(): string {
    const cases = this.getCases()
    const nextNum = cases.length + 1
    return `TRU-${new Date().getFullYear()}-${String(nextNum).padStart(5, '0')}`
  },

  // Audit Trail operations
  getAuditTrail(): AuditEntry[] {
    return this.getState().auditTrail
  },

  getAuditTrailForCase(caseId: string): AuditEntry[] {
    return this.getAuditTrail().filter(a => a.caseId === caseId)
  },

  addAuditEntry(entry: AuditEntry): void {
    const state = this.getState()
    state.auditTrail.push(entry)
    this.setState(state)
  },

  // Document operations
  getDocuments(): Document[] {
    return this.getState().documents
  },

  getDocumentsForCase(caseId: string): Document[] {
    return this.getDocuments().filter(d => d.caseId === caseId)
  },

  addDocument(doc: Document): void {
    const state = this.getState()
    state.documents.push(doc)
    this.setState(state)
  },

  deleteDocument(id: string): void {
    const state = this.getState()
    state.documents = state.documents.filter(d => d.id !== id)
    this.setState(state)
  },

  // Approval Matrix operations
  getApprovalMatrix(): ApprovalMatrixEntry[] {
    return this.getState().approvalMatrix
  },

  setApprovalMatrix(matrix: ApprovalMatrixEntry[]): void {
    const state = this.getState()
    state.approvalMatrix = matrix
    this.setState(state)
  },

  getApproverForExposure(exposure: number): string {
    const matrix = this.getApprovalMatrix()
    const sorted = [...matrix].sort((a, b) => a.order - b.order)
    for (const entry of sorted) {
      if (exposure >= entry.minExposure && exposure <= entry.maxExposure) {
        return entry.approverId
      }
    }
    // Default to highest approver if no match
    return sorted[sorted.length - 1]?.approverId || 'admin-1'
  },

  // Chat operations
  getChatMessages(): ChatMessage[] {
    return this.getState().chatMessages || []
  },

  getChatMessagesForCase(caseId: string): ChatMessage[] {
    return this.getChatMessages().filter(m => m.caseId === caseId)
  },

  addChatMessage(message: ChatMessage): void {
    const state = this.getState()
    if (!state.chatMessages) state.chatMessages = []
    state.chatMessages.push(message)
    this.setState(state)
  },

  markChatMessagesAsRead(caseId: string, userId: string): void {
    const state = this.getState()
    if (!state.chatMessages) return
    state.chatMessages = state.chatMessages.map(m => {
      if (m.caseId === caseId && m.senderId !== userId && !m.readBy.includes(userId)) {
        return { ...m, readBy: [...m.readBy, userId] }
      }
      return m
    })
    this.setState(state)
  },

  getUnreadMessageCount(caseId: string, userId: string): number {
    return this.getChatMessagesForCase(caseId).filter(
      m => m.senderId !== userId && !m.readBy.includes(userId)
    ).length
  },

  // Notification operations
  getNotifications(): Notification[] {
    return this.getState().notifications || []
  },

  getNotificationsForUser(userId: string): Notification[] {
    return this.getNotifications().filter(n => n.userId === userId)
  },

  getUnreadNotificationsForUser(userId: string): Notification[] {
    return this.getNotificationsForUser(userId).filter(n => !n.isRead)
  },

  addNotification(notification: Notification): void {
    const state = this.getState()
    if (!state.notifications) state.notifications = []
    state.notifications.push(notification)
    this.setState(state)
  },

  markNotificationAsRead(notificationId: string): void {
    const state = this.getState()
    if (!state.notifications) return
    state.notifications = state.notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    )
    this.setState(state)
  },

  markAllNotificationsAsRead(userId: string): void {
    const state = this.getState()
    if (!state.notifications) return
    state.notifications = state.notifications.map(n =>
      n.userId === userId ? { ...n, isRead: true } : n
    )
    this.setState(state)
  }
}

// Helper to generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
