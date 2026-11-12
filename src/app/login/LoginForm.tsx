'use client';

import { useActionState, useState } from 'react';
import { hi } from '@/lib/i18n/hi';
import { loginAction } from './actions';

interface DemoAccount {
  email: string;
  roleTitle: string;
  name: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'karamchari@demo.test',
    roleTitle: hi.roles.halka_karamchari,
    name: 'राजेश कुमार',
  },
  {
    email: 'ro@demo.test',
    roleTitle: hi.roles.revenue_officer,
    name: 'सुनीता देवी',
  },
  {
    email: 'co@demo.test',
    roleTitle: hi.roles.circle_officer,
    name: 'अनिल प्रसाद',
  },
];

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemoCredentials = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Demo@12345');
  };

  const errorMessage = state?.error
    ? hi.errors[state.error as keyof typeof hi.errors] || hi.errors.UNKNOWN_ERROR
    : null;

  return (
    <div className="w-full max-w-sm mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-md border border-zinc-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{hi.login.title}</h1>
        <p className="text-base text-zinc-600 mt-1">{hi.login.subtitle}</p>
        <p className="text-sm font-medium text-emerald-800 mt-0.5">
          {hi.common.anchalName}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-base"
        >
          {errorMessage}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-base font-medium text-zinc-800 mb-1"
          >
            {hi.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-base font-medium text-zinc-800 mb-1"
          >
            {hi.login.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-base border border-zinc-300 rounded-lg focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full min-h-[48px] px-4 py-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-base rounded-lg transition-colors focus:outline-2 focus:outline-blue-800 focus:outline-offset-2 disabled:opacity-60"
        >
          {isPending ? hi.login.loggingIn : hi.login.submitButton}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-2">
          {hi.login.demoBoxTitle}
        </h2>
        <p className="text-xs text-zinc-500 mb-3">{hi.login.demoPrompt}</p>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillDemoCredentials(acc.email)}
              className="w-full min-h-[44px] px-3 py-2 text-left bg-zinc-50 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 border border-zinc-200 rounded-lg flex items-center justify-between text-base transition-colors focus:outline-2 focus:outline-blue-600 focus:outline-offset-1"
            >
              <span className="font-medium text-zinc-900">{acc.roleTitle}</span>
              <span className="text-sm text-zinc-600">({acc.name})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
