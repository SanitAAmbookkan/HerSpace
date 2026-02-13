import React from 'react';
import { cn } from '@/lib/utils';

interface NeumorphicBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const NeumorphicBox: React.FC<NeumorphicBoxProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "neumorphic rounded-[30px] p-6 transition-all duration-300 hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-center hover:shadow-[15px_15px_30px_rgba(174,174,192,0.3),-15px_-15px_30px_rgba(255,255,255,1)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
