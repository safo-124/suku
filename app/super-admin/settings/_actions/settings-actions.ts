"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type PlatformSettings = {
  general: {
    platformName: string
    platformUrl: string
    supportEmail: string
    defaultTimezone: string
  }
  branding: {
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    accentColor: string
  }
  defaults: {
    defaultTrialDays: number
    defaultPlan: string
    maxSchoolsPerAdmin: number
    requireEmailVerification: boolean
  }
  features: {
    allowPublicRegistration: boolean
    enableMultiTenancy: boolean
    enableApiAccess: boolean
    maintenanceMode: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpSecure: boolean
    fromEmail: string
    fromName: string
  }
}

// Default settings
const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platformName: "Suku",
    platformUrl: "https://suku.app",
    supportEmail: "support@suku.app",
    defaultTimezone: "UTC",
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#ffffff",
    accentColor: "#6366f1",
  },
  defaults: {
    defaultTrialDays: 14,
    defaultPlan: "FREE",
    maxSchoolsPerAdmin: 5,
    requireEmailVerification: true,
  },
  features: {
    allowPublicRegistration: true,
    enableMultiTenancy: true,
    enableApiAccess: true,
    maintenanceMode: false,
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpSecure: true,
    fromEmail: "noreply@suku.app",
    fromName: "Suku",
  },
}

// In a real app, these would be stored in a database table
// For now, we'll simulate with a simple in-memory store
let cachedSettings: PlatformSettings | null = null

export async function getSettings(): Promise<{ success: boolean; settings?: PlatformSettings; error?: string }> {
  try {
    // In production, fetch from database
    // const settingsRecord = await prisma.platformSettings.findFirst()
    // For now, return defaults merged with any cached changes
    
    const settings = cachedSettings || DEFAULT_SETTINGS
    
    return {
      success: true,
      settings,
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return { success: false, error: "Failed to fetch settings" }
  }
}

export async function updateSettings(
  section: keyof PlatformSettings,
  data: Partial<PlatformSettings[keyof PlatformSettings]>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current settings
    const current = cachedSettings || DEFAULT_SETTINGS
    
    // Merge with new data
    cachedSettings = {
      ...current,
      [section]: {
        ...current[section],
        ...data,
      },
    }

    // In production, save to database
    // await prisma.platformSettings.upsert({
    //   where: { id: 'default' },
    //   update: { settings: cachedSettings },
    //   create: { id: 'default', settings: cachedSettings },
    // })

    revalidatePath("/super-admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}

export async function resetSettings(): Promise<{ success: boolean; error?: string }> {
  try {
    cachedSettings = { ...DEFAULT_SETTINGS }
    
    revalidatePath("/super-admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to reset settings:", error)
    return { success: false, error: "Failed to reset settings" }
  }
}

export async function testEmailSettings(): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, actually test the SMTP connection
    // For now, simulate a test
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    return { success: true }
  } catch (error) {
    console.error("Failed to test email settings:", error)
    return { success: false, error: "Failed to connect to SMTP server" }
  }
}
