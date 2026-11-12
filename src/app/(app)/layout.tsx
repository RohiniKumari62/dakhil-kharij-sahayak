import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hi } from '@/lib/i18n/hi';
import { logoutAction } from '@/app/login/actions';
import type { Role } from '@/lib/workflow/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, anchal')
    .eq('id', user.id)
    .single();

  const role = (profile?.role as Role) || 'halka_karamchari';
  const roleName = hi.roles[role] || role;
  const fullName = profile?.full_name || user.email;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="text-lg sm:text-xl font-bold text-blue-900">
              {hi.common.appName}
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              ({profile?.anchal || hi.common.anchalName})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm sm:text-base font-semibold text-zinc-800">
                {fullName}
              </div>
              <div className="text-xs sm:text-sm font-medium text-emerald-700">
                {roleName}
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="min-h-[44px] px-3 py-2 text-sm sm:text-base font-medium text-zinc-700 hover:text-red-700 hover:bg-red-50 border border-zinc-300 rounded-lg transition-colors focus:outline-2 focus:outline-red-600 focus:outline-offset-1"
              >
                {hi.common.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
