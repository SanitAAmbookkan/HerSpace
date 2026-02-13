'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Calendar } from '@/components/ui/Calendar';
import { fetcher } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function PeriodPage() {
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('user_id')) router.push('/');
    }, [router]);

    const handleSave = async () => {
        if (!startDate) return;
        setLoading(true);
        try {
            const userId = localStorage.getItem('user_id');
            const res = await fetcher('/add-period', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    period_start_date: startDate,
                    period_end_date: endDate
                }),
            });

            if (res.error) {
                alert(res.error);
            } else {
                alert('Period saved successfully!');
                router.push('/dashboard');
            }
        } catch (error) {
            alert('Error saving period');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-3 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
            >
                <ArrowLeft size={24} className="text-gray-600" />
            </button>

            <GlassCard className="w-full max-w-lg text-center py-16">
                <h1 className="text-3xl font-bold mb-10 text-gray-800">Select Your Period Dates</h1>
                <p className="mb-6 text-gray-500">Tap start date, then tap end date</p>

                <div className="mb-10 w-full">
                    <Calendar
                        enableRangeSelection={true}
                        onSelectRange={handleSelectRange}
                        startDate={startDate}
                        endDate={endDate}
                    />
                    <div className="mt-4 text-gray-600 space-y-1">
                        <p>Start: <span className="font-semibold">{startDate || '-'}</span></p>
                        <p>End: <span className="font-semibold">{endDate || '-'}</span></p>
                    </div>
                </div>

                <GradientButton onClick={handleSave} disabled={loading} className="w-full max-w-xs mx-auto block">
                    {loading ? 'Saving...' : 'Save Date'}
                </GradientButton>
            </GlassCard>
        </main>
    );
}
