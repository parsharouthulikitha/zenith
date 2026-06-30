/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Settings2,
  Volume2,
  VolumeX,
  Plus,
  Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

type Mode = 'pomodoro' | 'short_break' | 'long_break';

export default function FocusRoom() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modeConfig = {
    pomodoro: { time: 25 * 60, label: 'Focus Time', color: 'bg-brand-primary', icon: Brain },
    short_break: { time: 5 * 60, label: 'Short Break', color: 'bg-blue-500', icon: Coffee },
    long_break: { time: 15 * 60, label: 'Long Break', color: 'bg-indigo-600', icon: Coffee },
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    toast.success(`${modeConfig[mode].label} finished!`);
    
    if (user && mode === 'pomodoro') {
      try {
        await addDoc(collection(db, 'focus_sessions'), {
          userId: user.uid,
          duration: modeConfig[mode].time / 60,
          type: mode,
          completed: true,
          createdAt: Timestamp.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'focus_sessions');
      }
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modeConfig[mode].time);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(modeConfig[newMode].time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / modeConfig[mode].time) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-12 text-center">
      <div className="space-y-4">
        <h2 className="text-5xl font-serif italic text-brand-dark tracking-tight">Focus Laboratory</h2>
        <p className="text-brand-muted font-medium max-w-sm mx-auto">Eliminate distractions. Immerse yourself in the flow state.</p>
      </div>

      <div className="flex justify-center space-x-3">
        {(['pomodoro', 'short_break', 'long_break'] as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? 'default' : 'outline'}
            className={`rounded-full px-8 h-11 transition-all font-bold text-sm tracking-wide ${mode === m ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' : 'text-brand-muted border-brand-accent bg-white'}`}
            onClick={() => changeMode(m)}
          >
            {m === 'pomodoro' ? 'Deep Work' : m === 'short_break' ? 'Rest' : 'Deep Reflection'}
          </Button>
        ))}
      </div>

      <div className="relative group">
        <div className="relative w-80 h-80 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-brand-accent"
            />
            <motion.circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="879.6"
              initial={{ strokeDashoffset: 879.6 }}
              animate={{ strokeDashoffset: (progress / 100) * 879.6 }}
              transition={{ duration: 1, ease: 'linear' }}
              className="text-brand-primary transition-colors"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-8xl font-mono font-light tracking-tighter tabular-nums text-brand-dark">
                {formatTime(timeLeft)}
             </span>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-muted mt-4">
                {modeConfig[mode].label}
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-14 h-14 rounded-full border-brand-accent hover:border-brand-primary text-brand-muted hover:text-brand-primary disabled:opacity-50 shadow-sm"
          onClick={resetTimer}
        >
          <RotateCcw className="w-6 h-6" />
        </Button>

        <Button 
          onClick={toggleTimer}
          className={`w-24 h-24 rounded-full shadow-2xl transition-all scale-110 flex items-center justify-center ${
            isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:opacity-90'
          } shadow-brand-primary/20`}
        >
          {isActive ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white ml-2" />}
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          className="w-14 h-14 rounded-full border-brand-accent hover:border-brand-primary text-brand-muted hover:text-brand-primary shadow-sm"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </Button>
      </div>

      {/* Focus Ambience */}
      <Card className="bg-white border-none shadow-sm rounded-[24px] max-w-sm mx-auto p-4 flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <div className="p-3 bg-brand-secondary text-brand-primary rounded-2xl">
                <Brain className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-brand-dark">Rain Forest Ambience</p>
                <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">Active Background Noise</p>
              </div>
           </div>
           <Volume2 className="w-5 h-5 text-brand-muted" />
      </Card>
    </div>
  );
}
