# School Management System - Complete Architecture

A multi-tenant school management SaaS with subdomain per school, full academics, timetable generation (class/teacher/student views), online tests, attendance, promotion system, parent mobile app with FCM notifications, and fee management with invoicing.

## System Overview

### User Roles & Access

| Role | Platform | Access |
|------|----------|--------|
| **Super Admin** | Web | All schools, platform settings, billing |
| **School Admin** | Web | Full school access: settings, users, classes, reports |
| **Teacher** | Web | Own subjects + class teacher duties if assigned |
| **Student** | Web | Own results, assignments, timetable |
| **Parent** | Mobile App | Children's results, attendance, fees, messaging |

### Multi-Tenancy Architecture

- Subdomain per school: `springfield.yourdomain.com`, `riverside.yourdomain.com`
- Super Admin on main domain: `admin.yourdomain.com`
- Row-level isolation with `schoolId` on all tenant data
- `proxy.ts` extracts subdomain, validates school, sets `x-school-id` header

---

## Phase 1: Core System

### Step 1: Prisma Schema - Complete Data Model

#### School & Configuration
- `School` - id, name, slug (unique for subdomain), logo, address, phone, email, settings JSON, isActive
- `GradeScale` - schoolId, label (A, B, C), minScore, maxScore, gpa, isPassingGrade
- `PromotionRule` - schoolId, type (AVERAGE_ONLY | REQUIRED_SUBJECTS), threshold percentage, requiredSubjects relation

#### Academic Structure (Flexible)
- `AcademicYear` - schoolId, name ("2024-2025"), startDate, endDate, isCurrent, isArchived, promotionThreshold
- `AcademicPeriod` - academicYearId, name (custom: "Term 1", "Semester A", "Q1"), order, startDate, endDate

#### School Structure
- `Class` - schoolId, academicYearId, name ("Grade 5A"), gradeLevel (number for promotion), section, capacity, roomNumber, classTeacherId
- `Subject` - schoolId, name, code, description, isRequiredForPromotion
- `ClassSubject` - classId, subjectId, teacherId (who teaches this subject to this class)

#### People
- `User` - id, email, passwordHash, firstName, lastName, phone, avatar, role (SUPER_ADMIN | SCHOOL_ADMIN | TEACHER | STUDENT | PARENT), schoolId, isActive, emailVerified
- `TeacherProfile` - userId, employeeId, qualification, specialization, joinDate, departmentId
- `StudentProfile` - userId, studentId (admission number), dateOfBirth, gender, bloodGroup, address, admissionDate, classId, repeatCount
- `ParentProfile` - userId, occupation, relationship
- `ParentStudent` - parentId, studentId (many-to-many link)

#### Enrollment & Promotion
- `StudentEnrollment` - studentId, classId, academicYearId, status (ACTIVE | PROMOTED | REPEATED | WITHDRAWN | GRADUATED), promotedBy (AUTO | MANUAL), promotedByUserId, promotionNotes, enrolledAt

#### Timetable
- `Period` - schoolId, name ("Period 1", "Break"), startTime, endTime, order, isBreak
- `TimetableSlot` - classId, periodId, dayOfWeek (0-6), classSubjectId, teacherId, roomNumber

#### Attendance
- `Attendance` - studentId, classId, date, status (PRESENT | ABSENT | LATE | EXCUSED), markedById, notes, createdAt

#### Questions & Assignments
- `Question` - schoolId, subjectId, type (MCQ | SHORT_ANSWER | TRUE_FALSE), questionText, options JSON, correctAnswer, marks, createdById
- `Assignment` - classSubjectId, academicPeriodId, title, description, type (HOMEWORK | TEST | QUIZ), totalMarks, dueDate, duration (for timed tests), isOnline, isPublished, createdById
- `AssignmentQuestion` - assignmentId, questionId, order
- `AssignmentSubmission` - assignmentId, studentId, submittedAt, isLate, totalScore, isGraded
- `QuestionResponse` - submissionId, questionId, studentAnswer, isCorrect (auto for MCQ), teacherScore, feedback

#### Results & Reports
- `ExamResult` - studentId, classSubjectId, academicPeriodId, examType, score, maxScore, grade (from GradeScale), remarks
- `ReportCard` - studentId, academicPeriodId, totalScore, averageScore, position, attendancePercentage, passStatus (PASS | FAIL), promotionEligible, publishedAt

#### Communication & Notifications
- `Message` - senderId, receiverId, subject, content, isRead, readAt, createdAt
- `PushToken` - userId, token, platform (IOS | ANDROID), createdAt
- `Notification` - userId, title, body, type, data JSON, isRead, createdAt

