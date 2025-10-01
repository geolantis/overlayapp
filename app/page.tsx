import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Users, Cloud, Map, Zap, Shield } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 sm:py-32">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Professional PDF Overlay Management
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Georeference your PDFs, create beautiful map overlays, and share them with your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Easy Georeferencing</h3>
            <p className="text-slate-600 leading-relaxed">
              Upload your PDF and place control points on an interactive map to georeference your documents.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Real-time Collaboration</h3>
            <p className="text-slate-600 leading-relaxed">
              Work together with your team. See changes in real-time and manage permissions easily.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900">Cloud Storage</h3>
            <p className="text-slate-600 leading-relaxed">
              Your PDFs and overlays are securely stored in the cloud with automatic backups.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-12">
              Everything you need for professional mapping
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Map className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Interactive Maps</h4>
                  <p className="text-sm text-slate-600">View your overlays on high-quality interactive maps</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Fast Processing</h4>
                  <p className="text-sm text-slate-600">Process large PDFs quickly with our optimized engine</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Enterprise Security</h4>
                  <p className="text-sm text-slate-600">Bank-level encryption and SOC 2 compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of professionals using OverlayApp for their georeferencing needs.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </main>

    {/* Footer */}
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 OverlayApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
    </>
  );
}
