/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export default function Coach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          chatHistory: messages
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      
      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      toast.error('Connection to Zenith lost. Please check your internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-6"
    >
      <div className="flex items-center space-x-5">
        <div className="w-14 h-14 rounded-[20px] bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
          <Bot className="w-8 h-8" />
        </div>
        <div>
           <h2 className="text-3xl font-serif italic text-brand-dark tracking-tight">Zenith AI Coach</h2>
           <div className="text-brand-muted font-black text-[10px] uppercase tracking-[0.2em] flex items-center">
             <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
             Active Pulse
           </div>
        </div>
      </div>

      <Card className="flex-1 border-none shadow-sm rounded-[40px] overflow-hidden bg-white flex flex-col">
        <ScrollArea className="flex-1 p-8">
          <div className="space-y-8 pb-4">
            {messages.length === 0 && (
              <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                 <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-brand-primary" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-serif italic text-brand-dark">How can I support your growth today?</h3>
                    <p className="max-w-xs text-sm text-brand-muted font-medium">I'm here to help you navigate stress, find focus, or simply reflect on your journey.</p>
                 </div>
                 <div className="flex gap-2 pt-4">
                   <Button variant="outline" size="sm" onClick={() => setInput('I am feeling a bit overwhelmed today.')} className="rounded-full border-brand-accent text-brand-dark text-[10px] uppercase font-black tracking-widest px-6 h-9">Overwhelmed</Button>
                   <Button variant="outline" size="sm" onClick={() => setInput('How can I be more productive?')} className="rounded-full border-brand-accent text-brand-dark text-[10px] uppercase font-black tracking-widest px-6 h-9">Productivity</Button>
                 </div>
              </div>
            )}
            
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-brand-accent' : 'bg-brand-primary'} text-white`}>
                   {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`max-w-[75%] rounded-[24px] p-5 ${
                  m.role === 'user' 
                  ? 'bg-brand-primary text-white rounded-tr-none shadow-lg shadow-brand-primary/10' 
                  : 'bg-brand-secondary text-brand-dark rounded-tl-none font-medium'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.parts[0].text}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-brand-primary shrink-0 flex items-center justify-center text-white">
                   <Bot className="w-5 h-5" />
                </div>
                <div className="bg-brand-secondary rounded-[24px] rounded-tl-none p-5 flex items-center space-x-3">
                   <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                   <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Reflecting on your journey...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <CardContent className="p-6 bg-white border-t border-brand-accent">
          <form onSubmit={handleSubmit} className="relative flex gap-2">
            <Input
              placeholder="Speak with Zenith..."
              className="flex-1 rounded-full border-brand-secondary bg-brand-secondary/50 h-14 px-8 text-sm focus-visible:ring-brand-primary/20"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 h-10 w-10 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white p-0 shadow-lg shadow-brand-primary/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[9px] text-center text-brand-muted mt-4 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 opacity-60">
             <AlertCircle className="w-3.1 h-3.1" />
             Mindful AI is here to assist, not replace clinical support.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
