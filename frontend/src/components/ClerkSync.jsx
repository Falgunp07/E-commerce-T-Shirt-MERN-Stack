import { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

export default function ClerkSync() {
  const { isSignedIn, user: clerkUser, isLoaded } = useUser();
  const { syncClerkUser, user: localUser, logout } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const name = clerkUser.fullName || clerkUser.firstName || email?.split('@')[0] || 'User';
      const avatar = clerkUser.imageUrl || '';
      const clerkId = clerkUser.id;

      if (email && (!localUser || localUser.email !== email || localUser.avatar !== avatar)) {
        syncClerkUser({ clerkId, email, name, avatar }).catch((err) => {
          console.error('[ThreadLab] Clerk sync error:', err);
        });
      }
    }
  }, [isSignedIn, clerkUser, isLoaded, localUser, syncClerkUser]);

  return null;
}
