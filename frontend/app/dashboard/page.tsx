'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeumorphicBox } from '@/components/ui/NeumorphicBox';
import { Droplets, MessageCircleHeart, CalendarDays, LogOut } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();

    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            router.push('/');
            return;
        }

        // Fetch insights
        fetch(`http://localhost:5000/insight/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setInsight(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user_id');
        router.push('/');
    };

    return (
        <main className="min-h-screen p-6 md:p-12 relative max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">Hello, Beautiful 🌸</h1>
                    <p className="text-gray-500">Welcome to your daily emotional check-in.</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-3 rounded-full hover:bg-white/50 transition-colors text-gray-400 hover:text-gray-600"
                    title="Logout"
                >
                    <LogOut size={24} />
                </button>
            </header>

            {/* Daily Insight Section */}
            {insight && (
                <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-700">
                    <NeumorphicBox className="p-8 border-l-4 border-pink-300">
                        <h3 className="text-lg font-semibold text-pink-400 uppercase tracking-wider mb-2">Current Phase</h3>
                        <p className="text-3xl font-bold text-gray-700 mb-4">{insight.current_phase}</p>
                        <p className="text-gray-600 leading-relaxed text-lg">{insight.insight}</p>
                    </NeumorphicBox>

                    <NeumorphicBox className="p-8 border-l-4 border-purple-300">
                        <h3 className="text-lg font-semibold text-purple-400 uppercase tracking-wider mb-2">Suggested Focus</h3>
                        <p className="text-3xl font-bold text-gray-700 mb-4">{insight.suggested_focus || "Listen to your body"}</p>
                        {insight.patterns && insight.patterns.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm font-bold text-gray-400 mb-2">DETECTED PATTERNS</p>
                                <ul className="space-y-2">
                                    {insight.patterns.map((dev: string, i: number) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-purple-400 mt-1">•</span> {dev}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </NeumorphicBox>

                    <NeumorphicBox className="p-8 border-l-4 border-teal-300">
                        <h3 className="text-lg font-semibold text-teal-400 uppercase tracking-wider mb-2">Recommended Activity</h3>
                        <p className="text-2xl font-bold text-gray-700 mb-2">{insight.activity_suggestion || "Log mood to see!"}</p>
                        <p className="text-gray-500 text-sm">Based on your latest energy & mood.</p>
                    </NeumorphicBox>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <NeumorphicBox onClick={() => router.push('/period')} className="h-64 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-400 group-hover:bg-red-100 transition-colors">
                        <Droplets size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Track Period</h2>
                    <p className="text-gray-500 mt-2">Log your dates</p>
                </NeumorphicBox>

                <NeumorphicBox onClick={() => router.push('/mood')} className="h-64 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-6 text-pink-400 group-hover:bg-pink-100 transition-colors">
                        <MessageCircleHeart size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Mood & Chat</h2>
                    <p className="text-gray-500 mt-2">Emotional support</p>
                </NeumorphicBox>

                <NeumorphicBox onClick={() => router.push('/calendar')} className="h-64 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6 text-purple-400 group-hover:bg-purple-100 transition-colors">
                        <CalendarDays size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Calendar</h2>
                    <p className="text-gray-500 mt-2">Cycle history</p>
                </NeumorphicBox>
            </div>
        </main>
    );
}
