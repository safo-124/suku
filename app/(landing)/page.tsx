import Link from "next/link"
import { 
  CheckCircle,
  ArrowRight,
  Sparkles,
  School,
  Bell,
  TrendingUp,
  GraduationCap,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPreview } from "./_components/dashboard-preview"

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Transform Your School with{" "}
              <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Sukuu
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A comprehensive, multi-tenant school management system that streamlines administration, 
              enhances communication, and empowers educators, students, and parents.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/school/login">
                <Button size="lg" className="rounded-full px-8 h-12 text-base">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                  See How It Works
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <DashboardPreview />
            
            {/* Floating Elements */}
            <div className="absolute -left-4 top-1/4 hidden lg:block">
              <div className="neu-sm rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Enrollment</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 top-1/3 hidden lg:block">
              <div className="neu-sm rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">98% Attendance</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Dedicated Portals for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for school administrators, teachers, and students - 
              each with features designed for their specific needs.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* School Admin Portal */}
            <div className="neu-lg rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-6">
                  <School className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">School Admin</h3>
                <p className="text-muted-foreground mb-6">
                  Complete control over your school&apos;s operations with powerful management tools.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Manage students & teachers",
                    "Configure academic years",
                    "Generate timetables",
                    "View analytics & reports",
                    "Handle class assignments"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/school/login">
                  <Button className="w-full rounded-full group-hover:bg-blue-600 transition-colors">
                    Access Admin Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Teacher Portal */}
            <div className="neu-lg rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-green-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center mb-6">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Teacher Portal</h3>
                <p className="text-muted-foreground mb-6">
                  Streamlined tools for educators to focus on what matters - teaching.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "View class timetables",
                    "Take attendance",
                    "Create & grade assignments",
                    "Manage student grades",
                    "Track class performance"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/teacher/login">
                  <Button variant="outline" className="w-full rounded-full group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-colors">
                    Access Teacher Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Student Portal */}
            <div className="neu-lg rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Student Portal</h3>
                <p className="text-muted-foreground mb-6">
                  A personalized space for students to track their academic journey.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "View personal timetable",
                    "Submit assignments online",
                    "Check grades & progress",
                    "View attendance records",
                    "Access learning materials"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/student/login">
                  <Button variant="outline" className="w-full rounded-full group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-colors">
                    Access Student Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Schools Nationwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what educators are saying about Sukuu
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Sukuu has transformed how we manage our school. The timetable feature alone saves us hours every week.",
                author: "Sarah Mensah",
                role: "Principal, Accra International School",
                avatar: "SM"
              },
              {
                quote: "The student portal has improved communication between teachers and students. Grades and assignments are now transparent.",
                author: "Kwame Asante",
                role: "Head Teacher, Cape Coast Academy",
                avatar: "KA"
              },
              {
                quote: "Finally, a school management system that understands African schools. The multi-tenant setup is perfect for our group of schools.",
                author: "Ama Owusu",
                role: "Director, Kumasi Educational Trust",
                avatar: "AO"
              }
            ].map((testimonial, index) => (
              <div key={index} className="neu rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of schools already using Sukuu to streamline their operations 
            and improve educational outcomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/school/login">
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-base text-primary-foreground hover:bg-primary-foreground/10">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
