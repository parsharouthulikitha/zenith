/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';
import { 
  LayoutDashboard, 
  Timer, 
  CheckCircle2, 
  BookOpen, 
  MessageCircle, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Compass,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';

// Pages (will implement them next)
import Dashboard from './pages/Dashboard';
import FocusRoom from './pages/FocusRoom';
import Habits from './pages/Habits';
import Journal from './pages/Journal';
import Coach from './pages/Coach';

function Navigation() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Focus', path: '/focus', icon: Timer },
    { name: 'Habits', path: '/habits', icon: CheckCircle2 },
    { name: 'Journal', path: '/journal', icon: BookOpen },
    { name: 'AI Coach', path: '/coach', icon: MessageCircle },
  ];

  return (
    <aside className="w-20 bg-white border-r border-brand-accent flex flex-col items-center py-8 justify-between sticky top-0 h-screen shrink-0">
      <div className="flex flex-col items-center space-y-12">
        <Link to="/" className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-primary/20">
          Z
        </Link>

        <div className="flex flex-col space-y-8">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`p-2 rounded-xl transition-all ${
                location.pathname === item.path 
                ? 'text-brand-primary bg-brand-primary/10 shadow-sm' 
                : 'text-brand-muted hover:text-brand-primary hover:bg-brand-secondary'
              }`}
              title={item.name}
            >
              <item.icon className="w-6 h-6" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-brand-accent overflow-hidden border-2 border-white shadow-sm">
          <Avatar className="w-full h-full">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-brand-accent text-brand-dark"><UserIcon className="w-5 h-5" /></AvatarFallback>
          </Avatar>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-brand-muted hover:text-red-500 rounded-xl">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </aside>
  );
}

function LandingPage() {
  const { login, isSigningIn } = useAuth();
  const isIframe = window.self !== window.top;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-secondary relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-accent/30 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl text-center space-y-8 z-10"
      >
        <div className="flex justify-center">
           <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
              <Compass className="w-10 h-10" />
           </div>
        </div>
        <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter text-brand-dark italic">Zenith.</h1>
        <p className="text-xl text-brand-muted font-medium leading-relaxed">
          Nurture your mind with intentionality. An AI-powered ecosystem for mental clarity, productivity, and personal evolution.
        </p>
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <Button 
              size="lg" 
              onClick={login} 
              disabled={isSigningIn}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full px-10 py-7 text-lg h-auto shadow-xl shadow-brand-primary/20 flex items-center gap-3 disabled:opacity-75 cursor-pointer"
            >
              {isSigningIn && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSigningIn ? 'Connecting...' : 'Begin Journey'}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-10 py-7 text-lg h-auto border-brand-primary text-brand-dark hover:bg-brand-primary/5 cursor-pointer">
              Discover
            </Button>
          </div>
          {isIframe && (
            <div className="text-xs text-brand-muted font-medium max-w-md mx-auto bg-white border border-brand-accent p-4 rounded-2xl shadow-sm mt-3 animate-pulse">
              <span className="text-yellow-600 font-bold block mb-1">⚠️ Dev Environment Note:</span>
              Embedded iframes may block popup logins depending on your browser's third-party cookie or pop-up blocker rules. For the smoothest experience, click the <strong>"Open in new tab"</strong> button in the top-right of your preview header.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <LandingPage />;

  return (
    <div className="flex min-h-screen bg-brand-secondary overflow-x-hidden">
      <Navigation />
      <main className="flex-1 p-8 md:p-12 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/focus" element={<FocusRoom />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/coach" element={<Coach />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
