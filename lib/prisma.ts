import { PrismaClient } from "../app/generated/prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createPrismaClient> }

function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(withAccelerate())
}

const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

// Helper function for retrying Prisma operations on transient Accelerate errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a transient Accelerate error (P6000)
      const isPrismaError = error && typeof error === "object" && "code" in error
      if (isPrismaError && (error as { code: string }).code === "P6000" && attempt < maxRetries) {
        console.warn(`Prisma Accelerate transient error, retrying (${attempt}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}
