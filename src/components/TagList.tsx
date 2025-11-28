import React, { useState, useRef } from 'react';
import { Tag, getTagColor } from './Tag';
import { TagPopup } from './TagPopup';
import { TagMenu } from './TagMenu';
import { Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { TagDefinition } from '../types';
import { useAppStore } from '../store/useAppStore';

interface TagListProps {
    tags: string[];
    allTags: TagDefinition[];
    iterationId?: string; // Needed for updating color
    storyId?: string; // Needed for removing from story
    onAddTag: (tag: string) => void;
    className?: string;
}

export const TagList = ({ tags, allTags, iterationId, storyId, onAddTag, className }: TagListProps) => {
    const { updateTagColor, updateStoryTags } = useAppStore();
    const [isHovered, setIsHovered] = useState(false);

    // Add Popup State
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const addButtonRef = useRef<HTMLButtonElement>(null);

    // Menu State
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleAddClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = addButtonRef.current?.getBoundingClientRect();
        if (rect) {
            setPopupPosition({ x: rect.left, y: rect.bottom + 5 });
        }
        setIsPopupOpen(true);
    };

    const handleTagClick = (tag: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
        setActiveTag(tag);
    };

    const handleColorChange = (color: string) => {
        if (activeTag && iterationId) {
            updateTagColor(iterationId, activeTag, color);
        }
    };

    const handleRemoveTag = () => {
        if (activeTag && iterationId && storyId) {
            const newTags = tags.filter(t => t !== activeTag);
            updateStoryTags(iterationId, storyId, newTags);
            setActiveTag(null);
        }
    };

    return (
        <div
            className={cn("flex flex-wrap items-center gap-1.5 min-h-[24px]", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {tags.map(tagName => {
                const tagDef = allTags.find(t => t.name === tagName);
                const color = tagDef?.color || getTagColor(tagName);

                return (
                    <Tag
                        key={tagName}
                        title={tagName}
                        color={color}
                        onClick={(e) => handleTagClick(tagName, e)}
                    />
                );
            })}

            {(isHovered || isPopupOpen || tags.length === 0) && (
                <button
                    ref={addButtonRef}
                    onClick={handleAddClick}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors"
                    title="Add Tag"
                >
                    <Plus size={14} />
                </button>
            )}

            <TagPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                existingTags={allTags.map(t => t.name)}
                selectedTags={tags}
                onAddTag={(tag) => {
                    onAddTag(tag);
                    setIsPopupOpen(false);
                }}
                position={popupPosition}
            />

            {activeTag && (
                <TagMenu
                    isOpen={!!activeTag}
                    onClose={() => setActiveTag(null)}
                    tagName={activeTag}
                    currentColor={allTags.find(t => t.name === activeTag)?.color || getTagColor(activeTag)}
                    onColorChange={handleColorChange}
                    onDelete={handleRemoveTag}
                    position={menuPosition}
                />
            )}
        </div>
    );
};
