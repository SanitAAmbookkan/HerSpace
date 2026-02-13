'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Calendar } from '@/components/ui/Calendar';
import { fetcher } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

import { addDays, format, parseISO } from 'date-fns';

interface Log {
    date: string;
    phase: string;
    mood_rating?: number;
    energy_level?: number;
    period_start_date?: string;
    period_end_date?: string;
    cycle_day?: number;
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
            .then((data: Log[]) => {
                if (Array.isArray(data)) {
                    // Generate projected cycle data
                    const processedLogs = [...data];
                    const startDates = data.filter(log => log.cycle_day === 1 || (log.period_start_date && log.date === log.period_start_date));

                    startDates.forEach(startLog => {
                        const startDate = parseISO(startLog.date);

                        // Calculate Menstrual phase length
                        let menstrualLength = 5; // Default
                        if (startLog.period_end_date && startLog.period_start_date) {
                            const end = parseISO(startLog.period_end_date);
                            const start = parseISO(startLog.period_start_date);
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            menstrualLength = diffDays;
                        }

                        // Generate 28 days of cycle data
                        for (let i = 0; i < 28; i++) {
                            const currentDate = addDays(startDate, i);
                            const dateStr = format(currentDate, 'yyyy-MM-dd');

                            // Determine phase
                            let phase = "";
                            const dayOfCycle = i + 1;

                            // Dynamic phase calculation
                            if (dayOfCycle <= menstrualLength) phase = "Menstrual";
                            else if (dayOfCycle <= menstrualLength + 8) phase = "Follicular";
                            else if (dayOfCycle <= menstrualLength + 11) phase = "Ovulation";
                            else phase = "Luteal";

                            // Check if log already exists for this date
                            const existingLogIndex = processedLogs.findIndex(l => l.date === dateStr);

                            if (existingLogIndex === -1) {
                                // Add synthetic log
                                processedLogs.push({
                                    date: dateStr,
                                    phase: phase,
                                    cycle_day: dayOfCycle
                                });
                            } else {
                                // Update existing log if it doesn't have a phase (unlikely given backend logic, but good for safety)
                                if (!processedLogs[existingLogIndex].phase) {
                                    processedLogs[existingLogIndex].phase = phase;
                                }
                            }
                        }
                    });

                    // Sort logs by date
                    processedLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setLogs(processedLogs);
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
                <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <Calendar events={logs} />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Logs</h2>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {logs.map((log, i) => (
                                <GlassCard key={i} className="p-4 hover:bg-white/40 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-gray-600 font-medium">
                                            {new Date(log.date).toLocaleDateString()}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider 
                                            ${log.phase === 'Menstrual' ? 'bg-red-100 text-red-500' :
                                                log.phase === 'Follicular' ? 'bg-blue-100 text-blue-500' :
                                                    log.phase === 'Ovulation' ? 'bg-purple-100 text-purple-500' :
                                                        'bg-yellow-100 text-yellow-600'}`}>
                                            {log.phase}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <div>Mood: <span className="font-semibold text-gray-700">{log.mood_rating}/10</span></div>
                                        <div>Energy: <span className="font-semibold text-gray-700">{log.energy_level}/10</span></div>
                                    </div>
                                </GlassCard>
                            ))}
                            {logs.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No logs found yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
