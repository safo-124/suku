import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserEditForm } from "./_components/user-edit-form"

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/super-admin/users/${id}`}>
          <Button variant="ghost" size="icon" className="neu-flat hover:neu-inset rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit User</h2>
          <p className="text-muted-foreground mt-1">
            Update user information and settings
          </p>
        </div>
      </div>

      <UserEditForm userId={id} />
    </div>
  )
}
