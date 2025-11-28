import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';
import { Tag, getTagColor } from './Tag';
import { TagDefinition } from '../types';

interface TagInputProps {
    existingTags: TagDefinition[]; // All available tags in the iteration
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
    const [suggestions, setSuggestions] = useState<TagDefinition[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputValue.trim()) {
            const filtered = existingTags.filter(tag =>
                tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedTags.includes(tag.name)
            );
            setSuggestions(filtered);
        } else {
            // Show all existing tags that aren't selected when input is empty
            setSuggestions(existingTags.filter(tag => !selectedTags.includes(tag.name)));
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
                {selectedTags.map(tagName => {
                    const tagDef = existingTags.find(t => t.name === tagName);
                    const color = tagDef?.color || getTagColor(tagName);
                    return (
                        <span key={tagName} className={cn("text-xs px-2 py-1 rounded flex items-center gap-1", color)}>
                            {tagName}
                            {onRemoveTag && (
                                <button onClick={() => onRemoveTag(tagName)} className="hover:opacity-70">
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    );
                })}
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
                            key={tag.name}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSuggestionClick(tag.name);
                            }}
                        >
                            <Tag title={tag.name} color={tag.color} className="pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
