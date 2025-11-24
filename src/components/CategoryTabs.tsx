import React from 'react';
import type { Category } from '../types';

interface CategoryTabsProps {
    categories: Category[];
    selectedCategoryId: string;
    onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selectedCategoryId, onSelectCategory }) => {
    return (
        <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${selectedCategoryId === cat.id
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <span className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                </button>
            ))}
        </div>
    );
};
