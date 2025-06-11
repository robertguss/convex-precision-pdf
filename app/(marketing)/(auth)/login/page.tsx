import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/marketing/Button";
import { TextField } from "@/components/marketing/Fields";
import { Logo } from "@/components/marketing/Logo";
import { SlimLayout } from "@/components/marketing/SlimLayout";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Precision PDF account to access your documents and continue extracting data from PDFs with AI-powered precision.",
  alternates: {
    canonical: "https://precisionpdf.com/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Login() {
  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-gray-900">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm text-gray-700">
        Don’t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign up
        </Link>{" "}
        for a free trial.
      </p>
      <form action="#" className="mt-10 grid grid-cols-1 gap-y-8">
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div>
          <Button type="submit" variant="solid" color="blue" className="w-full">
            <span>
              Sign in <span aria-hidden="true">&rarr;</span>
            </span>
          </Button>
        </div>
      </form>
    </SlimLayout>
  );
}
