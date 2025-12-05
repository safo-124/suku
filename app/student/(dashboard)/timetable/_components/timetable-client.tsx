"use client"

import { Calendar, Clock, User, MapPin, Coffee } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Period {
  id: string
  name: string
  startTime: string
  endTime: string
  isBreak: boolean
}

interface TimetableSlot {
  id: string
  periodId: string
  periodName: string
  startTime: string
  endTime: string
  isBreak: boolean
  subject: {
    id: string
    name: string
    code: string | null
  } | null
  teacher: string | null
  room: string | null
}

interface DayTimetable {
  day: number
  dayName: string
  slots: TimetableSlot[]
}

interface TimetableClientProps {
  periods: Period[]
  timetable: DayTimetable[]
  className: string | undefined
}

export function TimetableClient({
  periods,
  timetable,
  className,
}: TimetableClientProps) {
  // Get current day for default tab
  const today = new Date().getDay()
  const defaultDay = timetable.find(d => d.day === today)?.day.toString() || "1"
  
  // Filter out weekends if they have no slots
  const activeDays = timetable.filter(d => d.slots.length > 0 || (d.day >= 1 && d.day <= 5))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground mt-1">
          View your class schedule for {className || "your class"}.
        </p>
      </div>

      {/* Period Legend */}
      <Card className="neu-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Period Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm",
                  period.isBreak ? "neu-inset-sm bg-yellow-50 dark:bg-yellow-900/10" : "neu-sm"
                )}
              >
                <span className="font-medium">{period.name}</span>
                <span className="text-muted-foreground ml-2">
                  {period.startTime} - {period.endTime}
                </span>
                {period.isBreak && <Coffee className="h-3 w-3 inline ml-1 text-yellow-600" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Tabs */}
      {activeDays.length > 0 ? (
        <Tabs defaultValue={defaultDay} className="space-y-4">
          <TabsList className="neu-sm p-1 h-auto flex-wrap">
            {activeDays.map((day) => (
              <TabsTrigger
                key={day.day}
                value={day.day.toString()}
                className={cn(
                  "px-6 py-2 rounded-xl data-[state=active]:neu-inset-sm",
                  day.day === today && "ring-2 ring-foreground/20"
                )}
              >
                {day.dayName}
                {day.day === today && (
                  <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeDays.map((day) => (
            <TabsContent key={day.day} value={day.day.toString()} className="space-y-4">
              {day.slots.length > 0 ? (
                <div className="grid gap-3">
                  {day.slots.map((slot) => (
                    <Card 
                      key={slot.id} 
                      className={cn(
                        "neu-sm hover:neu transition-all duration-300",
                        slot.isBreak && "bg-yellow-50/50 dark:bg-yellow-900/10"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Time */}
                          <div className="w-24 text-center shrink-0">
                            <div className="h-12 w-12 rounded-xl neu mx-auto flex items-center justify-center mb-1">
                              {slot.isBreak ? (
                                <Coffee className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {slot.startTime}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {slot.endTime}
                            </p>
                          </div>

                          {/* Divider */}
                          <div className="h-16 w-px bg-border" />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {slot.isBreak ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-yellow-600">
                                  {slot.periodName}
                                </span>
                                <Badge variant="outline" className="border-yellow-200 text-yellow-600">
                                  Break
                                </Badge>
                              </div>
                            ) : slot.subject ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">
                                    {slot.subject.name}
                                  </h3>
                                  {slot.subject.code && (
                                    <Badge variant="secondary">{slot.subject.code}</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  {slot.teacher && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {slot.teacher}
                                    </span>
                                  )}
                                  {slot.room && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {slot.room}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-muted-foreground">
                                <span className="font-medium">{slot.periodName}</span>
                                <p className="text-sm">No subject assigned</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="neu-sm">
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold mb-1">No classes scheduled</h3>
                    <p className="text-sm text-muted-foreground">
                      No classes are scheduled for {day.dayName}.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="neu-sm">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-1">No timetable available</h3>
            <p className="text-sm text-muted-foreground">
              Your class timetable hasn&apos;t been set up yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
