import { useRef, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { PASTEL_COLORS } from './Tag';
import { cn } from '../utils/cn';

interface TagMenuProps {
    isOpen: boolean;
    onClose: () => void;
    tagName: string;
    currentColor: string;
    onColorChange: (color: string) => void;
    onDelete: () => void; // Remove from story
    onDeleteGlobal?: () => void; // Delete from iteration (optional, maybe for later)
    position: { x: number; y: number };
}

export const TagMenu = ({
    isOpen,
    onClose,
    tagName,
    currentColor,
    onColorChange,
    onDelete,
    position
}: TagMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-48"
            style={{
                top: position.y,
                left: position.x,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                <span className="font-medium text-sm text-gray-700 truncate" title={tagName}>{tagName}</span>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1.5">Color</label>
                <div className="grid grid-cols-5 gap-1">
                    {PASTEL_COLORS.map((color) => (
                        <button
                            key={color}
                            className={cn(
                                "w-6 h-6 rounded-full border border-transparent hover:scale-110 transition-transform",
                                color,
                                currentColor === color && "ring-2 ring-offset-1 ring-indigo-500 border-white"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onColorChange(color);
                            }}
                            title="Select Color"
                        />
                    ))}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                }}
                className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 p-1.5 rounded text-xs font-medium transition-colors"
            >
                <Trash2 size={14} />
                Remove from Story
            </button>
        </div>
    );
};