---

### Step 2: Subdomain Multi-Tenancy (proxy.ts)

```typescript
// proxy.ts at project root
import { NextResponse, NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  
  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(`:3000`, '')
  
  // Super admin routes
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL(`/super-admin${request.nextUrl.pathname}`, request.url))
  }
  
  // School routes - set header for downstream use
  if (subdomain && subdomain !== 'www' && subdomain !== rootDomain) {
    const response = NextResponse.rewrite(new URL(`/school${request.nextUrl.pathname}`, request.url))
    response.headers.set('x-school-slug', subdomain)
    return response
  }
  
  // Main marketing site
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

---

### Step 3: School Admin Settings Module

#### Features
- **School Profile**: Name, logo, address, contact info
- **Grade Scale CRUD**: Add/edit grades (A=80-100, B=70-79), set passing threshold, optional GPA
- **Promotion Rules**: 
  - Type: "Average only" OR "Must pass required subjects"
  - Set threshold percentage (e.g., 50%)
  - Mark which subjects are required for promotion
  - Set repeat alert threshold (alert when student repeating 2+ times)
- **Academic Year Management**:
  - Create new year with option: "Copy from previous year" or "Start fresh"
  - Archive completed years (makes them read-only)
- **Academic Period CRUD**: Add unlimited periods with custom names, dates, order

---

### Step 4: Timetable Module

#### School Admin Setup
1. Define `Period` slots for the school:
   - Period 1: 8:00 - 8:45
   - Period 2: 8:45 - 9:30
   - Break: 9:30 - 9:45
   - Period 3: 9:45 - 10:30
   - etc.

2. Create `TimetableSlot` entries:
   - Select Class → Day → Period → Subject → Teacher
   - Assign room number (optional)

#### Auto-Generated Views

**Class Timetable** (for printing/display in classroom):
| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 8:00-8:45 | Math (Mr. Smith) | English (Ms. Jones) | ... | ... | ... |
| 8:45-9:30 | Science (Dr. Lee) | Math (Mr. Smith) | ... | ... | ... |

**Teacher Timetable** (shows where teacher needs to be):
| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 8:00-8:45 | Grade 5A - Math | Grade 6B - Math | ... | ... | ... |
| 8:45-9:30 | FREE | Grade 5A - Math | ... | ... | ... |

**Student Timetable**: Same as their enrolled class timetable

#### Conflict Detection
- Alert if teacher assigned to multiple classes at same time
- Alert if room double-booked

#### Export
- PDF/Image export for printing
- Parent API endpoint for mobile app

---

### Step 5: Teacher Dashboard

#### All Teachers See:

**"My Subjects" Tab**
- List of ClassSubjects they teach
- For each: view students, create assignments/tests, grade submissions, enter exam results
- Question bank: Create reusable MCQ (auto-graded) and short answer (manual) questions

**"My Timetable" Tab**
- Personal weekly schedule grid

#### Class Teachers Additionally See:

**"My Class" Tab**
- All students in their class (regardless of subject)
- Mark daily attendance (bulk mark all present, then exceptions)
- View overall performance across all subjects
- Generate class reports

---

### Step 6: Attendance Module

#### Features
- Class teacher marks attendance daily
- Bulk operations: "Mark all present" then adjust individuals
- Status options: PRESENT, ABSENT, LATE, EXCUSED (with notes)
- View modes: Daily list, Weekly calendar, Monthly summary

#### Reports
- Student attendance percentage
- Class attendance trends
- Chronic absentee alerts
- Attendance included in report cards

#### Parent Notification
- Push notification when child marked ABSENT or LATE

---

### Step 7: Assignment & Test System

#### Question Types
| Type | Auto-Grade | Description |
|------|------------|-------------|
| MCQ | ✅ Yes | Multiple choice with single correct answer |
| TRUE_FALSE | ✅ Yes | True or False |
| SHORT_ANSWER | ❌ Manual | Text response, teacher grades with feedback |

#### Assignment Flow
1. Teacher creates assignment (HOMEWORK | TEST | QUIZ)
2. Adds questions from bank or creates new
3. Sets due date, total marks, duration (for timed tests)
4. Publishes to students

#### Submission Flow
1. Student views assignment
2. Answers questions (timed countdown if test)
3. Submits (late flag if after due date)
4. MCQ/True-False: Instant auto-grade
5. Short Answer: Queued for teacher grading

#### Teacher Grading
- View submissions needing grading
- Enter score + feedback per question
- Overall submission score auto-calculated

---

### Step 8: Promotion System

#### End-of-Year Process

1. **Calculate Final Results**
   - Aggregate scores across all periods
   - Calculate final average per student

2. **Apply Promotion Rules**
   - If AVERAGE_ONLY: Check if average ≥ threshold
   - If REQUIRED_SUBJECTS: Also verify passing grade in marked subjects

3. **Mark Eligibility**
   - `promotionEligible: true/false` on ReportCard
   - Increment `repeatCount` for failing students

4. **Alert for Repeat Students**
   - Badge/warning for students with repeatCount ≥ 2

5. **Auto-Promote Eligible**
   - Create new enrollment in next grade level for next academic year
   - Failing students → same grade level

6. **Manual Override UI**
   - School Admin sees list of failed students
   - Can select and force-promote with reason
   - Logged: `promotedBy: MANUAL`, `promotedByUserId`, `promotionNotes`

---

### Step 9: Parent Mobile API

#### Endpoints

```
GET  /api/parent/children              - List linked students
GET  /api/parent/children/[id]         - Student details
GET  /api/parent/children/[id]/results - Results & report cards
GET  /api/parent/children/[id]/assignments - Assignments & submissions
GET  /api/parent/children/[id]/attendance - Attendance records
GET  /api/parent/children/[id]/timetable - Class timetable
GET  /api/parent/children/[id]/fees    - Fee status & invoices
GET  /api/parent/messages              - Message threads
POST /api/parent/messages              - Send message to teacher
POST /api/parent/push-token            - Register FCM token
GET  /api/parent/notifications         - Notification history
```

#### Push Notifications (FCM)

Trigger notifications on:
- New result published
- New assignment posted
- Child marked absent/late
- New message from teacher
- Fee payment reminder
- Fee overdue alert

---

## Phase 2: Fee Management

### Step 10: Fee Module

#### Fee Categories
School Admin creates categories:
- Tuition
- Books & Materials
- Lab Fees
- Transport
- Uniform
- Extracurricular
- Custom categories

#### Fee Structure
Set amounts per category per class:
| Category | Grade 1-3 | Grade 4-6 | Grade 7-9 |
|----------|-----------|-----------|-----------|
| Tuition | $400/term | $500/term | $600/term |
| Books | $50/year | $75/year | $100/year |
| Lab | - | - | $30/term |

#### Student Fee Assignment
- Auto-assign based on class enrollment
- Override for individual students (scholarships, discounts)
- Sibling discounts
- Custom one-time fees

#### Payment Recording
- Record payments: amount, date, method (Cash | Bank Transfer | Mobile Money | Card)
- Receipt number generation
- Partial payments supported
- Payment history per student

#### Invoice Generation
- Auto-generate PDF invoice with:
  - School letterhead & logo
  - Student details
  - Fee breakdown by category
  - Previous balance
  - Payments made
  - Current balance due
  - Due date
- Download/print from web
- Parent views in mobile app

#### Payment Status
| Status | Description |
|--------|-------------|
| PAID | Full amount received |
| PARTIAL | Some amount paid, balance remaining |
| UNPAID | No payment received |
| OVERDUE | Past due date, unpaid/partial |

#### Reports
- Outstanding fees by class/student
- Collection reports by period
- Defaulters list
- Payment trends

---

## Analytics Dashboards

### School Admin Dashboard
- Total students, teachers, classes
- Attendance rate trends (line chart)
- Grade distribution (bar chart)
- Promotion rates by class
- Fee collection status (pie chart)
- Recent activity feed

### Teacher Dashboard
- My classes overview
- Pending assignments to grade
- Today's schedule
- Attendance summary for my class

### Student Dashboard
- Current grades by subject
- Upcoming assignments/tests
- Attendance summary
- Performance trend (line chart)

### Parent Mobile App
- Children overview cards
- Recent results
- Upcoming due dates
- Fee balance alerts
- Attendance this week

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Prisma Accelerate |
| ORM | Prisma 7 |
| UI Components | shadcn/ui |
| Charts | Recharts (via shadcn chart) |
| Authentication | NextAuth.js v5 |
| Push Notifications | Firebase Cloud Messaging |
| PDF Generation | @react-pdf/renderer or jsPDF |
| File Storage | Vercel Blob / Cloudinary |
| Mobile App | Flutter (separatte repo) |

---

## Future Considerations

1. **Online Payment Integration** - Stripe/Paystack/Flutterwave for direct fee payments
2. **SMS Notifications** - For parents without smartphones
3. **Library Module** - Book catalog, issue/return tracking
4. **Transport Module** - Bus routes, vehicle tracking
5. **Custom Domains** - Allow schools to use their own domain (school.edu)
6. **White-labeling** - Custom branding per school tier