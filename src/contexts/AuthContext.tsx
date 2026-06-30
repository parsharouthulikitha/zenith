/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      const isIframe = window.self !== window.top;
      let helperMessage = "";

      if (isIframe) {
        helperMessage = " Running inside the embedded preview iframe often restricts popups/third-party cookies. Please click the full-screen / 'Open in new tab' button in AI Studio and try logging in there!";
      } else {
        helperMessage = " Please make sure your browser allows popups and third-party cookies for this domain.";
      }

      if (error?.code === 'auth/cancelled-popup-request') {
        toast.error("Auth popup was closed or cancelled." + helperMessage, { duration: 10000 });
      } else if (error?.code === 'auth/popup-blocked') {
        toast.error("Sign-in popup was blocked by your browser." + helperMessage, { duration: 10000 });
      } else {
        toast.error(`Login failed: ${error.message || 'Unknown error'}` + helperMessage, { duration: 10000 });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, login, logout }}>
      {!loading && children}
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
