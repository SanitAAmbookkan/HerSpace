'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { fetcher } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function PeriodPage() {
    const router = useRouter();
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('user_id')) router.push('/');
    }, [router]);

    const handleSave = async () => {
        if (!date) return;
        setLoading(true);
        try {
            const userId = localStorage.getItem('user_id');
            const res = await fetcher('/add-period', {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, period_start_date: date }),
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

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-3 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
            >
                <ArrowLeft size={24} className="text-gray-600" />
            </button>

            <GlassCard className="w-full max-w-lg text-center py-16">
                <h1 className="text-3xl font-bold mb-10 text-gray-800">Select Your Period Start Date</h1>

                <div className="mb-10 max-w-xs mx-auto">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-center text-xl p-4 cursor-pointer"
                    />
                </div>

                <GradientButton onClick={handleSave} disabled={loading} className="w-full max-w-xs mx-auto block">
                    {loading ? 'Saving...' : 'Save Date'}
                </GradientButton>
            </GlassCard>
        </main>
    );
}
