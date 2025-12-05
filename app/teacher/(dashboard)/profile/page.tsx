import { getTeacherProfile } from "../_actions/teacher-actions"
import { ProfileClient } from "./_components/profile-client"

export default async function TeacherProfilePage() {
  const result = await getTeacherProfile()
  
  if (!result.success || !result.profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load profile"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <ProfileClient profile={result.profile} />
}
