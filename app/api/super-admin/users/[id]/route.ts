import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { UserRole } from "@/app/generated/prisma/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    const { firstName, lastName, email, phone, role, schoolId, isActive } = body

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: role as UserRole,
        schoolId: schoolId || null,
        isActive,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
