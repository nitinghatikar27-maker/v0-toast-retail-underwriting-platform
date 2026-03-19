'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastLogo } from '@/components/toast-logo'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { storage, generateId } from '@/lib/storage'
import { User } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showRequestAccess, setShowRequestAccess] = useState(false)
  const [requestForm, setRequestForm] = useState({ name: '', email: '', password: '' })
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    // Check if user exists but is pending
    const existingUser = storage.getUserByEmail(email)
    if (existingUser && existingUser.status === 'pending') {
      toast.error('Your access request is pending approval. Please contact an administrator.')
      setIsLoggingIn(false)
      return
    }

    if (existingUser && existingUser.status === 'inactive') {
      toast.error('Your account has been deactivated. Please contact an administrator.')
      setIsLoggingIn(false)
      return
    }

    const loggedInUser = login(email, password)
    
    if (loggedInUser) {
      toast.success(`Welcome back, ${loggedInUser.name}!`)
      router.push('/dashboard')
    } else {
      toast.error('Invalid email or password')
    }
    
    setIsLoggingIn(false)
  }

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRequesting(true)

    // Check if email already exists
    const existing = storage.getUserByEmail(requestForm.email)
    if (existing) {
      if (existing.status === 'pending') {
        toast.error('An access request with this email is already pending')
      } else {
        toast.error('An account with this email already exists')
      }
      setIsRequesting(false)
      return
    }

    // Create new user with pending status
    const newUser: User = {
      id: generateId(),
      name: requestForm.name,
      email: requestForm.email,
      password: requestForm.password,
      roles: ['user'],
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    console.log('[v0] Creating new user:', newUser)
    storage.addUser(newUser)
    console.log('[v0] User added, all users now:', storage.getUsers())
    toast.success('Access request submitted! An administrator will review your request.')
    setShowRequestAccess(false)
    setRequestForm({ name: '', email: '', password: '' })
    setIsRequesting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </main>
    )
  }

  if (user) {
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ToastLogo className="h-12 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground text-balance text-center">
            Retail Underwriting Platform
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise Risk Management
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@toasttab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  'Signing in...'
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!showRequestAccess ? (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <button 
              onClick={() => setShowRequestAccess(true)}
              className="text-primary hover:underline font-medium"
            >
              Request Access
            </button>
          </p>
        ) : (
          <Card className="mt-6 border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Request Access
              </CardTitle>
              <CardDescription>
                Submit a request to get access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="req-name">Full Name</Label>
                  <Input
                    id="req-name"
                    type="text"
                    placeholder="John Doe"
                    value={requestForm.name}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-email">Email</Label>
                  <Input
                    id="req-email"
                    type="email"
                    placeholder="you@toasttab.com"
                    value={requestForm.email}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-password">Password</Label>
                  <Input
                    id="req-password"
                    type="password"
                    placeholder="Create a password"
                    value={requestForm.password}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRequestAccess(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isRequesting}
                  >
                    {isRequesting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
