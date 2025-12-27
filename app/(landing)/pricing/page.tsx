import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Pricing - Sukuu",
  description: "Simple, transparent pricing for schools of all sizes",
}

const plans = [
  {
    name: "Starter",
    description: "For small schools just getting started",
    price: "$29",
    period: "/month",
    popular: false,
    features: [
      "Up to 200 students",
      "Up to 20 teachers",
      "5 classes maximum",
      "Basic reports",
      "Email support",
      "1 admin account",
      "Student & teacher portals",
      "Attendance tracking"
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const
  },
  {
    name: "Professional",
    description: "For growing schools with more needs",
    price: "$79",
    period: "/month",
    popular: true,
    features: [
      "Up to 1,000 students",
      "Up to 100 teachers",
      "Unlimited classes",
      "Advanced analytics",
      "Priority email support",
      "5 admin accounts",
      "Custom branding",
      "Timetable generation",
      "Assignment management",
      "Grade management",
      "Fee tracking"
    ],
    cta: "Get Started",
    ctaVariant: "default" as const
  },
  {
    name: "Enterprise",
    description: "For large institutions & districts",
    price: "Custom",
    period: "",
    popular: false,
    features: [
      "Unlimited students",
      "Unlimited teachers",
      "Unlimited classes",
      "Custom integrations",
      "Dedicated support manager",
      "Unlimited admin accounts",
      "SLA guarantee",
      "Data migration assistance",
      "Custom feature development",
      "On-premise option available",
      "Training & onboarding"
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const
  }
]

const faqs = [
  {
    question: "Can I try Sukuu before committing?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required to start."
  },
  {
    question: "What happens when I exceed my student limit?",
    answer: "We'll notify you when you're approaching your limit. You can upgrade your plan anytime to accommodate more students."
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use industry-standard encryption and security practices. Each school's data is completely isolated."
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes! Save 20% when you choose annual billing on any plan."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, mobile money (MTN, Vodafone, AirtelTigo), and bank transfers."
  }
]

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Choose the plan that fits your school&apos;s needs. All plans include core features with no hidden fees.
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              14-day free trial
            </span>
            <span className="mx-3">•</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No credit card required
            </span>
            <span className="mx-3">•</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel anytime
            </span>
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`neu rounded-2xl p-8 relative ${plan.popular ? 'border-2 border-primary ring-4 ring-primary/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href={plan.name === "Enterprise" ? "/contact" : "/school/login"}>
                  <Button variant={plan.ctaVariant} className="w-full rounded-full">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Annual Billing Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="neu-sm rounded-2xl p-6 sm:p-8 text-center bg-primary/5">
            <h3 className="text-xl font-bold mb-2">Save 20% with Annual Billing</h3>
            <p className="text-muted-foreground mb-4">
              Pay annually and get 2 months free on any plan.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="rounded-full">
                Contact for Annual Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Have more questions? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="neu-sm rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
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
            Start Your Free Trial Today
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of schools already using Sukuu. No credit card required.
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
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
