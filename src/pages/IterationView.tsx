import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, BarChart } from 'lucide-react';
import { calculateStoryEstimate, calculateIterationStats } from '../utils/pert';

export const IterationView: React.FC = () => {
    const { iterationId } = useParams<{ iterationId: string }>();
    const { iterations, addStory, deleteStory } = useAppStore();

    const iteration = iterations.find((it) => it.id === iterationId);

    const [isCreating, setIsCreating] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDesc, setNewStoryDesc] = useState('');
    const [confidenceLevel, setConfidenceLevel] = useState<50 | 80 | 95>(95);

    if (!iteration) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900">Iteration not found</h2>
                <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            addStory(iteration.id, newStoryTitle.trim(), newStoryDesc.trim());
            setNewStoryTitle('');
            setNewStoryDesc('');
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{iteration.name}</h1>
                    <p className="text-slate-500 mt-1">
                        {iteration.stories.length} stories • Created {new Date(iteration.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {iteration.stories.length > 0 && (
                <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart className="w-5 h-5 text-indigo-300" />
                        <h2 className="text-lg font-semibold">Iteration Forecast</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-indigo-300 text-sm font-medium uppercase mb-1">Total Expected</div>
                            <div className="text-3xl font-bold">
                                {calculateIterationStats(iteration.stories).totalExpectedValue.toFixed(1)}
                            </div>
                        </div>
                        <div>
                            <div className="text-indigo-300 text-sm font-medium uppercase mb-1">Uncertainty (σ)</div>
                            <div className="text-3xl font-bold">
                                {calculateIterationStats(iteration.stories).totalStandardDeviation.toFixed(1)}
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-indigo-800/50 rounded-lg p-3 border border-indigo-700">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-indigo-300 text-xs font-medium uppercase">{confidenceLevel}% Confidence Interval</div>
                                <div className="flex bg-indigo-900/50 rounded-lg p-0.5 border border-indigo-700/50">
                                    {[50, 80, 95].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setConfidenceLevel(level as 50 | 80 | 95)}
                                            className={`px-2 py-0.5 text-xs font-medium rounded-md transition-colors ${confidenceLevel === level
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-indigo-300 hover:text-white hover:bg-indigo-800'
                                                }`}
                                        >
                                            {level}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {calculateIterationStats(iteration.stories)[`ci${confidenceLevel}`].min.toFixed(1)}
                                </span>
                                <span className="text-indigo-400">to</span>
                                <span className="text-2xl font-bold">
                                    {calculateIterationStats(iteration.stories)[`ci${confidenceLevel}`].max.toFixed(1)}
                                </span>
                            </div>
                            <div className="text-xs text-indigo-400 mt-1">
                                There is a {confidenceLevel}% chance the iteration will finish within this range.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Stories</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Story
                </button>
            </div>

            {isCreating && (
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
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Add Story
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {iteration.stories.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No stories yet</h3>
                        <p className="text-slate-500">Add a story to start estimating.</p>
                    </div>
                ) : (
                    iteration.stories.map((story) => {
                        const { expectedValue } = calculateStoryEstimate(story.estimates);
                        return (
                            <div
                                key={story.id}
                                className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                            >
                                <Link to={`/iteration/${iteration.id}/story/${story.id}`} className="flex-1">
                                    <div className="flex items-center justify-between mr-8">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {story.title}
                                            </h3>
                                            {story.description && (
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{story.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm text-slate-500">Estimates</div>
                                                <div className="font-medium text-slate-900">{story.estimates.length}</div>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-sm text-slate-500">PERT Avg</div>
                                                <div className="font-bold text-indigo-600 text-lg">
                                                    {expectedValue > 0 ? expectedValue.toFixed(1) : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-4">
                                    <Link
                                        to={`/iteration/${iteration.id}/story/${story.id}`}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => deleteStory(iteration.id, story.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                        title="Delete Story"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
