import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/session';
import { LoginForm } from '@/components/login-form';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');
  return <LoginForm />;
}
