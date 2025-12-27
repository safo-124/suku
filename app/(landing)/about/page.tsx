import { Metadata } from "next"
import Link from "next/link"
import { 
  Target, 
  Heart, 
  Lightbulb, 
  Users,
  Globe,
  Award,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About Us - Sukuu",
  description: "Learn about Sukuu's mission to transform education management in Africa",
}

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're committed to making quality education management accessible to every school, regardless of size or budget."
  },
  {
    icon: Heart,
    title: "User-Centric",
    description: "Every feature we build starts with understanding the real needs of teachers, students, and administrators."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We continuously improve our platform with the latest technology to solve education challenges."
  },
  {
    icon: Users,
    title: "Community",
    description: "We believe in building a community of educators who can learn from and support each other."
  }
]

const stats = [
  { value: "150+", label: "Schools" },
  { value: "2,500+", label: "Students" },
  { value: "500+", label: "Teachers" },
  { value: "10+", label: "Countries" }
]

const team = [
  {
    name: "Kofi Mensah",
    role: "Founder & CEO",
    bio: "Former educator with 15 years of experience in school administration.",
    avatar: "KM"
  },
  {
    name: "Ama Boateng",
    role: "Chief Technology Officer",
    bio: "Software engineer passionate about EdTech solutions for Africa.",
    avatar: "AB"
  },
  {
    name: "Yaw Asante",
    role: "Head of Product",
    bio: "Product leader focused on creating intuitive educational tools.",
    avatar: "YA"
  },
  {
    name: "Efua Darko",
    role: "Head of Customer Success",
    bio: "Dedicated to ensuring every school succeeds with Sukuu.",
    avatar: "ED"
  }
]

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Transforming Education Management in Africa
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sukuu was born from a simple belief: every school deserves access to powerful, 
            easy-to-use management tools that help educators focus on what matters most — teaching.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="neu-lg rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Sukuu started in 2023 when our founder, Kofi Mensah, experienced firsthand the 
                  challenges of managing a growing school with outdated tools and paper-based systems.
                </p>
                <p>
                  Hours were spent on administrative tasks that could have been automated. 
                  Communication between teachers, students, and parents was fragmented. 
                  Important data was scattered across multiple spreadsheets and notebooks.
                </p>
                <p>
                  We built Sukuu to solve these problems — a modern, cloud-based platform 
                  designed specifically for African schools, with local payment options, 
                  offline capabilities, and features that actually make sense for our context.
                </p>
              </div>
            </div>
            <div className="neu-lg rounded-2xl p-8 flex items-center justify-center aspect-square">
              <div className="text-center">
                <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Built in Africa</p>
                <p className="text-sm text-muted-foreground">For African Schools</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do at Sukuu
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="neu rounded-xl p-6 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Passionate individuals dedicated to improving education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="neu rounded-xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">
                  {member.avatar}
                </div>
                <h3 className="font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Recognition</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We&apos;re proud to be recognized for our work in education technology
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="neu-sm rounded-xl p-6">
              <p className="font-semibold mb-1">EdTech Innovation Award</p>
              <p className="text-sm text-muted-foreground">Ghana Tech Summit 2024</p>
            </div>
            <div className="neu-sm rounded-xl p-6">
              <p className="font-semibold mb-1">Best Education Startup</p>
              <p className="text-sm text-muted-foreground">Africa Startup Awards</p>
            </div>
            <div className="neu-sm rounded-xl p-6">
              <p className="font-semibold mb-1">Top 50 African Startups</p>
              <p className="text-sm text-muted-foreground">Disrupt Africa 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join Us in Transforming Education
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a school looking to modernize or someone who wants to join our team, 
            we&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/school/login">
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-base text-primary-foreground hover:bg-primary-foreground/10">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
