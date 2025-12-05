"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  MessageSquare, 
  Inbox,
  Send,
  Star,
  Paperclip,
  ChevronLeft
} from "lucide-react"

interface Message {
  id: string
  subject: string | null
  content: string
  isRead: boolean
  createdAt: Date
  sender: {
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
  }
}

interface MessagesClientProps {
  messages: Message[]
}

export function MessagesClient({ messages }: MessagesClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  const unreadCount = messages.filter(m => !m.isRead).length

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      (message.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${message.sender.firstName} ${message.sender.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread messages` : "All messages read"}
          </p>
        </div>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className={`glass-card neu-flat ${selectedMessage ? "hidden lg:block" : ""} lg:col-span-1`}>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {messages.length === 0 ? "No messages yet" : "No messages found"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedMessage?.id === message.id ? "bg-primary/5 border-l-2 border-primary" : ""
                      } ${!message.isRead ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.sender.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(message.sender.firstName, message.sender.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm truncate ${!message.isRead ? "font-semibold" : ""}`}>
                              {message.sender.firstName} {message.sender.lastName}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${!message.isRead ? "font-medium" : "text-muted-foreground"}`}>
                            {message.subject || "(No subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {message.content.substring(0, 60)}...
                          </p>
                        </div>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className={`glass-card neu-flat ${selectedMessage ? "" : "hidden lg:flex lg:items-center lg:justify-center"} lg:col-span-2`}>
          {selectedMessage ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMessage.sender.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedMessage.sender.firstName, selectedMessage.sender.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                    </CardTitle>
                    <CardDescription>{selectedMessage.sender.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedMessage.subject || "(No subject)"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMessage.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">
                      {selectedMessage.content}
                    </p>
                  </div>

                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <Button>
                        <Send className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="outline">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Forward
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="text-center p-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Select a message</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a message from the list to view its contents
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Starred</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
