/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Flame, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => handleFirestoreError(err, OperationType.LIST, 'habits'));
    return () => unsubscribe();
  }, [user]);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim() || !user) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'habits'), {
        userId: user.uid,
        name: newHabit.trim(),
        streak: 0,
        completedDates: [],
        createdAt: Timestamp.now()
      });
      setNewHabit('');
      toast.success('New habit added!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'habits');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHabit = async (habit: any) => {
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completedDates.includes(today);
    
    let updatedDates = [...habit.completedDates];
    let newStreak = habit.streak;

    if (isCompleted) {
      updatedDates = updatedDates.filter(d => d !== today);
      newStreak = Math.max(0, newStreak - 1);
    } else {
      updatedDates.push(today);
      newStreak += 1;
    }

    try {
      await updateDoc(doc(db, 'habits', habit.id), {
        completedDates: updatedDates,
        streak: newStreak
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'habits');
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'habits', id));
      toast.success('Habit removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'habits');
    }
  };

  const isToday = (dateArr: string[]) => dateArr.includes(new Date().toISOString().split('T')[0]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif italic text-brand-dark">Growth Habits</h2>
          <p className="text-brand-muted font-medium tracking-tight">Small consistent actions lead to significant transformation.</p>
        </div>
        
        <form onSubmit={addHabit} className="flex w-full md:w-auto gap-2">
          <Input 
            placeholder="Next intention..." 
            className="rounded-full border-brand-accent bg-white h-12 px-6 shadow-sm focus-visible:ring-brand-primary"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
          />
          <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full px-8 h-12 shadow-lg shadow-brand-primary/20">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {habits.map((habit, i) => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`rounded-[32px] border-none shadow-sm transition-all duration-500 overflow-hidden ${isToday(habit.completedDates) ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-white hover:shadow-md'}`}>
                <CardContent className="p-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                        <span className={`text-xl font-bold block ${isToday(habit.completedDates) ? 'text-white' : 'text-brand-dark'}`}>
                          {habit.name}
                        </span>
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className={`w-3 h-3 ${isToday(habit.completedDates) ? 'text-brand-accent' : 'text-orange-500'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isToday(habit.completedDates) ? 'text-white/80' : 'text-brand-muted'}`}>
                              {habit.streak} DAY STREAK
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                         <Button
                          size="icon"
                          className={`w-12 h-12 rounded-2xl shadow-lg transition-transform active:scale-90 ${
                            isToday(habit.completedDates) ? 'bg-white/20 text-white hover:bg-white/30 border-none' : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                          }`}
                          onClick={() => toggleHabit(habit)}
                        >
                          {isToday(habit.completedDates) ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </Button>
                         <Button
                          size="icon"
                          variant="ghost"
                          className={isToday(habit.completedDates) ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-brand-accent hover:text-red-500'}
                          onClick={() => deleteHabit(habit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Calendar View */}
                  <div className="mt-8 flex gap-1.5 justify-between">
                    {[6, 5, 4, 3, 2, 1, 0].map(offset => {
                      const date = new Date();
                      date.setDate(date.getDate() - offset);
                      const dStr = date.toISOString().split('T')[0];
                      const isDone = habit.completedDates.includes(dStr);
                      return (
                        <div key={dStr} className="flex flex-col items-center flex-1">
                          <div className={`w-full aspect-square rounded-md mb-1.5 ${
                            isDone ? (isToday(habit.completedDates) ? 'bg-white/40' : 'bg-brand-primary') : (isToday(habit.completedDates) ? 'bg-white/10' : 'bg-brand-secondary')
                          }`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isToday(habit.completedDates) ? 'text-white/50' : 'text-brand-muted'}`}>
                            {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {habits.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-brand-primary/20 rounded-3xl p-12 text-center space-y-4">
             <div className="w-16 h-16 bg-brand-primary/5 text-brand-primary rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-xl font-serif font-bold text-brand-primary">Start your streak</h3>
                <p className="text-gray-500 text-sm">Add your first habit above to begin your journey of consistency.</p>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
