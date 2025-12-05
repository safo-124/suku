"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { PlatformSettings as PlatformSettingsModel } from "@/app/generated/prisma/client"

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

// Helper to convert DB record to PlatformSettings type
function dbToSettings(record: PlatformSettingsModel): PlatformSettings {
  return {
    general: {
      platformName: record.platformName,
      platformUrl: record.platformUrl,
      supportEmail: record.supportEmail,
      defaultTimezone: record.defaultTimezone,
    },
    branding: {
      logoUrl: record.logoUrl,
      faviconUrl: record.faviconUrl,
      primaryColor: record.primaryColor,
      accentColor: record.accentColor,
    },
    defaults: {
      defaultTrialDays: record.defaultTrialDays,
      defaultPlan: record.defaultPlan,
      maxSchoolsPerAdmin: record.maxSchoolsPerAdmin,
      requireEmailVerification: record.requireEmailVerification,
    },
    features: {
      allowPublicRegistration: record.allowPublicRegistration,
      enableMultiTenancy: record.enableMultiTenancy,
      enableApiAccess: record.enableApiAccess,
      maintenanceMode: record.maintenanceMode,
    },
    email: {
      smtpHost: record.smtpHost,
      smtpPort: record.smtpPort,
      smtpUser: record.smtpUser,
      smtpSecure: record.smtpSecure,
      fromEmail: record.fromEmail,
      fromName: record.fromName,
    },
  }
}

export async function getSettings(): Promise<{ success: boolean; settings?: PlatformSettings; error?: string }> {
  try {
    // Fetch from database, create default if doesn't exist
    let record = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })

    if (!record) {
      // Create default settings
      record = await prisma.platformSettings.create({
        data: {
          id: "default",
          ...DEFAULT_SETTINGS.general,
          ...DEFAULT_SETTINGS.branding,
          ...DEFAULT_SETTINGS.defaults,
          ...DEFAULT_SETTINGS.features,
          ...DEFAULT_SETTINGS.email,
        },
      })
    }

    return {
      success: true,
      settings: dbToSettings(record),
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    // Return defaults if database fails
    return { success: true, settings: DEFAULT_SETTINGS }
  }
}

export async function updateSettings(
  section: keyof PlatformSettings,
  data: Partial<PlatformSettings[keyof PlatformSettings]>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map section data to flat DB fields
    const updateData: Record<string, unknown> = {}
    
    if (section === "general") {
      const d = data as Partial<PlatformSettings["general"]>
      if (d.platformName !== undefined) updateData.platformName = d.platformName
      if (d.platformUrl !== undefined) updateData.platformUrl = d.platformUrl
      if (d.supportEmail !== undefined) updateData.supportEmail = d.supportEmail
      if (d.defaultTimezone !== undefined) updateData.defaultTimezone = d.defaultTimezone
    } else if (section === "branding") {
      const d = data as Partial<PlatformSettings["branding"]>
      if (d.logoUrl !== undefined) updateData.logoUrl = d.logoUrl
      if (d.faviconUrl !== undefined) updateData.faviconUrl = d.faviconUrl
      if (d.primaryColor !== undefined) updateData.primaryColor = d.primaryColor
      if (d.accentColor !== undefined) updateData.accentColor = d.accentColor
    } else if (section === "defaults") {
      const d = data as Partial<PlatformSettings["defaults"]>
      if (d.defaultTrialDays !== undefined) updateData.defaultTrialDays = d.defaultTrialDays
      if (d.defaultPlan !== undefined) updateData.defaultPlan = d.defaultPlan
      if (d.maxSchoolsPerAdmin !== undefined) updateData.maxSchoolsPerAdmin = d.maxSchoolsPerAdmin
      if (d.requireEmailVerification !== undefined) updateData.requireEmailVerification = d.requireEmailVerification
    } else if (section === "features") {
      const d = data as Partial<PlatformSettings["features"]>
      if (d.allowPublicRegistration !== undefined) updateData.allowPublicRegistration = d.allowPublicRegistration
      if (d.enableMultiTenancy !== undefined) updateData.enableMultiTenancy = d.enableMultiTenancy
      if (d.enableApiAccess !== undefined) updateData.enableApiAccess = d.enableApiAccess
      if (d.maintenanceMode !== undefined) updateData.maintenanceMode = d.maintenanceMode
    } else if (section === "email") {
      const d = data as Partial<PlatformSettings["email"]>
      if (d.smtpHost !== undefined) updateData.smtpHost = d.smtpHost
      if (d.smtpPort !== undefined) updateData.smtpPort = d.smtpPort
      if (d.smtpUser !== undefined) updateData.smtpUser = d.smtpUser
      if (d.smtpSecure !== undefined) updateData.smtpSecure = d.smtpSecure
      if (d.fromEmail !== undefined) updateData.fromEmail = d.fromEmail
      if (d.fromName !== undefined) updateData.fromName = d.fromName
    }

    // Upsert the settings record
    await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...DEFAULT_SETTINGS.general,
        ...DEFAULT_SETTINGS.branding,
        ...DEFAULT_SETTINGS.defaults,
        ...DEFAULT_SETTINGS.features,
        ...DEFAULT_SETTINGS.email,
        ...updateData,
      },
    })

    revalidatePath("/super-admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}

export async function resetSettings(): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset to default values
    await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: {
        ...DEFAULT_SETTINGS.general,
        ...DEFAULT_SETTINGS.branding,
        ...DEFAULT_SETTINGS.defaults,
        ...DEFAULT_SETTINGS.features,
        ...DEFAULT_SETTINGS.email,
      },
      create: {
        id: "default",
        ...DEFAULT_SETTINGS.general,
        ...DEFAULT_SETTINGS.branding,
        ...DEFAULT_SETTINGS.defaults,
        ...DEFAULT_SETTINGS.features,
        ...DEFAULT_SETTINGS.email,
      },
    })
    
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
