import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { SchoolForm } from "../../_components/school-form"

interface EditSchoolPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSchoolPage({ params }: EditSchoolPageProps) {
  const { id } = await params
  
  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      subscriptionPlan: true,
      maxStudents: true,
      maxTeachers: true,
    },
  })

  if (!school) {
    notFound()
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/super-admin/schools/${id}`}>
          <Button variant="ghost" size="icon" className="neu-flat hover:neu-inset rounded-xl h-10 w-10 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl neu-convex flex items-center justify-center">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Edit School</h2>
              <p className="text-muted-foreground text-sm">
                Update details for {school.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      {!school.isActive && (
        <div className="neu-flat rounded-2xl p-5 border-l-4 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-400">School is Inactive</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This school is currently inactive. Users cannot access the school portal 
                until it&apos;s reactivated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-8">
          <SchoolForm school={school} />
        </div>
      </div>
    </div>
  )
}
