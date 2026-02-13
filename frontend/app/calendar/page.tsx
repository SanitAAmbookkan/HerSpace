'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { fetcher } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

interface Log {
    date: string;
    phase: string;
    mood_rating: number;
    energy_level: number;
}

export default function CalendarPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            router.push('/');
            return;
        }

        fetcher(`/calendar/${userId}`)
            .then((data) => {
                // Backend returns logs, but might be empty or error if user not found/no logs.
                if (Array.isArray(data)) {
                    setLogs(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    return (
        <main className="min-h-screen p-8 relative flex flex-col items-center">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-3 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
            >
                <ArrowLeft size={24} className="text-gray-600" />
            </button>

            <h1 className="text-3xl font-bold mb-12 text-gray-800 mt-8">Your Cycle History</h1>

            {loading ? (
                <div className="text-gray-500 animate-pulse">Loading history...</div>
            ) : (
                <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logs.map((log, i) => (
                        <GlassCard key={i} className="p-6 transition-all hover:-translate-y-1 duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-gray-500 font-medium">{new Date(log.date).toLocaleDateString()}</div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider 
                  ${log.phase === 'Menstrual' ? 'bg-red-100 text-red-500' :
                                        log.phase === 'Follicular' ? 'bg-blue-100 text-blue-500' :
                                            log.phase === 'Ovulation' ? 'bg-purple-100 text-purple-500' :
                                                'bg-yellow-100 text-yellow-600'}`}>
                                    {log.phase}
                                </span>
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-100/50 pt-4">
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Mood</div>
                                    <div className="text-3xl font-bold text-gray-700">{log.mood_rating}<span className="text-sm text-gray-400 font-normal">/10</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Energy</div>
                                    <div className="text-3xl font-bold text-gray-700">{log.energy_level}<span className="text-sm text-gray-400 font-normal">/10</span></div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    {logs.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-12 bg-white/30 rounded-3xl backdrop-blur-md">
                            <p className="text-lg mb-2">No logs found yet.</p>
                            <p className="text-sm">Go to Dashboard to track your period or mood!</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
