"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-charcoal-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="mb-10">
          <Image
            src="/skipco-logo.jpg"
            alt="Skip Co Solutions"
            width={300}
            height={300}
            priority
            className="h-auto w-64 object-contain"
          />
        </div>

        <Link
          href="/login"
          className="w-full max-w-xs rounded-xl bg-[#19c5c5] px-8 py-4 text-center text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#14aaaa] hover:shadow-xl"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}