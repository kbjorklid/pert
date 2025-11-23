import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Calendar, ChevronRight, Copy } from 'lucide-react';


export const Dashboard: React.FC = () => {
    const { iterations, addIteration, deleteIteration, duplicateIteration } = useAppStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newIterationName, setNewIterationName] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newIterationName.trim()) {
            addIteration(newIterationName.trim());
            setNewIterationName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Iterations</h1>
                    <p className="text-slate-500 mt-1">Manage your estimation cycles</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    New Iteration
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="flex gap-4">
                        <input
                            type="text"
                            value={newIterationName}
                            onChange={(e) => setNewIterationName(e.target.value)}
                            placeholder="Iteration Name (e.g., Sprint 24)"
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Create
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {iterations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No iterations yet</h3>
                        <p className="text-slate-500">Create your first iteration to start estimating stories.</p>
                    </div>
                ) : (
                    iterations.map((iteration) => (
                        <div
                            key={iteration.id}
                            className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                        >
                            <Link to={`/iteration/${iteration.id}`} className="flex-1">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                        {iteration.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {iteration.name}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {iteration.stories.length} stories • Created {new Date(iteration.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                            <div className="flex items-center gap-4">
                                <Link
                                    to={`/iteration/${iteration.id}`}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => duplicateIteration(iteration.id)}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                                    title="Duplicate Iteration"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteIteration(iteration.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                    title="Delete Iteration"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
