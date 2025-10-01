import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, CreditCard, Settings, UserPlus, Mail, Shield } from "lucide-react";

export default async function OrganizationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Mock organization data - replace with actual database query
  const organization = {
    name: "My Organization",
    members: 1,
    plan: "Free",
    createdAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Organization Settings</h2>
        <p className="text-slate-600 mt-2">
          Manage your organization and team settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Organization Information Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Organization Details
            </CardTitle>
            <CardDescription className="text-slate-600">
              Update your organization information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org_name" className="text-slate-900">Organization Name</Label>
                <Input
                  id="org_name"
                  defaultValue={organization.name}
                  className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900">Created</Label>
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {organization.createdAt}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_description" className="text-slate-900">Description</Label>
              <textarea
                id="org_description"
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="Describe your organization..."
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

        {/* Team Members Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Team Members
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Manage your organization members and permissions
                </CardDescription>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current User */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {user.user_metadata?.['full_name'] || 'User'}
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      Owner
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Full Access</span>
              </div>
            </div>

            {/* Invite Section */}
            <div className="p-6 rounded-lg border border-slate-200 bg-white">
              <h4 className="font-medium text-slate-900 mb-4">Invite New Member</h4>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  className="border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                />
                <select className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none">
                  <option>Member</option>
                  <option>Admin</option>
                  <option>Viewer</option>
                </select>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                  Send Invite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Billing Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Subscription & Billing
            </CardTitle>
            <CardDescription className="text-slate-600">
              Manage your subscription plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">{organization.plan} Plan</h4>
                  <p className="text-slate-600">Current subscription</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">$0</div>
                  <p className="text-sm text-slate-600">per month</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Up to 5 team members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>10 GB storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Basic support</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Upgrade Plan
              </Button>
              <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50">
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Advanced Settings
            </CardTitle>
            <CardDescription className="text-slate-600">
              Configure advanced organization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-600">
                    Enforce 2FA for all organization members
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-slate-200 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Allow Public Sharing</Label>
                  <p className="text-sm text-slate-600">
                    Enable sharing of overlays with public links
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-blue-600 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6"></span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Activity Logging</Label>
                  <p className="text-sm text-slate-600">
                    Keep detailed logs of all organization activity
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-blue-600 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6"></span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="bg-white border border-red-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription className="text-slate-600">
              Irreversible actions that affect your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Transfer Ownership</Label>
                  <p className="text-sm text-slate-600">
                    Transfer this organization to another member
                  </p>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Transfer
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Delete Organization</Label>
                  <p className="text-sm text-slate-600">
                    Permanently delete this organization and all its data
                  </p>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
