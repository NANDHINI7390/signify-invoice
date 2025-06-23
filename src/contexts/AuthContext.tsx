'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Process the redirect result after the auth state has been initially determined.
      // This runs when the user is redirected back to the app after signing in.
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User has successfully signed in via redirect.
          const user = result.user;
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
          }, { merge: true });
          
          toast({ title: 'Sign In Successful', description: `Welcome back, ${user.displayName}!` });
        }
      } catch (error: any) {
        // Don't show an error toast if the user simply cancelled the sign-in.
        if (error.code !== 'auth/cancelled-popup-request') {
           console.error('Redirect sign-in error:', error);
           toast({ variant: 'destructive', title: 'Login Failed', description: 'Could not complete sign-in. Please try again.' });
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true); // Show a loading indicator while the redirect happens.
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // The result will be handled by the `getRedirectResult` call in the useEffect hook.
  };

  const logout = async () => {
    await signOut(auth);
    toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
