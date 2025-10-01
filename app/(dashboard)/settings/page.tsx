import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, Globe, Palette, Shield } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-2">
          Manage your application preferences and configurations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notifications
            </CardTitle>
            <CardDescription className="text-slate-600">
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Email Notifications</Label>
                  <p className="text-sm text-slate-600">
                    Receive email updates about your account activity
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-blue-600 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6"></span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Push Notifications</Label>
                  <p className="text-sm text-slate-600">
                    Get push notifications in your browser
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-slate-200 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Weekly Digest</Label>
                  <p className="text-sm text-slate-600">
                    Receive a weekly summary of your activity
                  </p>
                </div>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-blue-600 rounded-full cursor-pointer">
                  <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-6"></span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Appearance
            </CardTitle>
            <CardDescription className="text-slate-600">
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-900 font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 rounded-lg border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="text-sm font-medium text-slate-900">Light</div>
                  </button>
                  <button className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-medium text-slate-900">Dark</div>
                  </button>
                  <button className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-medium text-slate-900">System</div>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 font-medium">Display Density</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-medium text-slate-900">Compact</div>
                  </button>
                  <button className="p-4 rounded-lg border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="text-sm font-medium text-slate-900">Comfortable</div>
                  </button>
                  <button className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-medium text-slate-900">Spacious</div>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Apply Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Language & Region
            </CardTitle>
            <CardDescription className="text-slate-600">
              Set your language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-900 font-medium">Language</Label>
                <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 font-medium">Timezone</Label>
                <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none">
                  <option>Pacific Time (PT)</option>
                  <option>Mountain Time (MT)</option>
                  <option>Central Time (CT)</option>
                  <option>Eastern Time (ET)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900 font-medium">Date Format</Label>
              <select className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Update Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security Card */}
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Privacy & Security
            </CardTitle>
            <CardDescription className="text-slate-600">
              Control your privacy and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Session Management</Label>
                  <p className="text-sm text-slate-600">
                    View and manage your active sessions
                  </p>
                </div>
                <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50">
                  Manage
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-900 font-medium">Data Export</Label>
                  <p className="text-sm text-slate-600">
                    Download a copy of your data
                  </p>
                </div>
                <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50">
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
