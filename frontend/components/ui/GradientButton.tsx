import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ children, className, ...props }) => {
    return (
        <button
            className={cn(
                "bg-gradient-to-r from-[#FFD1DC] via-[#E6E6FA] to-[#C1E1FF] text-gray-700 font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 border-none outline-none text-lg",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
