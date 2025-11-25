import React, { useState, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Save } from 'lucide-react';

interface QuickAddStoriesProps {
    onSave: (stories: { title: string; description?: string; ticketLink?: string }[], position: 'top' | 'bottom') => void;
    onCancel: () => void;
    initialAddToTop: boolean;
    onAddToTopChange: (addToTop: boolean) => void;
}

interface StoryDraft {
    id: string;
    title: string;
    description: string;
    ticketLink: string;
    isOpen: boolean;
}

export const QuickAddStories: React.FC<QuickAddStoriesProps> = ({ onSave, onCancel, initialAddToTop, onAddToTopChange }) => {
    const [stories, setStories] = useState<StoryDraft[]>([
        { id: Math.random().toString(), title: '', description: '', ticketLink: '', isOpen: false }
    ]);
    const [showAllDescriptions, setShowAllDescriptions] = useState(false);
    const [addToTop, setAddToTop] = useState(initialAddToTop);

    const handleAddToTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        setAddToTop(newValue);
        onAddToTopChange(newValue);
    };

    // Refs for managing focus
    const titleRefs = useRef<(HTMLInputElement | null)[]>([]);
    const descRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
    const linkRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleTitleChange = (index: number, value: string) => {
        const newStories = [...stories];
        newStories[index].title = value;
        setStories(newStories);

        // If typing in the last field, add a new one
        if (index === stories.length - 1 && value.trim() !== '') {
            setStories(prev => [
                ...prev,
                { id: Math.random().toString(), title: '', description: '', ticketLink: '', isOpen: showAllDescriptions }
            ]);
        }
    };

    const handleTicketLinkChange = (index: number, value: string) => {
        const newStories = [...stories];
        newStories[index].ticketLink = value;
        setStories(newStories);
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const newStories = [...stories];
        newStories[index].description = value;
        setStories(newStories);
    };

    const toggleRowOpen = (index: number) => {
        const newStories = [...stories];
        newStories[index].isOpen = !newStories[index].isOpen;
        setStories(newStories);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'title' | 'description' | 'ticketLink') => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const currentStory = stories[index];
            const isDescriptionVisible = showAllDescriptions || currentStory.isOpen;

            if (field === 'title') {
                if (isDescriptionVisible) {
                    // Move to description
                    descRefs.current[index]?.focus();
                } else {
                    // Move to ticket link if visible, else next title
                    if (isDescriptionVisible) {
                        linkRefs.current[index]?.focus();
                    } else if (index + 1 < stories.length) {
                        titleRefs.current[index + 1]?.focus();
                    }
                }
            } else if (field === 'description') {
                // Move to ticket link
                linkRefs.current[index]?.focus();
            } else if (field === 'ticketLink') {
                // Move to next title
                if (index + 1 < stories.length) {
                    titleRefs.current[index + 1]?.focus();
                }
            }
        } else if (e.key === 'Tab' && e.shiftKey) {
            // Handle Shift+Tab if needed
        }
    };

    const handleSave = () => {
        const validStories = stories
            .filter(s => s.title.trim() !== '')
            .map(s => ({ title: s.title, description: s.description.trim() || undefined, ticketLink: s.ticketLink.trim() || undefined }));

        if (validStories.length > 0) {
            onSave(validStories, addToTop ? 'top' : 'bottom');
        } else {
            onCancel();
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Quick Add Stories</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={addToTop}
                            onChange={handleAddToTopChange}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Add to top
                    </label>
                    <div className="h-4 w-px bg-slate-200" />
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showAllDescriptions}
                            onChange={(e) => setShowAllDescriptions(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Show all descriptions
                    </label>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {stories.map((story, index) => {
                    const isDescriptionVisible = showAllDescriptions || story.isOpen;

                    return (
                        <div key={story.id} className="group relative">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => toggleRowOpen(index)}
                                    className={`mt-3 text-slate-400 hover:text-indigo-600 transition-colors ${showAllDescriptions ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={showAllDescriptions}
                                    tabIndex={-1}
                                >
                                    {isDescriptionVisible ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>

                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={el => titleRefs.current[index] = el}
                                        type="text"
                                        placeholder={`Story ${index + 1} title`}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={story.title}
                                        onChange={(e) => handleTitleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'title')}
                                        autoFocus={index === 0}
                                    />

                                    {isDescriptionVisible && (
                                        <textarea
                                            ref={el => descRefs.current[index] = el}
                                            placeholder="Description (optional)"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm min-h-[60px]"
                                            value={story.description}
                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                                        />
                                    )}

                                    {isDescriptionVisible && (
                                        <input
                                            ref={el => linkRefs.current[index] = el}
                                            type="text"
                                            placeholder="Ticket Link (optional)"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                            value={story.ticketLink}
                                            onChange={(e) => handleTicketLinkChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'ticketLink')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Create Stories
                </button>
            </div>
        </div>
    );
};
