'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from './types'
import { storage } from './storage'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => User | null
  logout: () => void
  isAdmin: boolean
  isUser: boolean
  isApprover: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = storage.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = (email: string, password: string): User | null => {
    const loggedInUser = storage.login(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
    }
    return loggedInUser
  }

  const logout = () => {
    storage.logout()
    setUser(null)
  }

  const isAdmin = user?.roles.includes('admin') ?? false
  const isUser = user?.roles.includes('user') ?? false
  const isApprover = user?.roles.includes('approver') ?? false

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isUser, isApprover }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
