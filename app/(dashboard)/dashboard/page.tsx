import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Map, Upload, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch statistics (you'll need to create these tables in Supabase)
  const { count: overlayCount } = await supabase
    .from("pdf_overlays")
    .select("*", { count: "exact", head: true });

  const stats = [
    {
      title: "Total Overlays",
      value: overlayCount || 0,
      icon: FileText,
      description: "PDF overlays created",
    },
    {
      title: "Active Maps",
      value: "0",
      icon: Map,
      description: "Maps with overlays",
    },
    {
      title: "Recent Uploads",
      value: "0",
      icon: Upload,
      description: "This month",
    },
    {
      title: "Team Members",
      value: "1",
      icon: Users,
      description: "Organization members",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.user_metadata?.['full_name'] || "User"}!
        </h2>
        <p className="text-slate-600">
          Here's an overview of your PDF overlay management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-600">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Recent Activity</CardTitle>
            <CardDescription className="text-slate-600">Your recent PDF uploads and edits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Quick Actions</CardTitle>
            <CardDescription className="text-slate-600">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/overlays/new"
              className="block p-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
            >
              <div className="flex items-center">
                <Upload className="mr-3 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">Upload New PDF</p>
                  <p className="text-sm text-slate-600">
                    Start georeferencing a new document
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/dashboard/map"
              className="block p-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
            >
              <div className="flex items-center">
                <Map className="mr-3 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">View Map</p>
                  <p className="text-sm text-slate-600">
                    See all your overlays on the map
                  </p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
