import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, X } from 'lucide-react';
import type { Iteration, Story } from '../types';

interface StoryHeaderProps {
    iteration: Iteration;
    story: Story;
    onUpdate: (title: string, description: string, ticketLink: string) => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({ iteration, story, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTicketLink, setEditTicketLink] = useState('');

    const handleSaveEdit = () => {
        if (editTitle.trim()) {
            onUpdate(editTitle.trim(), editDesc.trim(), editTicketLink.trim());
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        setEditTitle(story.title);
        setEditDesc(story.description || '');
        setEditTicketLink(story.ticketLink || '');
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
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                            placeholder="Story Title"
                            autoFocus
                        />
                        <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full text-slate-500 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                            placeholder="Description"
                            rows={2}
                        />
                        <input
                            type="text"
                            value={editTicketLink}
                            onChange={(e) => setEditTicketLink(e.target.value)}
                            className="w-full text-sm text-slate-500 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                            placeholder="Ticket Link (e.g., Jira URL)"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveEdit}
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
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 group">
                            {story.title}
                            <button
                                onClick={startEditing}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </h1>
                        {story.description && (
                            <p className="text-slate-500 mt-1 text-lg">{story.description}</p>
                        )}
                        {story.ticketLink && (
                            <a
                                href={story.ticketLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
                            >
                                {story.ticketLink}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
