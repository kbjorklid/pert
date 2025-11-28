import { useRef, useEffect } from 'react';
import { TagInput } from './TagInput';
import { TagDefinition } from '../types';

interface TagPopupProps {
    isOpen: boolean;
    onClose: () => void;
    existingTags: TagDefinition[];
    selectedTags?: string[];
    onAddTag: (tag: string) => void;
    position: { x: number; y: number };
}

export const TagPopup = ({ isOpen, onClose, existingTags, selectedTags, onAddTag, position }: TagPopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
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
            ref={popupRef}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-64"
            style={{
                top: position.y,
                left: position.x,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <TagInput
                existingTags={existingTags}
                selectedTags={selectedTags}
                onAddTag={onAddTag}
                autoFocus
                placeholder="Type to add tag..."
            />
        </div>
    );
};
