export type SubscriptionPlan = "FREE" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE"
export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED"

export type PlanConfig = {
  name: string
  price: number
  maxStudents: number
  maxTeachers: number
  features: string[]
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    name: "Free",
    price: 0,
    maxStudents: 50,
    maxTeachers: 5,
    features: [
      "Up to 50 students",
      "Up to 5 teachers",
      "Basic attendance tracking",
      "Simple gradebook",
      "Email support",
    ],
  },
  BASIC: {
    name: "Basic",
    price: 49,
    maxStudents: 200,
    maxTeachers: 20,
    features: [
      "Up to 200 students",
      "Up to 20 teachers",
      "Full attendance tracking",
      "Advanced gradebook",
      "Parent portal",
      "Priority email support",
    ],
  },
  PROFESSIONAL: {
    name: "Professional",
    price: 149,
    maxStudents: 1000,
    maxTeachers: 100,
    features: [
      "Up to 1,000 students",
      "Up to 100 teachers",
      "All Basic features",
      "Custom reports",
      "API access",
      "Phone support",
      "Custom branding",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 499,
    maxStudents: 10000,
    maxTeachers: 1000,
    features: [
      "Unlimited students",
      "Unlimited teachers",
      "All Professional features",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
  },
}
