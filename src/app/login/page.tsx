import { LoginForm } from './LoginForm';
import { hi } from '@/lib/i18n/hi';

export const metadata = {
  title: hi.login.pageTitle,
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <LoginForm />
    </main>
  );
}
