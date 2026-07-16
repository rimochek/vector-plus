"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function LegalDocumentPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <main className="min-h-dvh bg-[#f3f3f3] px-4 py-6 text-[#202020] sm:px-8 sm:py-10 dark:bg-[#171717] dark:text-[#ededed]">
      <div className="mx-auto max-w-[816px]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#444] transition hover:bg-black/5 dark:text-[#ddd] dark:hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <article className="min-h-[calc(100dvh-8rem)] bg-white px-6 py-10 shadow-sm sm:px-14 sm:py-16 md:px-[72px] dark:bg-[#222]">
          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 border-b border-black/15 pb-6 font-serif text-sm text-[#666] dark:border-white/15 dark:text-[#aaa]">
            {updated}
          </p>
          <div className="mt-8 space-y-5 font-serif text-[16px] leading-[1.75] text-[#2b2b2b] dark:text-[#dedede]">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
