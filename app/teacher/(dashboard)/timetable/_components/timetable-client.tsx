"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react"

interface Period {
  id: string
  name: string
  startTime: string
  endTime: string
  order: number
}

interface TimetableEntry {
  id: string
  dayOfWeek: number
  room: string | null
  period: {
    id: string
    name: string
    startTime: string
    endTime: string
    order: number
  }
  subject: {
    id: string
    name: string
    code: string
  } | null
  class: {
    id: string
    name: string
    section: string | null
    grade: {
      name: string
    }
  }
}

interface TimetableClientProps {
  periods: Period[]
  timetable: TimetableEntry[]
}

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
]

export function TimetableClient({ periods, timetable }: TimetableClientProps) {
  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order)
  const today = new Date().getDay()
  
  // Get unique days that have classes
  const activeDays = [...new Set(timetable.map(t => t.dayOfWeek))].sort((a, b) => {
    // Sort with Monday first, Sunday last
    const orderA = a === 0 ? 7 : a
    const orderB = b === 0 ? 7 : b
    return orderA - orderB
  })

  const getEntryForSlot = (dayOfWeek: number, periodId: string) => {
    return timetable.find(t => t.dayOfWeek === dayOfWeek && t.period.id === periodId)
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const getTodayClasses = () => {
    return timetable
      .filter(t => t.dayOfWeek === today)
      .sort((a, b) => a.period.order - b.period.order)
  }

  const todayClasses = getTodayClasses()
  const totalPeriodsToday = todayClasses.length
  const totalPeriodsWeek = timetable.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Timetable</h1>
          <p className="text-muted-foreground">Your weekly teaching schedule</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPeriodsWeek}</p>
                <p className="text-sm text-muted-foreground">Periods/Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPeriodsToday}</p>
                <p className="text-sm text-muted-foreground">Classes Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card neu-flat">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDays.length}</p>
                <p className="text-sm text-muted-foreground">Teaching Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      {todayClasses.length > 0 && (
        <Card className="glass-card neu-flat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today&apos;s Schedule ({DAYS.find(d => d.value === today)?.label})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 neu-inset">
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground">{entry.period.name}</p>
                    <p className="text-sm font-medium">
                      {formatTime(entry.period.startTime)} - {formatTime(entry.period.endTime)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{entry.subject?.name || "No Subject"}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.class.grade.name} - {entry.class.name}
                      {entry.class.section && ` (${entry.class.section})`}
                    </p>
                  </div>
                  {entry.room && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {entry.room}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Timetable Grid */}
      <Card className="glass-card neu-flat">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No timetable entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-medium text-muted-foreground border-b">
                      Period
                    </th>
                    {activeDays.map(day => {
                      const dayInfo = DAYS.find(d => d.value === day)
                      return (
                        <th 
                          key={day} 
                          className={`p-3 text-center font-medium border-b min-w-[140px] ${
                            day === today ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {dayInfo?.label}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.map((period) => (
                    <tr key={period.id} className="border-b border-muted/30">
                      <td className="p-3">
                        <div className="text-sm font-medium">{period.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(period.startTime)} - {formatTime(period.endTime)}
                        </div>
                      </td>
                      {activeDays.map(day => {
                        const entry = getEntryForSlot(day, period.id)
                        return (
                          <td 
                            key={`${day}-${period.id}`} 
                            className={`p-2 ${day === today ? "bg-primary/5" : ""}`}
                          >
                            {entry ? (
                              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-center">
                                <p className="text-sm font-semibold text-primary">
                                  {entry.subject?.code || "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.class.name}
                                </p>
                                {entry.room && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {entry.room}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="p-2 text-center text-muted-foreground/50">
                                -
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
