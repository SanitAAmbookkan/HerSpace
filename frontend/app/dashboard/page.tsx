'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeumorphicBox } from '@/components/ui/NeumorphicBox';
import { Droplets, MessageCircleHeart, CalendarDays, LogOut } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            router.push('/');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user_id');
        router.push('/');
    };

    return (
        <main className="min-h-screen p-8 relative max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-16 mt-4">
                <h1 className="text-4xl font-bold text-gray-700 tracking-tight">Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="p-3 rounded-full hover:bg-white/50 transition-colors text-gray-600 shadow-sm"
                    title="Logout"
                >
                    <LogOut size={24} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
                <NeumorphicBox onClick={() => router.push('/period')} className="h-80">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-8 text-red-400 shadow-inner">
                        <Droplets size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Track Period</h2>
                    <p className="text-gray-500 mt-3 text-base">Log your cycle start date</p>
                </NeumorphicBox>

                <NeumorphicBox onClick={() => router.push('/mood')} className="h-80">
                    <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mb-8 text-pink-400 shadow-inner">
                        <MessageCircleHeart size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Mood & Chat</h2>
                    <p className="text-gray-500 mt-3 text-base">Chat with AI & log feelings</p>
                </NeumorphicBox>

                <NeumorphicBox onClick={() => router.push('/calendar')} className="h-80">
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-8 text-purple-400 shadow-inner">
                        <CalendarDays size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700">Calendar</h2>
                    <p className="text-gray-500 mt-3 text-base">View your cycle history</p>
                </NeumorphicBox>
            </div>
        </main>
    );
}
