import React from 'react';
import { EstimateCategory } from '../../types';

type ConfidenceLevel = 'Avg' | '70%' | '80%' | '95%';

interface StoryCutoffIndicatorProps {
    categories: string[];
    allCategories: EstimateCategory[];
    confidenceLevel: ConfidenceLevel;
}

export const StoryCutoffIndicator: React.FC<StoryCutoffIndicatorProps> = ({
    categories,
    allCategories,
    confidenceLevel
}) => {
    return (
        <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-300"></div>
            <div className="relative flex gap-2">
                {categories.map(catName => {
                    const cat = allCategories.find(c => c.name === catName);
                    return (
                        <span key={catName}
                            className="px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm bg-white"
                            style={{ borderColor: cat?.color, color: cat?.color }}
                        >
                            {catName} cut off {confidenceLevel}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
