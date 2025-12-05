"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { 
  MessageSquare, 
  Inbox, 
  Send, 
  Mail,
  MailOpen,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  subject: string | null
  content: string
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  sender: {
    id: string
    name: string
    role: string
    avatar: string | null
  }
  receiver: {
    id: string
    name: string
    role: string
    avatar: string | null
  }
}

interface MessagesClientProps {
  messages: Message[]
  type: "inbox" | "sent"
}

const formatRole = (role: string) => {
  return role.replace("_", " ").split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export function MessagesClient({ messages, type }: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get("subdomain")

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams()
    if (subdomain) params.set("subdomain", subdomain)
    params.set("type", value)
    router.push(`/student/messages?${params.toString()}`)
  }

  const unreadCount = messages.filter(m => !m.isRead).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">
          View messages from teachers and administrators.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="neu-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl neu flex items-center justify-center">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">
                  {type === "inbox" ? "Received Messages" : "Sent Messages"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {type === "inbox" && (
          <Card className="neu-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Messages */}
      <Tabs value={type} onValueChange={handleTabChange}>
        <TabsList className="neu-sm p-1">
          <TabsTrigger value="inbox" className="rounded-xl data-[state=active]:neu-inset-sm">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-xl data-[state=active]:neu-inset-sm">
            <Send className="h-4 w-4 mr-2" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value={type} className="mt-4">
          <Card className="neu-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {type === "inbox" ? "Inbox" : "Sent Messages"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const person = type === "inbox" ? message.sender : message.receiver
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "p-4 rounded-xl transition-all duration-300 cursor-pointer",
                          message.isRead || type === "sent" 
                            ? "neu-inset-sm hover:neu-sm" 
                            : "neu-sm hover:neu bg-blue-50/50 dark:bg-blue-900/10"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={person.avatar || undefined} />
                            <AvatarFallback>
                              {person.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold truncate">
                                  {person.name}
                                </span>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {formatRole(person.role)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {type === "inbox" && !message.isRead && (
                                  <Mail className="h-4 w-4 text-blue-500" />
                                )}
                                {type === "inbox" && message.isRead && (
                                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            {message.subject && (
                              <p className="font-medium mt-1 truncate">
                                {message.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-1">No messages</h3>
                  <p className="text-sm text-muted-foreground">
                    {type === "inbox" 
                      ? "You haven't received any messages yet." 
                      : "You haven't sent any messages yet."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
