import { LandingNavbar } from "./_components/landing-navbar"
import { LandingFooter } from "./_components/landing-footer"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
