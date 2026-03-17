import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent-green">AlertML</h1>
          <p className="mt-1 text-sm text-text-muted">
            Climate Emergency Management
          </p>
        </div>

        <Card padding="lg">
          <h2 className="mb-6 text-xl font-semibold text-text-primary">
            Sign In
          </h2>
          <LoginForm />
        </Card>

        <p className="mt-4 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-accent-green transition-colors hover:brightness-110"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
