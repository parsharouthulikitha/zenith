/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { Sparkles, Brain, History, Loader2, Heart, TrendingUp, Mic, MicOff, Star, AlertCircle, Quote } from 'lucide-react';
import { toast } from 'sonner';

interface AIAnalysis {
  summary: string;
  sentiment: string;
  mood: string;
  tips: string[];
  themes: string[];
  triggers: string[];
}

export default function Journal() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'journal_entries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => handleFirestoreError(err, OperationType.LIST, 'journal_entries'));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setContent((prev) => prev + (prev.length > 0 ? ' ' : '') + event.results[i][0].transcript);
          }
        }
      };
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        toast.error('Voice recording failed: ' + event.error);
      };
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return toast.error('Speech recognition not supported in this browser');
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      setIsRecording(true);
      toast.info('Recording started...');
    }
  };

  const checkAchievements = async (count: number) => {
    if (!user) return;
    const achievementsToGrant: string[] = [];
    if (count === 1) achievementsToGrant.push('First Reflection');
    if (count === 7) achievementsToGrant.push('Weekly Chronicler');
    if (count === 30) achievementsToGrant.push('Monthly Zen Master');

    if (achievementsToGrant.length > 0) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentAchievements = userDoc.exists() ? userDoc.data().achievements || [] : [];
      
      const newBadges = achievementsToGrant.filter(b => !currentAchievements.includes(b));
      if (newBadges.length > 0) {
        await updateDoc(userRef, {
          achievements: arrayUnion(...newBadges)
        });
        newBadges.forEach(badge => toast.success(`Unlocked Achievement: ${badge}! 🏆`, { duration: 5000 }));
      }
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return toast.error('Please write something first');
    
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalContent: content })
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      
      // Save entry
      await addDoc(collection(db, 'journal_entries'), {
        userId: user!.uid,
        content,
        moodAnalysis: data.summary || 'No analysis available',
        sentiment: data.sentiment || 'Neutral',
        mood: data.mood || 'Standard',
        tips: data.tips || [],
        themes: data.themes || [],
        triggers: data.triggers || [],
        createdAt: Timestamp.now()
      });

      await checkAchievements(entries.length + 1);
      
      toast.success('Journal entry saved and analyzed!');
    } catch (error: any) {
      console.error(error);
      const isUnavailable = error.message?.includes('UNAVAILABLE') || error.message?.includes('high demand');
      toast.error(isUnavailable ? 'AI is currently busy. Your entry is saved, but analysis will be available later.' : 'AI analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid lg:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif italic text-brand-dark">Mindful Journal</h2>
          <p className="text-brand-muted font-medium">Release your thoughts—via text or voice—and get AI insights.</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="relative group">
              <Textarea
                placeholder="How was your day? What's on your mind?..."
                className="min-h-[400px] border-none resize-none focus-visible:ring-0 p-8 text-lg font-serif leading-relaxed text-brand-dark"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Button
                size="icon"
                onClick={toggleRecording}
                className={`absolute bottom-8 right-8 w-14 h-14 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-brand-secondary text-brand-primary'}`}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            </div>
            <div className="p-6 bg-brand-secondary/50 border-t flex justify-between items-center">
              <span className="text-xs text-brand-muted font-black uppercase tracking-widest">{content.split(' ').filter(Boolean).length} words</span>
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !content.trim()}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full px-8 h-12 shadow-lg shadow-brand-primary/20"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Analyze Aura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-brand-muted font-black uppercase text-[10px] tracking-widest">
            <History className="w-4 h-4" />
            <span>Recent Reflections</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {entries.map(entry => (
              <Card key={entry.id} className="border-none shadow-sm rounded-2xl bg-white hover:bg-brand-secondary transition-colors cursor-pointer p-1">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm line-clamp-1 text-brand-dark">{entry.content}</p>
                      <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest">
                        {entry.createdAt?.toDate().toLocaleDateString()} • {entry.sentiment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Card className="rounded-[32px] border-none bg-brand-dark text-brand-accent shadow-sm p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                         <Brain className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Psychological Insight</span>
                    </div>
                    <span className="px-4 py-1.5 bg-brand-primary text-white text-[10px] font-black rounded-full uppercase tracking-wider">{analysis.mood}</span>
                  </div>
                  <p className="text-2xl font-serif text-white italic leading-relaxed">"{analysis.summary}"</p>
                </div>
              </Card>

              {/* Themes & Triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-[24px] border-none bg-white p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="w-4 h-4 text-brand-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Themes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.themes.map((theme, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-secondary text-brand-primary text-[10px] font-bold rounded-full">{theme}</span>
                    ))}
                  </div>
                </Card>
                <Card className="rounded-[24px] border-none bg-white p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Triggers</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.triggers.map((trigger, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-400 text-[10px] font-bold rounded-full">{trigger}</span>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2 text-brand-muted font-black uppercase text-[10px] tracking-widest px-2">
                  <Quote className="w-4 h-4" />
                  <span>Personalized Action Plan</span>
                </div>
                {analysis.tips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="rounded-[24px] border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 flex items-start space-x-4">
                        <div className="w-6 h-6 rounded-lg bg-brand-secondary flex items-center justify-center text-brand-primary text-xs font-black shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-brand-dark leading-relaxed">{tip}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="w-10 h-10 text-brand-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-serif italic text-brand-dark">Aura Insight Awaits</h3>
                <p className="max-w-xs text-sm text-brand-muted font-medium">Write or record your heart out and our mental wellness AI will provide emotional patterns and growth suggestions.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
