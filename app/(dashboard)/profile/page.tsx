import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h2>
        <p className="text-slate-600 mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-600">
              Update your personal details and profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-900">Full Name</Label>
                <Input
                  id="full_name"
                  defaultValue={user.user_metadata?.['full_name'] || ''}
                  className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email || ''}
                    disabled
                    className="pl-10 border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-slate-900">Bio</Label>
              <textarea
                id="bio"
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="Tell us a bit about yourself..."
                defaultValue={user.user_metadata?.['bio'] || ''}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50">
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Account Information
            </CardTitle>
            <CardDescription className="text-slate-600">
              View your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-900">Account ID</Label>
                <div className="text-sm font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {user.id}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {createdAt}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Account Status</Label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Security</CardTitle>
            <CardDescription className="text-slate-600">
              Manage your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-slate-900">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                placeholder="••••••••"
                className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-slate-900">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-slate-900">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="bg-white border border-red-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription className="text-slate-600">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
