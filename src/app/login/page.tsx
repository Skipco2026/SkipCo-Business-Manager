"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between gradient-primary p-12 text-white">
        <Logo showText={true} />
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Manage your skip hire business with confidence
          </h2>
          <p className="mt-4 text-primary-100 leading-relaxed">
            Access your dashboard to manage customers, quotes, invoices, jobs, and
            reports — all from one secure platform built for{" "}
            {siteConfig.company.tradingAs}.
          </p>
          <div className="mt-8 space-y-3 text-sm text-primary-100">
            <p>✓ Real-time business overview</p>
            <p>✓ Customer and job management</p>
            <p>✓ Invoicing and payment tracking</p>
            <p>✓ Secure cloud-based access</p>
          </div>
        </div>
        <p className="text-sm text-primary-200">
          {siteConfig.company.legalName}
          <br />
          Reg: {siteConfig.company.registration}
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col bg-white dark:bg-charcoal-900 lg:w-1/2">
        <div className="flex items-center justify-between p-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-charcoal-500 transition-colors hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-charcoal-500 dark:text-charcoal-400">
                Sign in to your SkipCo Business Manager account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@skipco.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                <Lock className="h-4 w-4" />
                Sign in
              </Button>
            </form>

            <div className="mt-8 rounded-xl border border-charcoal-100 bg-charcoal-50 p-4 dark:border-charcoal-800 dark:bg-charcoal-800/50">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">
                    Need access?
                  </p>
                  <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
                    Contact your administrator at{" "}
                    <a
                      href={`mailto:${siteConfig.company.email}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.company.email}
                    </a>{" "}
                    or call {siteConfig.company.phone}.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
