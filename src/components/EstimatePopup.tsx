import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { EstimateInputs } from './EstimateInputs';
import type { Iteration, Story, EstimateCategory } from '../types';

interface EstimatePopupProps {
    iteration: Iteration;
    story: Story;
    category: EstimateCategory;
    position: { x: number; y: number };
    onClose: () => void;
    onSave: (estimate: { categoryId: string; userName: string; optimistic: number; mostLikely: number; pessimistic: number }, estimateId?: string) => void;
}

export const EstimatePopup: React.FC<EstimatePopupProps> = ({ iteration, story, category, position, onClose, onSave }) => {
    const [userName, setUserName] = useState('');
    const [values, setValues] = useState<{ optimistic: number | string; mostLikely: number | string; pessimistic: number | string }>({
        optimistic: '',
        mostLikely: '',
        pessimistic: ''
    });
    const [existingEstimateId, setExistingEstimateId] = useState<string | undefined>(undefined);
    const popupRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Load estimate when user is selected
    useEffect(() => {
        if (userName) {
            const existing = story.estimates.find(e => e.categoryId === category.id && e.userName === userName);
            if (existing) {
                setValues({
                    optimistic: existing.optimistic,
                    mostLikely: existing.mostLikely,
                    pessimistic: existing.pessimistic
                });
                setExistingEstimateId(existing.id);
            } else {
                setValues({
                    optimistic: '',
                    mostLikely: '',
                    pessimistic: ''
                });
                setExistingEstimateId(undefined);
            }
        }
    }, [userName, story.estimates, category.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName && values.optimistic !== '' && values.mostLikely !== '' && values.pessimistic !== '') {
            onSave({
                categoryId: category.id,
                userName: userName,
                optimistic: Number(values.optimistic),
                mostLikely: Number(values.mostLikely),
                pessimistic: Number(values.pessimistic),
            }, existingEstimateId);
            onClose();
        }
    };

    // Calculate position to keep it on screen (basic logic)
    const style: React.CSSProperties = {
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 50,
    };

    return (
        <div
            ref={popupRef}
            style={style}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl w-80 animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">
                    Estimate: <span style={{ color: category.color }}>{category.name}</span>
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">User</label>
                    <select
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                        required
                        autoFocus
                    >
                        <option value="">Select user...</option>
                        {iteration.people?.map(person => (
                            <option key={person.id} value={person.name}>{person.name}</option>
                        ))}
                    </select>
                </div>

                <EstimateInputs
                    values={values}
                    onChange={setValues}
                />

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                >
                    {existingEstimateId ? 'Update Estimate' : 'Add Estimate'}
                </button>
            </form>
        </div>
    );
};
