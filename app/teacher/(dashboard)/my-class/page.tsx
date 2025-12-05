import { getMyClass } from "../_actions/teacher-actions"
import { MyClassClient } from "./_components/my-class-client"

export default async function MyClassPage() {
  const result = await getMyClass()
  
  if (!result.success || !result.class) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "You are not assigned as a class teacher"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <MyClassClient classData={result.class} />
}
