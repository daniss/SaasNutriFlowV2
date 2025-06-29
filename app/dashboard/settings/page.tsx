"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, User, Mail, Phone, MapPin, Bell, Shield, Palette } from "lucide-react"
import { useAuthContext } from "@/components/auth/AuthProvider"
import { DashboardHeader } from "@/components/dashboard-header"

export default function SettingsPage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Profile form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [appointmentReminders, setAppointmentReminders] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "")
      setLastName(profile.last_name || "")
      setEmail(profile.email || "")
      setPhone(profile.phone || "")
      setTitle(profile.title || "")
      setBio(profile.bio || "")
      setAddress(profile.address || "")
      setCity(profile.city || "")
      setState(profile.state || "")
      setZipCode(profile.zip_code || "")
    }
    if (user) {
      setEmail(user.email || "")
    }
  }, [profile, user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        phone,
        title,
        bio,
        address,
        city,
        state,
        zip_code: zipCode,
      }

      const { error } = await updateProfile(updates)

      if (error) {
        setError(error)
      } else {
        setSuccess("Profile updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      setError("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-gray-600 font-medium">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
      {/* Header Section */}
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 text-sm lg:text-base font-medium">
          Manage your account settings and preferences
        </p>
      </div>

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 animate-scale-in">
          <AlertDescription className="font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="animate-scale-in">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 animate-slide-up animate-delay-100">
        {/* Profile Information */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              Profile Information
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Update your personal information and professional details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      className="pl-10 border-gray-200 bg-gray-50 text-gray-500"
                      disabled
                      placeholder="Email cannot be changed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Professional Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Registered Dietitian, Nutritionist"
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your clients about yourself and your expertise"
                  rows={4}
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Choose how you want to be notified about important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about upcoming appointments</p>
              </div>
              <Switch checked={appointmentReminders} onCheckedChange={setAppointmentReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive updates about new features and tips</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              Security Settings
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Manage your account security and privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">Last changed: Never</p>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200">
                Change Password
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Two-Factor Authentication</Label>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:shadow-soft transition-all duration-200">
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Portal Customization */}
        <Card className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              Client Portal Customization
            </CardTitle>
            <CardDescription className="text-gray-600 leading-relaxed">
              Customize how your client portal appears
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portalTitle">Portal Title</Label>
              <Input id="portalTitle" placeholder="Your Practice Name" defaultValue="NutriFlow Client Portal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                placeholder="Welcome message for your clients"
                defaultValue="Welcome to your personalized nutrition portal!"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Brand Colors</Label>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-emerald-500 border-2 border-gray-300"></div>
                <div className="w-8 h-8 rounded bg-blue-500 border"></div>
                <div className="w-8 h-8 rounded bg-purple-500 border"></div>
                <div className="w-8 h-8 rounded bg-orange-500 border"></div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Preview Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
