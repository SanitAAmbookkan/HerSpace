'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { fetcher } from '@/lib/api';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';

export default function MoodPage() {
    const router = useRouter();
    const [mood, setMood] = useState('');
    const [energy, setEnergy] = useState('');
    const [loadingMood, setLoadingMood] = useState(false);

    const [chatMsg, setChatMsg] = useState('');
    const [aiResponse, setAiResponse] = useState<any>(null);
    const [loadingChat, setLoadingChat] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('user_id')) router.push('/');
    }, [router]);

    const handleLogMood = async () => {
        if (!mood || !energy) return;
        setLoadingMood(true);
        try {
            const userId = localStorage.getItem('user_id');
            const res = await fetcher('/log-mood', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    mood_rating: parseInt(mood),
                    energy_level: parseInt(energy)
                }),
            });

            if (res.error) {
                alert(res.error);
            } else {
                alert('Mood logged! You can now chat with AI.');
            }
        } catch (error) {
            alert('Error logging mood. Make sure you have set a period start date in "Track Period" first.');
            console.error(error);
        } finally {
            setLoadingMood(false);
        }
    };

    const handleChat = async () => {
        if (!chatMsg) return;
        setLoadingChat(true);
        try {
            const userId = localStorage.getItem('user_id');
            const res = await fetcher('/chat', {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, message: chatMsg }),
            });
            if (res.error) throw new Error(res.error);
            setAiResponse(res);
            setChatMsg('');
        } catch (error: any) {
            alert(error.message || 'Error chatting with AI. Make sure you have logged your mood today.');
        } finally {
            setLoadingChat(false);
        }
    };

    return (
        <main className="min-h-screen p-6 relative flex flex-col items-center">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-3 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
            >
                <ArrowLeft size={24} className="text-gray-600" />
            </button>

            <h1 className="text-3xl font-bold mb-8 text-gray-800 mt-12">Mood & Chat</h1>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mood Section */}
                <GlassCard>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-700">How are you feeling?</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-gray-500 mb-2 font-medium">Mood Rating (1-10)</label>
                            <Input type="number" min="1" max="10" value={mood} onChange={(e) => setMood(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-2 font-medium">Energy Level (1-10)</label>
                            <Input type="number" min="1" max="10" value={energy} onChange={(e) => setEnergy(e.target.value)} />
                        </div>
                        <GradientButton onClick={handleLogMood} disabled={loadingMood} className="w-full mt-4">
                            {loadingMood ? 'Logging...' : 'Submit Mood'}
                        </GradientButton>
                    </div>
                </GlassCard>

                {/* Chat Section */}
                <div className="flex flex-col gap-6">
                    <GlassCard className="flex-1 flex flex-col">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center gap-2">
                            Ask AI <Sparkles className="text-pink-400" size={20} />
                        </h2>

                        <div className="flex-1 min-h-[200px] mb-4">
                            {aiResponse ? (
                                <div className="bg-gradient-to-br from-white/60 to-white/30 rounded-2xl p-6 border border-white/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{aiResponse.phase} Phase</span>
                                        <span className="text-xs text-gray-400 font-medium">Emotion: {aiResponse.detected_emotion}</span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed text-lg">{aiResponse.response}</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 italic">
                                    AI response will appear here...
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="How are you feeling?"
                                value={chatMsg}
                                onChange={(e) => setChatMsg(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                className="flex-1"
                            />
                            <button
                                onClick={handleChat}
                                disabled={loadingChat}
                                className="bg-white/50 p-4 rounded-2xl hover:bg-white/80 transition-all text-pink-500 shadow-sm border border-white/40 disabled:opacity-50"
                            >
                                <Send size={24} />
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
