import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'लॉगिन | दाखिल-खारिज सहायक',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <LoginForm />
    </main>
  );
}
