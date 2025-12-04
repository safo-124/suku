import Link from "next/link"
import { ArrowLeft, Building2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SchoolForm } from "../_components/school-form"

export default function NewSchoolPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/super-admin/schools">
          <Button variant="ghost" size="icon" className="neu-flat hover:neu-inset rounded-xl h-10 w-10 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl neu-convex flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Create New School</h2>
              <p className="text-muted-foreground text-sm">
                Add a new school to your platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intro Card */}
      <div className="neu-flat rounded-2xl p-5 border-l-4 border-white/20">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h3 className="font-medium">Getting Started</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Fill in the school details below. Each school will receive its own subdomain for secure, 
              isolated access. You can always modify these settings later.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-8">
          <SchoolForm />
        </div>
      </div>
    </div>
  )
}
