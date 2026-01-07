import { cookies } from 'next/headers';
import HomePage from './components/HomePage';

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  // Simple check: if userId cookie exists, we consider them logged in for the homepage view.
  // Ideally we would fetch the user from DB to verify, but this is sufficient for UI state.
  const isLoggedIn = !!userId;

  return <HomePage isLoggedIn={isLoggedIn} />;
}
