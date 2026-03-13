'use client'

import { useState, useEffect, useRef } from 'react'
import { storage, generateId } from '@/lib/storage'
import { ChatMessage, Notification, User } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Users } from 'lucide-react'

interface ChatterProps {
  caseId: string
  caseName?: string
}

export function Chatter({ caseId, caseName }: ChatterProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    loadMessages()
    loadUsers()
    // Mark messages as read when opening chat
    if (user) {
      storage.markChatMessagesAsRead(caseId, user.id)
    }
  }, [caseId, user])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = () => {
    const chatMessages = storage.getChatMessagesForCase(caseId)
    setMessages(chatMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ))
  }

  const loadUsers = () => {
    setUsers(storage.getUsers())
  }

  const handleSendMessage = () => {
    if (!user || !newMessage.trim()) return

    setIsSending(true)

    const message: ChatMessage = {
      id: generateId(),
      caseId,
      senderId: user.id,
      senderName: user.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      readBy: [user.id]
    }

    storage.addChatMessage(message)

    // Send notification to all other users involved with this case
    const caseData = storage.getCaseById(caseId)
    if (caseData) {
      const usersToNotify = new Set<string>()
      
      // Add case creator
      if (caseData.createdBy !== user.id) {
        usersToNotify.add(caseData.createdBy)
      }
      
      // Add assigned approver
      if (caseData.assignedApproverId && caseData.assignedApproverId !== user.id) {
        usersToNotify.add(caseData.assignedApproverId)
      }

      // Add all admins and approvers
      const allUsers = storage.getUsers()
      allUsers.forEach(u => {
        if (u.id !== user.id && (u.roles.includes('admin') || u.roles.includes('approver'))) {
          usersToNotify.add(u.id)
        }
      })

      // Create notifications
      usersToNotify.forEach(userId => {
        const notification: Notification = {
          id: generateId(),
          userId,
          type: 'chat',
          title: `New message on ${caseData.caseNumber}`,
          message: `${user.name}: ${newMessage.trim().substring(0, 50)}${newMessage.trim().length > 50 ? '...' : ''}`,
          caseId,
          timestamp: new Date().toISOString(),
          isRead: false
        }
        storage.addNotification(notification)
      })
    }

    setNewMessage('')
    loadMessages()
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500'
    ]
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (!user) return null

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Chatter
        </CardTitle>
        {caseName && (
          <p className="text-xs text-muted-foreground">{caseName}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start the conversation</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === user.id
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={`h-8 w-8 ${getUserColor(msg.senderId)}`}>
                      <AvatarFallback className="text-xs text-white">
                        {getInitials(msg.senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Notification Bell Component for the sidebar/header
export function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      const unread = storage.getUnreadNotificationsForUser(user.id)
      setUnreadCount(unread.length)
    }
  }, [user])

  if (!user || unreadCount === 0) return null

  return (
    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  )
}
