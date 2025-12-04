"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Building2, Mail, Phone, MapPin, Image as ImageIcon } from "lucide-react"
import { updateSchoolProfile } from "../_actions/settings-actions"
import { toast } from "sonner"

interface SchoolProfile {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  subscriptionPlan: string
  subscriptionStatus: string
  maxStudents: number
  maxTeachers: number
}

interface SchoolProfileFormProps {
  profile: SchoolProfile
}

export function SchoolProfileForm({ profile }: SchoolProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: profile.name,
    logo: profile.logo || "",
    address: profile.address || "",
    phone: profile.phone || "",
    email: profile.email || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await updateSchoolProfile({
        name: formData.name,
        logo: formData.logo || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
      })

      if (result.success) {
        toast.success("School profile updated successfully")
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    })
  }

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl h-11"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* School Info Header */}
      <div className="flex items-center gap-4 p-4 neu-sm rounded-2xl">
        <div className="h-16 w-16 rounded-xl neu flex items-center justify-center">
          {profile.logo ? (
            <img src={profile.logo} alt={profile.name} className="h-12 w-12 object-contain" />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-semibold text-lg">{profile.name}</p>
          <p className="text-sm text-muted-foreground">
            {profile.slug}.suku.app
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            profile.subscriptionStatus === "ACTIVE" 
              ? "bg-green-500/10 text-green-500"
              : profile.subscriptionStatus === "TRIAL"
              ? "bg-blue-500/10 text-blue-500"
              : "bg-amber-500/10 text-amber-500"
          }`}>
            {profile.subscriptionStatus}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {profile.subscriptionPlan}
          </span>
        </div>
      </div>

      {/* Subscription Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 neu-sm rounded-xl">
          <p className="text-sm text-muted-foreground">Max Students</p>
          <p className="text-2xl font-bold">{profile.maxStudents}</p>
        </div>
        <div className="p-4 neu-sm rounded-xl">
          <p className="text-sm text-muted-foreground">Max Teachers</p>
          <p className="text-2xl font-bold">{profile.maxTeachers}</p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Form Fields */}
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            School Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Logo URL
          </Label>
          <Input
            id="logo"
            type="url"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className={inputClass}
            placeholder="https://example.com/logo.png"
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL to your school logo image
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
              placeholder="+1 (555) 123-4567"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              placeholder="contact@school.edu"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl min-h-[100px] resize-none"
            placeholder="123 Education Street, City, State 12345"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
