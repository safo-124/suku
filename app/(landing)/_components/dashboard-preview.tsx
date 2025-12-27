"use client"

import { useState } from "react"
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  TrendingUp,
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Clock,
  BookOpen,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Search,
  Filter,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react"

type Tab = "dashboard" | "students" | "teachers" | "classes" | "timetable" | "reports"

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "teachers", label: "Teachers", icon: UserCheck },
  { id: "classes", label: "Classes", icon: BookOpen },
  { id: "timetable", label: "Timetable", icon: Calendar },
  { id: "reports", label: "Reports", icon: FileText },
]

const students = [
  { id: 1, name: "Kofi Mensah", class: "Grade 10A", status: "present", avatar: "KM", grade: "A" },
  { id: 2, name: "Ama Asante", class: "Grade 10A", status: "present", avatar: "AA", grade: "A+" },
  { id: 3, name: "Yaw Boateng", class: "Grade 10B", status: "absent", avatar: "YB", grade: "B+" },
  { id: 4, name: "Efua Darko", class: "Grade 10A", status: "present", avatar: "ED", grade: "A-" },
  { id: 5, name: "Kwame Owusu", class: "Grade 10C", status: "present", avatar: "KO", grade: "B" },
]

const teachers = [
  { id: 1, name: "Mr. Asante", subject: "Mathematics", classes: 4, avatar: "MA", status: "active" },
  { id: 2, name: "Mrs. Boateng", subject: "English", classes: 5, avatar: "MB", status: "active" },
  { id: 3, name: "Mr. Darko", subject: "Science", classes: 3, avatar: "MD", status: "on-leave" },
  { id: 4, name: "Ms. Owusu", subject: "History", classes: 4, avatar: "MO", status: "active" },
]

const classes = [
  { id: 1, name: "Grade 10A", students: 32, teacher: "Mr. Asante", room: "Room 101", attendance: 94 },
  { id: 2, name: "Grade 10B", students: 30, teacher: "Mrs. Boateng", room: "Room 102", attendance: 97 },
  { id: 3, name: "Grade 10C", students: 28, teacher: "Mr. Darko", room: "Room 103", attendance: 91 },
  { id: 4, name: "Grade 11A", students: 35, teacher: "Ms. Owusu", room: "Room 201", attendance: 96 },
]

const timetableData = [
  { time: "08:00", mon: "Math", tue: "English", wed: "Science", thu: "History", fri: "Math" },
  { time: "09:00", mon: "English", tue: "Math", wed: "History", thu: "Science", fri: "English" },
  { time: "10:00", mon: "Break", tue: "Break", wed: "Break", thu: "Break", fri: "Break" },
  { time: "10:30", mon: "Science", tue: "History", wed: "Math", thu: "English", fri: "Science" },
  { time: "11:30", mon: "History", tue: "Science", wed: "English", thu: "Math", fri: "History" },
]

