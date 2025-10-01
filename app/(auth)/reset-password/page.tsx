"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Exchange the code for a session
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code);
    }
  }, [searchParams, supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full">
        <Card className="w-full border-slate-200 shadow-xl bg-white">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold text-slate-900 text-center">
              ✅ Password reset successful
            </CardTitle>
            <CardDescription className="text-slate-700 text-center text-base">
              Your password has been updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800">
                🎉 Your account is now secure with your new password
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full border-slate-200 shadow-xl bg-white">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold text-slate-900 text-center">Reset your password</CardTitle>
          <CardDescription className="text-slate-700 text-center text-base">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-5 px-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900 font-semibold">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className="h-11 border-slate-300 bg-white placeholder:text-slate-400 text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-900 font-semibold">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className="h-11 border-slate-300 bg-white placeholder:text-slate-400 text-slate-900"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 font-semibold mb-2">
                💡 Password Security Tips:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Use at least 12 characters for better security</li>
                <li>Mix uppercase, lowercase, numbers, and symbols</li>
                <li>Don't reuse passwords from other sites</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 px-8 pb-8">
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md"
              disabled={loading}
            >
              {loading ? "Resetting password..." : "Reset password"}
            </Button>
            <div className="text-center text-sm text-slate-700">
              Remember your password?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                Back to login
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
