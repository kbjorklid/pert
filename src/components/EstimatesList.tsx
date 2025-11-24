import React from 'react';
import { Users, Trash2 } from 'lucide-react';
import { calculatePERT } from '../utils/pert';
import type { Estimate, Category } from '../types';

interface EstimatesListProps {
    estimates: Estimate[];
    category: Category;
    onRemove: (estimateId: string) => void;
}

export const EstimatesList: React.FC<EstimatesListProps> = ({ estimates, category, onRemove }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                {category.name} Estimates ({estimates.length})
            </h3>
            {estimates.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No estimates for this category yet.</p>
            ) : (
                <div className="space-y-3">
                    {estimates.map((est) => {
                        const pert = calculatePERT(est.optimistic, est.mostLikely, est.pessimistic);
                        return (
                            <div key={est.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-slate-900">{est.userName}</span>
                                    <button
                                        onClick={() => onRemove(est.id)}
                                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-green-600 font-medium" title="Optimistic">O: {est.optimistic}</span>
                                    <span className="text-blue-600 font-medium" title="Most Likely">M: {est.mostLikely}</span>
                                    <span className="text-red-600 font-medium" title="Pessimistic">P: {est.pessimistic}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 uppercase font-medium">PERT Estimate</span>
                                    <span className="font-bold text-indigo-600">{pert.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
