import { cn } from '../utils/cn';

interface TagProps {
    title: string;
    color?: string;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const PASTEL_COLORS = [
    'bg-red-200 text-red-900',
    'bg-orange-200 text-orange-900',
    'bg-amber-200 text-amber-900',
    'bg-yellow-200 text-yellow-900',
    'bg-lime-200 text-lime-900',
    'bg-green-200 text-green-900',
    'bg-emerald-200 text-emerald-900',
    'bg-teal-200 text-teal-900',
    'bg-cyan-200 text-cyan-900',
    'bg-sky-200 text-sky-900',
    'bg-blue-200 text-blue-900',
    'bg-indigo-200 text-indigo-900',
    'bg-violet-200 text-violet-900',
    'bg-purple-200 text-purple-900',
    'bg-fuchsia-200 text-fuchsia-900',
    'bg-pink-200 text-pink-900',
    'bg-rose-200 text-rose-900',
];
export const getTagColor = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PASTEL_COLORS.length;
    return PASTEL_COLORS[index];
};

export const Tag = ({ title, color, className, onClick }: TagProps) => {
    return (
        <span
            onClick={onClick}
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                color || getTagColor(title),
                onClick && 'cursor-pointer hover:opacity-80',
                className
            )}
        >
            {title}
        </span>
    );
};