const reports = [
  { id: 1, name: "Term 1 Academic Report", date: "Dec 15, 2024", type: "Academic", status: "ready" },
  { id: 2, name: "Attendance Summary", date: "Dec 20, 2024", type: "Attendance", status: "ready" },
  { id: 3, name: "Fee Collection Report", date: "Dec 22, 2024", type: "Financial", status: "pending" },
  { id: 4, name: "Teacher Performance", date: "Dec 25, 2024", type: "Staff", status: "ready" },
]

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")

  return (
    <div className="neu-lg rounded-2xl p-2 max-w-5xl mx-auto">
      <div className="rounded-xl bg-background border border-border overflow-hidden">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Sukuu Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Search className="w-3 h-3" />
              Search...
            </div>
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center relative">
              <Bell className="w-3 h-3 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
              KM
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col w-44 border-r border-border p-3 gap-1 bg-muted/20 min-h-[400px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            
            <div className="mt-auto pt-4 border-t border-border">
              <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs font-medium text-green-600">Pro Plan</p>
                <p className="text-xs text-muted-foreground">Active until Jan 2025</p>
              </div>
            </div>
          </div>
          
          {/* Mobile Tab Bar */}
          <div className="md:hidden flex items-center gap-1 p-2 border-b border-border overflow-x-auto bg-muted/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6 bg-muted/10 min-h-[400px]">
            {activeTab === "dashboard" && <DashboardContent />}
            {activeTab === "students" && <StudentsContent />}
            {activeTab === "teachers" && <TeachersContent />}
            {activeTab === "classes" && <ClassesContent />}
            {activeTab === "timetable" && <TimetableContent />}
            {activeTab === "reports" && <ReportsContent />}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  return (
    <>
      {/* Welcome Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Welcome back, Admin 👋</h3>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening at Accra Academy</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="neu-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-green-500 font-medium">+12%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">1,247</p>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </div>
        <div className="neu-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-green-500 font-medium">+3</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">86</p>
          <p className="text-xs text-muted-foreground">Teachers</p>
        </div>
        <div className="neu-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <GraduationCap className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">32</p>
          <p className="text-xs text-muted-foreground">Classes</p>
        </div>
        <div className="neu-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-green-500 font-medium">↑ 2%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">96.8%</p>
          <p className="text-xs text-muted-foreground">Attendance</p>
        </div>
      </div>
      
      {/* Charts & Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 neu-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-sm">Attendance Overview</h4>
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary cursor-pointer"
                  style={{ height: `${[85, 92, 88, 96, 94][i]}%` }}
                />
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="neu-sm rounded-xl p-4">
          <h4 className="font-medium text-sm mb-3">Recent Activity</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium">New student enrolled</p>
                <p className="text-xs text-muted-foreground">2 min ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium">Grade submitted</p>
                <p className="text-xs text-muted-foreground">15 min ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <div>
                <p className="text-xs font-medium">Fee payment received</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function StudentsContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Students</h3>
          <p className="text-sm text-muted-foreground">Manage student records</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          + Add Student
        </button>
      </div>
      
      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Search students...</span>
        </div>
        <button className="px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground">
          <Filter className="w-4 h-4" />
        </button>
      </div>
      
      {/* Students Table */}
      <div className="neu-sm rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
          <div className="col-span-5">Student</div>
          <div className="col-span-3">Class</div>
          <div className="col-span-2">Grade</div>
          <div className="col-span-2">Status</div>
        </div>
        {students.map((student) => (
          <div key={student.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
            <div className="col-span-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {student.avatar}
              </div>
              <span className="text-sm font-medium truncate">{student.name}</span>
            </div>
            <div className="col-span-3 text-xs text-muted-foreground">{student.class}</div>
            <div className="col-span-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-xs font-medium">
                {student.grade}
              </span>
            </div>
            <div className="col-span-2">
              {student.status === "present" ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" /> Present
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <XCircle className="w-3 h-3" /> Absent
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>Showing 5 of 1,247 students</span>
        <div className="flex gap-1">
          <button className="px-2 py-1 rounded bg-muted/50">1</button>
          <button className="px-2 py-1 rounded hover:bg-muted/50">2</button>
          <button className="px-2 py-1 rounded hover:bg-muted/50">3</button>
        </div>
      </div>
    </>
  )
}

function TeachersContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Teachers</h3>
          <p className="text-sm text-muted-foreground">Staff management</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          + Add Teacher
        </button>
      </div>
      
      {/* Teacher Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="neu-sm rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {teacher.avatar}
                </div>
                <div>
                  <p className="font-medium text-sm">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="w-3 h-3" />
                  {teacher.classes} classes
                </span>
                <span className={`px-2 py-0.5 rounded-full ${
                  teacher.status === "active" 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-yellow-500/10 text-yellow-600"
                }`}>
                  {teacher.status === "active" ? "Active" : "On Leave"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted">
                <Mail className="w-3 h-3" /> Email
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted">
                <Phone className="w-3 h-3" /> Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ClassesContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Classes</h3>
          <p className="text-sm text-muted-foreground">Class management & assignments</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          + New Class
        </button>
      </div>
      
      {/* Class Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="neu-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">32</p>
          <p className="text-xs text-muted-foreground">Total Classes</p>
        </div>
        <div className="neu-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-500">28</p>
          <p className="text-xs text-muted-foreground">Active Today</p>
        </div>
        <div className="neu-sm rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">94.5%</p>
          <p className="text-xs text-muted-foreground">Avg Attendance</p>
        </div>
      </div>
      
      {/* Class List */}
      <div className="space-y-3">
        {classes.map((cls) => (
          <div key={cls.id} className="neu-sm rounded-xl p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{cls.name}</p>
                <p className="text-xs text-muted-foreground">{cls.teacher} • {cls.room}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{cls.students} students</p>
                <p className="text-xs text-green-500">{cls.attendance}% attendance</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function TimetableContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Timetable</h3>
          <p className="text-sm text-muted-foreground">Weekly schedule for Grade 10A</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs border-0">
            <option>Grade 10A</option>
            <option>Grade 10B</option>
            <option>Grade 10C</option>
          </select>
        </div>
      </div>
      
      {/* Current Class */}
      <div className="neu-sm rounded-xl p-4 mb-6 bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs text-primary font-medium">Currently in session</span>
        </div>
        <p className="font-medium">Mathematics</p>
        <p className="text-sm text-muted-foreground">Mr. Asante • Room 101 • 09:00 - 10:00</p>
      </div>
      
      {/* Timetable Grid */}
      <div className="neu-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Mon</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Tue</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Wed</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Thu</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Fri</th>
              </tr>
            </thead>
            <tbody>
              {timetableData.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-muted-foreground">{row.time}</td>
                  {['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => (
                    <td key={day} className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded ${
                        row[day as keyof typeof row] === "Break" 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {row[day as keyof typeof row]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function ReportsContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Reports</h3>
          <p className="text-sm text-muted-foreground">Analytics & generated reports</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          + Generate Report
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="neu-sm rounded-xl p-3 text-center">
          <Award className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold">85.2%</p>
          <p className="text-xs text-muted-foreground">Pass Rate</p>
        </div>
        <div className="neu-sm rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold">96.8%</p>
          <p className="text-xs text-muted-foreground">Attendance</p>
        </div>
        <div className="neu-sm rounded-xl p-3 text-center">
          <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold">92%</p>
          <p className="text-xs text-muted-foreground">Fee Collection</p>
        </div>
        <div className="neu-sm rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold">1:15</p>
          <p className="text-xs text-muted-foreground">Teacher Ratio</p>
        </div>
      </div>
      
      {/* Report List */}
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="neu-sm rounded-xl p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{report.name}</p>
                <p className="text-xs text-muted-foreground">{report.type} • {report.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                report.status === "ready"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-yellow-500/10 text-yellow-600"
              }`}>
                {report.status === "ready" ? "Ready" : "Pending"}
              </span>
              <button className="text-xs text-primary hover:underline">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
