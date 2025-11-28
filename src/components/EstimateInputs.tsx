import React from 'react';

interface EstimateInputsProps {
    values: {
        optimistic: number | string;
        mostLikely: number | string;
        pessimistic: number | string;
    };
    onChange: (values: {
        optimistic: number | string;
        mostLikely: number | string;
        pessimistic: number | string;
    }) => void;
    autoFocus?: boolean;
}

export const EstimateInputs: React.FC<EstimateInputsProps> = ({ values, onChange, autoFocus }) => {
    const handleChange = (field: keyof typeof values, value: string) => {
        onChange({
            ...values,
            [field]: value
        });
    };

    return (
        <div className="grid grid-cols-3 gap-2">
            <div>
                <label className="block text-xs font-medium text-green-600 uppercase mb-1" title="Optimistic">Opt (O)</label>
                <input
                    type="number"
                    value={values.optimistic}
                    onChange={(e) => handleChange('optimistic', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    required
                    min="0"
                    autoFocus={autoFocus}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-blue-600 uppercase mb-1" title="Most Likely">Likely (M)</label>
                <input
                    type="number"
                    value={values.mostLikely}
                    onChange={(e) => handleChange('mostLikely', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    required
                    min="0"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-red-600 uppercase mb-1" title="Pessimistic">Pess (P)</label>
                <input
                    type="number"
                    value={values.pessimistic}
                    onChange={(e) => handleChange('pessimistic', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    required
                    min="0"
                />
            </div>
        </div>
    );
};
