/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  Smile, 
  Wind, 
  Zap, 
  Flame, 
  Target, 
  Calendar,
  AlertCircle,
  Trophy,
  Star,
  Medal,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    if (!user) return;

    // Fetch User Data for Achievements
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) setUserData(doc.data());
    });

    const hQuery = query(collection(db, 'habits'), where('userId', '==', user.uid), limit(5));
    const unsubscribeHabits = onSnapshot(hQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'habits'));

    return () => {
      unsubscribeUser();
      unsubscribeHabits();
    };
  }, [user]);

  const achievements = userData?.achievements || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif italic text-brand-dark">Good morning, {user?.displayName?.split(' ')[0]}.</h1>
          <p className="text-brand-muted font-medium mt-1">Today is a fresh opportunity to nurture your mind.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/journal">
            <Button variant="outline" className="rounded-full bg-white border-brand-accent text-brand-dark px-6 h-11 font-medium shadow-sm">Daily Journal</Button>
          </Link>
          <Button variant="outline" className="rounded-full bg-white border-brand-accent text-brand-dark px-6 h-11 font-medium shadow-sm">Analysis</Button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1, Left: Focus Widget */}
        <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm overflow-hidden bg-gradient-to-br from-brand-primary to-[#6E947F] text-white p-8 relative">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <h3 className="text-xs uppercase tracking-[0.2em] opacity-80 font-bold">Deep Work Session</h3>
              <div className="text-7xl md:text-8xl font-mono font-light tracking-tighter tabular-nums">25:00</div>
            </div>
            <div className="flex gap-2 mt-8">
              <Link to="/focus">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-none rounded-xl px-6 font-bold text-sm h-10 backdrop-blur-md">Start Session</Button>
              </Link>
              <Button className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl px-6 font-bold text-sm h-10 backdrop-blur-md">Reset</Button>
            </div>
          </div>
          <div className="absolute right-[-10%] top-[-10%] opacity-20 pointer-events-none">
             <svg width="240" height="240" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="1" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="6" strokeDasharray="10 5" />
             </svg>
          </div>
        </Card>

        {/* Row 1, Right: Achievements / Gamification */}
        <Card className="rounded-[32px] border-none shadow-sm bg-white p-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-brand-primary" />
              <h3 className="font-bold text-brand-dark">Achievements</h3>
            </div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{achievements.length} Unlocked</span>
          </div>
          
          <div className="space-y-4 flex-1">
            {achievements.length > 0 ? achievements.slice(0, 3).map((badge: string, i: number) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-brand-secondary/30 rounded-2xl border border-brand-accent/20">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 shrink-0">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">{badge}</p>
                  <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">Milestone Reached</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                <Star className="w-12 h-12 text-brand-secondary" />
                <p className="text-xs font-medium">Complete your first journal entry to unlock your first badge!</p>
              </div>
            )}
          </div>

          <Button variant="ghost" className="mt-4 w-full text-xs font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary">
            See All Badges
          </Button>
        </Card>

        {/* Row 2, Left: Tasks/Intentions (Habit Streaks) */}
        <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm bg-white p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-bold">Habit Streaks</h3>
            </div>
            <Link to="/habits" className="text-xs font-bold text-brand-primary uppercase tracking-widest cursor-pointer hover:underline flex items-center">
              Manage Habits <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.length > 0 ? habits.map(habit => (
              <div key={habit.id} className="flex items-center gap-4 p-5 bg-brand-secondary/50 rounded-[28px] border border-brand-accent/30 group hover:bg-brand-secondary transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl border-2 border-brand-accent flex items-center justify-center transition-all ${habit.completedDates?.includes(new Date().toISOString().split('T')[0]) ? 'bg-brand-primary border-brand-primary rotate-3 scale-110' : 'bg-white'}`}>
                   {habit.completedDates?.includes(new Date().toISOString().split('T')[0]) ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Flame className="w-6 h-6 text-brand-muted/20" />}
                </div>
                <div className="flex-1">
                   <h4 className="font-bold text-sm text-brand-dark">{habit.name}</h4>
                   <div className="flex items-center space-x-2 mt-1">
                     <span className="text-[10px] text-brand-muted font-black uppercase tracking-[0.1em]">{habit.streak} day streak</span>
                     <div className="h-1 w-12 bg-orange-200 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 w-2/3"></div>
                     </div>
                   </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-12 opacity-40">
                <p className="text-sm font-medium italic">No intentions set for today.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Row 2, Right: Mood Baseline */}
        <Card className="rounded-[32px] border-none shadow-sm bg-brand-dark text-white p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>
          <div className="w-24 h-24 rounded-full bg-brand-secondary/10 flex items-center justify-center text-5xl mb-6 shadow-xl relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-pulse"></div>
            🌱
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">Wellbeing Status</span>
          <h4 className="text-2xl font-serif italic text-brand-accent">Mind Baseline: Calm</h4>
          <p className="text-xs text-brand-muted mt-2 max-w-[180px]">Your emotional state has been remarkably stable for 4 days.</p>
        </Card>

        {/* Row 3: Daily Reflection (Full Width) */}
        <Card className="lg:col-span-3 rounded-[40px] border-none shadow-sm bg-white p-12 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] opacity-5">
             <Wind className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-brand-primary font-black">Daily Wisdom</span>
            <blockquote className="font-serif italic text-3xl md:text-4xl leading-snug text-brand-dark">
              "The soul usually knows what to do to heal itself. The challenge is to silence the mind."
            </blockquote>
            <p className="text-sm text-brand-muted font-bold">— Caroline Myss</p>
            <div className="pt-8">
               <Link to="/journal">
                 <Button className="rounded-full bg-brand-dark text-brand-accent hover:bg-brand-primary hover:text-white px-10 h-14 font-black uppercase text-xs tracking-widest transition-all">Start Your Entry</Button>
               </Link>
            </div>
          </div>
        </Card>

      </div>
    </motion.div>
  );
}
