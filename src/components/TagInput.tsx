import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';
import { Tag } from './Tag';

interface TagInputProps {
    existingTags: string[]; // All available tags in the iteration
    selectedTags?: string[]; // Tags currently assigned to the story (if applicable)
    onAddTag: (tag: string) => void;
    onRemoveTag?: (tag: string) => void; // If used for managing tags on a story
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

export const TagInput = ({
    existingTags,
    selectedTags = [],
    onAddTag,
    onRemoveTag,
    placeholder = 'Add tag...',
    className,
    autoFocus
}: TagInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputValue.trim()) {
            const filtered = existingTags.filter(tag =>
                tag.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedTags.includes(tag)
            );
            setSuggestions(filtered);
        } else {
            // Show all existing tags that aren't selected when input is empty
            setSuggestions(existingTags.filter(tag => !selectedTags.includes(tag)));
        }
    }, [inputValue, existingTags, selectedTags]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                onAddTag(inputValue.trim());
                setInputValue('');
                setSuggestions([]);
            }
        }
    };

    const handleSuggestionClick = (tag: string) => {
        onAddTag(tag);
        setInputValue('');
        setSuggestions([]);
        inputRef.current?.focus();
    };

    return (
        <div className={cn("relative", className)}>
            <div className="flex flex-wrap gap-1 items-center">
                {selectedTags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                        {tag}
                        {onRemoveTag && (
                            <button onClick={() => onRemoveTag(tag)} className="hover:text-red-500">
                                <X size={12} />
                            </button>
                        )}
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedTags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[80px] text-sm outline-none bg-transparent py-1"
                    autoFocus={autoFocus}
                    maxLength={20}
                />
            </div>

            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {suggestions.map(tag => (
                        <div
                            key={tag}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                            onClick={() => handleSuggestionClick(tag)}
                        >
                            <Tag title={tag} className="pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
