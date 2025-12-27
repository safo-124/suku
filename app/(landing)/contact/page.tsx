import { Metadata } from "next"
import Link from "next/link"
import { 
  Mail, 
  MapPin, 
  Phone,
  Clock,
  MessageCircle,
  Send,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Contact Us - Sukuu",
  description: "Get in touch with the Sukuu team for sales, support, or partnership inquiries",
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "For general inquiries and support",
    value: "hello@sukuu.io",
    action: "mailto:hello@sukuu.io"
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Fri from 8am to 6pm WAT",
    value: "+233 20 123 4567",
    action: "tel:+233201234567"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our headquarters",
    value: "Accra, Ghana",
    action: null
  }
]

const faqs = [
  {
    question: "How long does it take to set up Sukuu?",
    answer: "Most schools are up and running within 24-48 hours. Our team will help you import existing data and train your staff."
  },
  {
    question: "Is my data secure with Sukuu?",
    answer: "Absolutely. We use enterprise-grade encryption, regular backups, and comply with international data protection standards."
  },
  {
    question: "Can I try Sukuu before committing?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required."
  },
  {
    question: "Do you offer training for our staff?",
    answer: "Yes, we provide comprehensive onboarding and training sessions, plus ongoing support through our help center."
  }
]

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Have questions about Sukuu? We&apos;re here to help. Reach out and our team 
            will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="neu rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                {method.action ? (
                  <a 
                    href={method.action}
                    className="text-primary font-medium hover:underline"
                  >
                    {method.value}
                  </a>
                ) : (
                  <p className="text-primary font-medium">{method.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="neu-lg rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Send us a Message</h2>
              </div>
              
              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Kofi"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Mensah"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="kofi@school.edu.gh"
                  />
                </div>
                
                <div>
                  <label htmlFor="school" className="block text-sm font-medium mb-2">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="school"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Accra Academy"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Select a topic</option>
                    <option value="demo">Request a Demo</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                
                <Button type="submit" className="w-full h-12 rounded-xl text-base">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Working Hours</h2>
                <div className="neu rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Monday - Friday</p>
                      <p className="text-sm text-muted-foreground">8:00 AM - 6:00 PM WAT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Saturday</p>
                      <p className="text-sm text-muted-foreground">9:00 AM - 1:00 PM WAT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Sunday</p>
                      <p className="text-sm text-muted-foreground">Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Response Time</h2>
                <div className="neu rounded-xl p-6">
                  <p className="text-muted-foreground mb-4">
                    We typically respond to inquiries within:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span><strong>Sales:</strong> Within 4 hours</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span><strong>Support:</strong> Within 24 hours</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span><strong>Partnerships:</strong> Within 48 hours</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="neu-lg rounded-xl p-6 bg-primary/5">
                <h3 className="font-semibold mb-2">Need immediate help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check out our help center for instant answers to common questions.
                </p>
                <Button variant="outline" size="sm" className="rounded-full">
                  Visit Help Center
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="neu rounded-xl p-6">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
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
            Start your free 14-day trial today. No credit card required.
          </p>
          <Link href="/school/login">
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
