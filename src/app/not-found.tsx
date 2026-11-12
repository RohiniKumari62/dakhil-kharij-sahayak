import Link from 'next/link';
import { hi } from '@/lib/i18n/hi';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
          {hi.notFound.heading}
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {hi.notFound.description}
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {hi.notFound.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
