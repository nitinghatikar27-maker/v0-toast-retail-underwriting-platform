'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { User, ApprovalMatrixEntry, UserRole, UserStatus } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Settings, 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  Save,
  AlertTriangle,
  Users,
  Check,
  X,
  UserPlus
} from 'lucide-react'

export default function SettingsPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const [approvalMatrix, setApprovalMatrix] = useState<ApprovalMatrixEntry[]>([])
  const [approvers, setApprovers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [editingEntry, setEditingEntry] = useState<ApprovalMatrixEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    minExposure: '',
    maxExposure: '',
    approverId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setApprovalMatrix(storage.getApprovalMatrix())
    const users = storage.getUsers()
    setAllUsers(users)
    setApprovers(users.filter(u => u.roles.includes('approver')))
  }

  const pendingUsers = allUsers.filter(u => u.status === 'pending')
  const activeUsers = allUsers.filter(u => u.status !== 'pending')

  const handleApproveUser = (userId: string) => {
    const users = storage.getUsers()
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'active' as UserStatus }
      }
      return u
    })
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('User approved successfully')
  }

  const handleRejectUser = (userId: string) => {
    const users = storage.getUsers()
    const updatedUsers = users.filter(u => u.id !== userId)
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('User rejected and removed')
  }

  const handleUpdateUserRole = (userId: string, role: UserRole, add: boolean) => {
    const users = storage.getUsers()
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const newRoles = add 
          ? [...new Set([...u.roles, role])]
          : u.roles.filter(r => r !== role)
        return { ...u, roles: newRoles }
      }
      return u
    })
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('User roles updated')
  }

  const handleUpdateApprovalLimit = (userId: string, limit: number) => {
    const users = storage.getUsers()
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, approvalLimit: limit }
      }
      return u
    })
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('Approval limit updated')
  }

  const handleDeactivateUser = (userId: string) => {
    const users = storage.getUsers()
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'inactive' as UserStatus }
      }
      return u
    })
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('User deactivated')
  }

  const handleActivateUser = (userId: string) => {
    const users = storage.getUsers()
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'active' as UserStatus }
      }
      return u
    })
    storage.setUsers(updatedUsers)
    loadData()
    toast.success('User activated')
  }

  const handleSaveMatrix = () => {
    storage.setApprovalMatrix(approvalMatrix)
    toast.success('Approval matrix saved')
  }

  const handleAddEntry = () => {
    if (!newEntry.minExposure || !newEntry.maxExposure || !newEntry.approverId) {
      toast.error('Please fill all fields')
      return
    }

    const entry: ApprovalMatrixEntry = {
      id: generateId(),
      minExposure: parseFloat(newEntry.minExposure),
      maxExposure: parseFloat(newEntry.maxExposure),
      approverId: newEntry.approverId,
      order: approvalMatrix.length + 1
    }

    const updated = [...approvalMatrix, entry].sort((a, b) => a.minExposure - b.minExposure)
    updated.forEach((e, i) => e.order = i + 1)
    
    setApprovalMatrix(updated)
    storage.setApprovalMatrix(updated)
    
    setNewEntry({ minExposure: '', maxExposure: '', approverId: '' })
    setIsDialogOpen(false)
    toast.success('Matrix entry added')
  }

  const handleDeleteEntry = (id: string) => {
    const updated = approvalMatrix.filter(e => e.id !== id)
    updated.forEach((e, i) => e.order = i + 1)
    
    setApprovalMatrix(updated)
    storage.setApprovalMatrix(updated)
    toast.success('Matrix entry deleted')
  }

  const handleUpdateEntry = (id: string, field: keyof ApprovalMatrixEntry, value: string | number) => {
    const updated = approvalMatrix.map(entry => {
      if (entry.id === id) {
        return { ...entry, [field]: value }
      }
      return entry
    })
    setApprovalMatrix(updated)
  }

  const getApproverName = (approverId: string) => {
    if (approverId === 'auto') return 'Auto Approved'
    const approver = approvers.find(a => a.id === approverId)
    return approver?.name || 'Unknown'
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <p className="text-muted-foreground">You do not have admin permissions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure approval matrix and system settings</p>
      </div>

      <Tabs defaultValue="approval-matrix">
        <TabsList>
          <TabsTrigger value="user-management">
            <Users className="h-4 w-4 mr-2" />
            User Management
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approval-matrix">
            <Shield className="h-4 w-4 mr-2" />
            Approval Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-management" className="space-y-6">
          {/* Pending Access Requests */}
          {pendingUsers.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <UserPlus className="h-5 w-5" />
                  Pending Access Requests ({pendingUsers.length})
                </CardTitle>
                <CardDescription>
                  Users waiting for approval to access the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                              className="bg-success hover:bg-success/90"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* All Users */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Approval Limit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No active users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(['admin', 'user', 'approver'] as UserRole[]).map(role => (
                              <Badge 
                                key={role}
                                variant={user.roles.includes(role) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => handleUpdateUserRole(user.id, role, !user.roles.includes(role))}
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.roles.includes('approver') && (
                            <Input
                              type="number"
                              min="0"
                              className="w-32"
                              placeholder="No limit"
                              value={user.approvalLimit || ''}
                              onChange={(e) => handleUpdateApprovalLimit(user.id, parseFloat(e.target.value) || 0)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id !== currentUser?.id && (
                            user.status === 'inactive' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                Activate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                Deactivate
                              </Button>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval-matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approval Matrix</CardTitle>
                  <CardDescription>
                    Define exposure thresholds and assigned approvers
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveMatrix} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  <strong>How it works:</strong> When a case is submitted, the system checks the total exposure against this matrix. 
                  Cases with exposure {"<="} $200K are auto-approved. Cases above that threshold are assigned to the 
                  appropriate approver based on their approval limit.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Min Exposure</TableHead>
                    <TableHead>Max Exposure</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalMatrix.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No entries configured. Add an entry to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvalMatrix.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{entry.order}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={entry.minExposure}
                            onChange={(e) => handleUpdateEntry(entry.id, 'minExposure', parseFloat(e.target.value) || 0)}
                            className="w-32 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={entry.maxExposure}
                            onChange={(e) => handleUpdateEntry(entry.id, 'maxExposure', parseFloat(e.target.value) || 0)}
                            className="w-32 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.approverId}
                            onValueChange={(value) => handleUpdateEntry(entry.id, 'approverId', value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto Approved</SelectItem>
                              {approvers.map(approver => (
                                <SelectItem key={approver.id} value={approver.id}>
                                  {approver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Current Approvers */}
          <Card>
            <CardHeader>
              <CardTitle>Current Approvers</CardTitle>
              <CardDescription>Users with approver role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No approvers configured. Add approvers from User Management.
                  </p>
                ) : (
                  approvers.map(approver => (
                    <div 
                      key={approver.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{approver.name}</p>
                        <p className="text-sm text-muted-foreground">{approver.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {approver.approvalLimit && (
                          <Badge variant="outline">
                            Limit: {formatCurrency(approver.approvalLimit)}
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          {approver.roles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Matrix Entry</DialogTitle>
            <DialogDescription>
              Define a new exposure threshold and approver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minExposure">Min Exposure ($)</Label>
                <Input
                  id="minExposure"
                  type="number"
                  min="0"
                  value={newEntry.minExposure}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, minExposure: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxExposure">Max Exposure ($)</Label>
                <Input
                  id="maxExposure"
                  type="number"
                  min="0"
                  value={newEntry.maxExposure}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, maxExposure: e.target.value }))}
                  placeholder="200000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approver">Approver</Label>
              <Select
                value={newEntry.approverId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, approverId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Approved</SelectItem>
                  {approvers.map(approver => (
                    <SelectItem key={approver.id} value={approver.id}>
                      {approver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEntry}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
