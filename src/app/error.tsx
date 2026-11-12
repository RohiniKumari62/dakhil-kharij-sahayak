'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { hi } from '@/lib/i18n/hi';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log unexpected runtime error to console for operational monitoring
    console.error('Unhandled App Router error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
          ⚠
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
          {hi.errorPage.heading}
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {hi.errorPage.description}
        </p>
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={reset}
            className="w-full min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {hi.errorPage.retryButton}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full min-h-[44px] px-6 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold rounded-lg text-sm"
          >
            {hi.errorPage.backDashboard}
          </Link>
        </div>
      </div>
    </main>
  );
}
