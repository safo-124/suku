import { Metadata } from "next"
import { TimetableClient } from "./_components/timetable-client"

export const metadata: Metadata = {
  title: "Timetable | School Admin",
  description: "Manage school timetables",
}

export default function TimetablePage() {
  return <TimetableClient />
}
