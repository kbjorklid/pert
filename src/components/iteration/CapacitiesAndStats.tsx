import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Iteration, EstimateCategory } from '../../types';

type ConfidenceLevel = 'Avg' | '70%' | '80%' | '95%';

interface CategoryGraphData {
    id: string;
    name: string;
    color: string;
    requiredCapacity: number;
    availableCapacity: number;
    expectedValue: number;
    hasEstimates: boolean;
    chartData: any[];
    minVal: number;
    maxVal: number;
}

interface CapacitiesAndStatsProps {
    iteration: Iteration;
    categoryGraphData: CategoryGraphData[];
    confidenceLevel: ConfidenceLevel;
    isManagingCats: boolean;
    setIsManagingCats: (value: boolean) => void;
    addCategory: (iterationId: string, name: string, color: string) => void;
    removeCategory: (iterationId: string, categoryId: string) => void;
    updateCategory: (iterationId: string, categoryId: string, updates: Partial<EstimateCategory>) => void;
}

export const CapacitiesAndStats: React.FC<CapacitiesAndStatsProps> = ({
    iteration,
    categoryGraphData,
    confidenceLevel,
    isManagingCats,
    setIsManagingCats,
    addCategory,
    removeCategory,
    updateCategory
}) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6366f1'); // Default indigo

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCatName.trim()) {
            addCategory(iteration.id, newCatName.trim(), newCatColor);
            setNewCatName('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                    Capacities & Stats ({confidenceLevel === 'Avg' ? 'Average' : `${confidenceLevel} Certainty`})
                </h3>
                <button
                    onClick={() => setIsManagingCats(!isManagingCats)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    {isManagingCats ? 'Done Managing Categories' : 'Manage Categories'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {iteration.categories.map(cat => {
                    const graphData = categoryGraphData.find(g => g.id === cat.id);
                    const requiredCapacity = graphData?.requiredCapacity || 0;
                    const availableCapacity = iteration.capacities[cat.id] || 0;
                    const isOver = requiredCapacity > availableCapacity;

                    return (
                        <div key={cat.id} className={`flex flex-col p-3 rounded-lg border ${isOver ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    {isManagingCats ? (
                                        <>
                                            <input
                                                type="color"
                                                className="w-5 h-5 rounded cursor-pointer border-none p-0"
                                                value={cat.color}
                                                onChange={(e) => updateCategory(iteration.id, cat.id, { color: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="font-medium text-slate-700 bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none w-full"
                                                value={cat.name}
                                                onChange={(e) => updateCategory(iteration.id, cat.id, { name: e.target.value })}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                            <span className="font-medium text-slate-700">{cat.name}</span>
                                        </>
                                    )}
                                </div>
                                {isManagingCats && (
                                    <button
                                        onClick={() => removeCategory(iteration.id, cat.id)}
                                        className="text-slate-400 hover:text-red-600 ml-2"
                                        title="Remove Category"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="text-slate-500">Total Capacity:</div>
                                <div className="font-semibold text-slate-900">{availableCapacity.toFixed(1)}</div>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <div className="text-slate-500">Required:</div>
                                <div className={`font-bold ${isOver ? 'text-red-600' : 'text-slate-700'}`}>
                                    {requiredCapacity.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isManagingCats && (
                    <form onSubmit={handleAddCategory} className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-lg">
                        <input
                            type="text"
                            placeholder="New Category"
                            className="flex-1 bg-transparent outline-none text-sm"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                        />
                        <input
                            type="color"
                            className="w-6 h-6 rounded cursor-pointer"
                            value={newCatColor}
                            onChange={(e) => setNewCatColor(e.target.value)}
                        />
                        <button type="submit" className="text-indigo-600 hover:text-indigo-800">
                            <Plus className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
