import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, X, ExternalLink } from 'lucide-react';
import type { Iteration, Story } from '../types';

import { TagList } from './TagList';
import { useAppStore } from '../store/useAppStore';

interface StoryHeaderProps {
    iteration: Iteration;
    story: Story;
    onUpdate: (title: string, description: string, ticketLink: string) => void;
}

export const StoryHeader = ({ iteration, story, onUpdate }: StoryHeaderProps) => {
    const { addTag, updateStoryTags } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(story.title);
    const [description, setDescription] = useState(story.description || '');
    const [ticketLink, setTicketLink] = useState(story.ticketLink || '');

    const handleSave = () => {
        if (title.trim()) {
            onUpdate(title.trim(), description.trim(), ticketLink.trim());
            setIsEditing(false);
        }
    };

    const handleAddTag = (tag: string) => {
        // If tag doesn't exist in iteration, add it
        if (!iteration.tags?.some(t => t.name === tag)) {
            addTag(iteration.id, tag);
        }
        // Add tag to story if not already present
        if (!story.tags?.includes(tag)) {
            const newTags = [...(story.tags || []), tag];
            updateStoryTags(iteration.id, story.id, newTags);
        }
    };

    const startEditing = () => {
        setTitle(story.title);
        setDescription(story.description || '');
        setTicketLink(story.ticketLink || '');
        setIsEditing(true);
    };

    return (
        <div className="flex items-center gap-4">
            <Link to={`/iteration/${iteration.id}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1">
                <div className="text-sm text-slate-500 mb-1">Story in {iteration.name}</div>
                {isEditing ? (
                    <div className="space-y-2 min-w-[300px]">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                            placeholder="Story Title"
                            autoFocus
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full text-slate-500 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                            placeholder="Description"
                            rows={2}
                        />
                        <input
                            type="text"
                            value={ticketLink}
                            onChange={(e) => setTicketLink(e.target.value)}
                            className="w-full text-sm text-slate-500 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                            placeholder="Ticket Link (e.g., Jira URL)"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-indigo-700 flex items-center gap-1"
                            >
                                <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm font-medium hover:bg-slate-300 flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 group">
                                {story.title}
                                {story.ticketLink && (
                                    <a
                                        href={story.ticketLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Open Ticket"
                                    >
                                        <ExternalLink className="w-6 h-6" />
                                    </a>
                                )}
                                <button
                                    onClick={startEditing}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </h1>
                            <div className="flex items-center gap-4">
                                <TagList
                                    tags={story.tags || []}
                                    allTags={iteration.tags || []}
                                    iterationId={iteration.id}
                                    storyId={story.id}
                                    onAddTag={handleAddTag}
                                />
                            </div>
                            {story.description && (
                                <p className="text-lg text-slate-600 max-w-3xl">{story.description}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
