'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { storage, generateId } from '@/lib/storage'
import { User, UserRole } from '@/lib/types'
import { formatCurrency } from '@/lib/exposure'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { toast } from 'sonner'
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit,
  AlertTriangle,
  Shield,
  UserCheck
} from 'lucide-react'

export default function UserManagementPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: [] as UserRole[],
    approvalLimit: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setUsers(storage.getUsers())
  }

  const openAddDialog = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      roles: ['user'],
      approvalLimit: ''
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles,
      approvalLimit: user.approvalLimit?.toString() || ''
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in name and email')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }

    if (formData.roles.length === 0) {
      toast.error('Please select at least one role')
      return
    }

    // Check if email already exists (for new users)
    if (!editingUser) {
      const existing = storage.getUserByEmail(formData.email)
      if (existing) {
        toast.error('A user with this email already exists')
        return
      }
    }

    if (editingUser) {
      const updatedUser: User = {
        ...editingUser,
        name: formData.name,
        email: formData.email,
        password: formData.password || editingUser.password,
        roles: formData.roles,
        approvalLimit: formData.approvalLimit ? parseFloat(formData.approvalLimit) : undefined
      }
      storage.updateUser(updatedUser)
      toast.success('User updated')
    } else {
      const newUser: User = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
        approvalLimit: formData.approvalLimit ? parseFloat(formData.approvalLimit) : undefined,
        createdAt: new Date().toISOString()
      }
      storage.addUser(newUser)
      toast.success('User created')
    }

    setIsDialogOpen(false)
    loadUsers()
  }

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    
    if (user.email === 'nitin.ghatikar@toasttab.com') {
      toast.error('Cannot delete the primary admin account')
      return
    }

    storage.deleteUser(user.id)
    toast.success('User deleted')
    loadUsers()
  }

  const toggleRole = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approvers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('approver')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('admin')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Approval Limit</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(role => (
                        <Badge 
                          key={role} 
                          variant={role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {user.approvalLimit ? formatCurrency(user.approvalLimit) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="text-destructive hover:text-destructive"
                        disabled={user.id === currentUser?.id || user.email === 'nitin.ghatikar@toasttab.com'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and roles' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@toasttab.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={editingUser ? '••••••••' : 'Enter password'}
              />
            </div>
            <div className="space-y-2">
              <Label>Roles *</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="role-user"
                    checked={formData.roles.includes('user')}
                    onCheckedChange={() => toggleRole('user')}
                  />
                  <label htmlFor="role-user" className="text-sm">User</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="role-approver"
                    checked={formData.roles.includes('approver')}
                    onCheckedChange={() => toggleRole('approver')}
                  />
                  <label htmlFor="role-approver" className="text-sm">Approver</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="role-admin"
                    checked={formData.roles.includes('admin')}
                    onCheckedChange={() => toggleRole('admin')}
                  />
                  <label htmlFor="role-admin" className="text-sm">Admin</label>
                </div>
              </div>
            </div>
            {formData.roles.includes('approver') && (
              <div className="space-y-2">
                <Label htmlFor="approvalLimit">Approval Limit ($)</Label>
                <Input
                  id="approvalLimit"
                  type="number"
                  min="0"
                  value={formData.approvalLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalLimit: e.target.value }))}
                  placeholder="500000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum exposure amount this approver can approve
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
