import { hi } from '@/lib/i18n/hi';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">{hi.dashboard.title}</h1>
      <p className="text-base text-zinc-600 mt-2">{hi.common.loading}</p>
    </div>
  );
}
