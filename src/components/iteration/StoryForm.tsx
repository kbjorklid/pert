import React, { useState } from 'react';

interface StoryFormProps {
    onSubmit: (title: string, description: string, ticketLink: string) => void;
    onCancel: () => void;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, onCancel }) => {
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDesc, setNewStoryDesc] = useState('');
    const [newTicketLink, setNewTicketLink] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            onSubmit(newStoryTitle.trim(), newStoryDesc.trim(), newTicketLink.trim());
            setNewStoryTitle('');
            setNewStoryDesc('');
            setNewTicketLink('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Story Title</label>
                    <input
                        type="text"
                        value={newStoryTitle}
                        onChange={(e) => setNewStoryTitle(e.target.value)}
                        placeholder="e.g., Implement User Login"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                    <textarea
                        value={newStoryDesc}
                        onChange={(e) => setNewStoryDesc(e.target.value)}
                        placeholder="As a user, I want to..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Link (Optional)</label>
                    <input
                        type="text"
                        value={newTicketLink}
                        onChange={(e) => setNewTicketLink(e.target.value)}
                        placeholder="e.g., Jira URL"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Add Story
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
