import { Metadata } from "next"
import Link from "next/link"
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Clock, 
  Globe,
  FileText,
  Bell,
  CreditCard,
  MessageSquare,
  Smartphone,
  Lock,
  Zap,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Features - Sukuu",
  description: "Explore all the powerful features of Sukuu school management system",
}

const features = [
  {
    icon: Users,
    title: "Student Management",
    description: "Complete student profiles with enrollment tracking, class assignments, academic history, medical records, and parent contact information all in one centralized location.",
    color: "bg-blue-500"
  },
  {
    icon: GraduationCap,
    title: "Teacher Management",
    description: "Manage teacher profiles, qualifications, subject specializations, workload distribution, and performance tracking with ease.",
    color: "bg-green-500"
  },
  {
    icon: Calendar,
    title: "Smart Timetabling",
    description: "Automated timetable generation with conflict detection, hours-based allocation, room assignments, and teacher availability management.",
    color: "bg-purple-500"
  },
  {
    icon: BookOpen,
    title: "Assignments & Grading",
    description: "Create various assignment types including quizzes, tests, and essays. Automatic grading for objective questions saves teachers time.",
    color: "bg-orange-500"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Comprehensive dashboards showing student performance, attendance trends, grade distributions, and school-wide statistics.",
    color: "bg-cyan-500"
  },
  {
    icon: Shield,
    title: "Multi-tenant Security",
    description: "Each school operates in complete isolation with role-based access control ensuring data privacy and security compliance.",
    color: "bg-red-500"
  },
  {
    icon: Clock,
    title: "Attendance Tracking",
    description: "Daily attendance recording with real-time statistics, absence notifications to parents, and comprehensive attendance reports.",
    color: "bg-indigo-500"
  },
  {
    icon: FileText,
    title: "Academic Periods",
    description: "Flexible academic year configuration with terms, semesters, and examination periods. Set up grading scales and promotion rules.",
    color: "bg-pink-500"
  },
  {
    icon: Globe,
    title: "Cloud-Based Access",
    description: "Access your school data from anywhere, anytime. Works on desktop, tablet, and mobile devices with a responsive interface.",
    color: "bg-teal-500"
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Automated notifications for important events like assignment deadlines, attendance alerts, and grade publications.",
    color: "bg-amber-500"
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Track student fees, generate invoices, record payments, and send payment reminders to parents automatically.",
    color: "bg-emerald-500"
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "Built-in messaging between teachers, students, and parents. Announcements and circular distribution made easy.",
    color: "bg-violet-500"
  },
]

const additionalFeatures = [
  { icon: Smartphone, title: "Mobile Responsive", description: "Works perfectly on all devices" },
  { icon: Lock, title: "Data Encryption", description: "End-to-end encryption for all data" },
  { icon: Zap, title: "Fast Performance", description: "Optimized for speed and reliability" },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Powerful Features for Modern Schools
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Everything you need to manage your school efficiently, all in one integrated platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/school/login">
              <Button size="lg" className="rounded-full px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="neu rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">And Much More...</h2>
            <p className="text-muted-foreground">Built with modern technology for the best experience</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="neu-sm rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how Sukuu can transform your school management.
          </p>
          <Link href="/school/login">
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
