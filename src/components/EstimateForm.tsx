import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { EstimateInputs } from './EstimateInputs';
import type { Category, Iteration } from '../types';

interface EstimateFormProps {
    iteration: Iteration;
    category: Category;
    onSubmit: (estimate: { categoryId: string; userName: string; optimistic: number; mostLikely: number; pessimistic: number }) => void;
}

export const EstimateForm: React.FC<EstimateFormProps> = ({ iteration, category, onSubmit }) => {
    const [userName, setUserName] = useState('');
    const [optimistic, setOptimistic] = useState('');
    const [mostLikely, setMostLikely] = useState('');
    const [pessimistic, setPessimistic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName && optimistic && mostLikely && pessimistic) {
            onSubmit({
                categoryId: category.id,
                userName: userName,
                optimistic: Number(optimistic),
                mostLikely: Number(mostLikely),
                pessimistic: Number(pessimistic),
            });
            setOptimistic('');
            setMostLikely('');
            setPessimistic('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add Estimate ({category.name})
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">User Name</label>
                    <select
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                    >
                        <option value="">Select user...</option>
                        {iteration.people?.map(person => (
                            <option key={person.id} value={person.name}>{person.name}</option>
                        ))}
                    </select>
                </div>
                <EstimateInputs
                    values={{ optimistic, mostLikely, pessimistic }}
                    onChange={(vals) => {
                        setOptimistic(String(vals.optimistic));
                        setMostLikely(String(vals.mostLikely));
                        setPessimistic(String(vals.pessimistic));
                    }}
                />
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    Submit Estimate
                </button>
            </form>
        </div>
    );
};
