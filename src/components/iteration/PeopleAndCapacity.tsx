import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Iteration, EstimateCategory, Person } from '../../types';

interface PeopleAndCapacityProps {
    iteration: Iteration;
    isManagingPeople: boolean;
    setIsManagingPeople: (value: boolean) => void;
    addPerson: (iterationId: string, name: string) => void;
    removePerson: (iterationId: string, personId: string) => void;
    updatePerson: (iterationId: string, personId: string, updates: Partial<Person>) => void;
    updatePersonCapacity: (iterationId: string, personId: string, categoryId: string, capacity: number) => void;
    updateTeamAvailability: (iterationId: string, availability: number) => void;
}

export const PeopleAndCapacity: React.FC<PeopleAndCapacityProps> = ({
    iteration,
    isManagingPeople,
    setIsManagingPeople,
    addPerson,
    removePerson,
    updatePerson,
    updatePersonCapacity,
    updateTeamAvailability
}) => {
    const [newPersonName, setNewPersonName] = useState('');

    const handleAddPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPersonName.trim()) {
            addPerson(iteration.id, newPersonName.trim());
            setNewPersonName('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                        People & Capacity
                    </h3>
                    <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-medium">Team Efficiency:</span>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            className="w-16 px-2 py-0.5 border border-slate-300 rounded text-right text-slate-900 font-medium focus:border-indigo-500 outline-none"
                            value={Math.round((iteration.teamAvailability ?? 0.7) * 100)}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateTeamAvailability(iteration.id, Math.min(100, Math.max(1, val)) / 100);
                            }}
                        />
                        <span className="text-slate-500">%</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsManagingPeople(!isManagingPeople)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    {isManagingPeople ? 'Done Managing People' : 'Manage People'}
                </button>
            </div>

            <div className="space-y-4">
                {/* Header Row */}
                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `200px repeat(${iteration.categories.length}, 1fr) 40px` }}>
                    <div className="font-medium text-slate-500 text-sm">Person</div>
                    {iteration.categories.map(cat => (
                        <div key={cat.id} className="font-medium text-slate-500 text-sm text-center" style={{ color: cat.color }}>
                            {cat.name}
                        </div>
                    ))}
                    <div></div>
                </div>

                {/* People Rows */}
                {iteration.people?.map(person => (
                    <div key={person.id} className="grid gap-4 items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors" style={{ gridTemplateColumns: `200px repeat(${iteration.categories.length}, 1fr) 40px` }}>
                        <div>
                            {isManagingPeople ? (
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        className="font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-full focus:border-indigo-500 outline-none"
                                        value={person.name}
                                        onChange={(e) => updatePerson(iteration.id, person.id, { name: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Avail:</span>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                className="w-12 px-1 py-0.5 text-xs border border-slate-300 rounded text-right focus:border-indigo-500 outline-none"
                                                value={Math.round((person.availability ?? 1) * 100)}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    updatePerson(iteration.id, person.id, { availability: Math.min(100, Math.max(1, val)) / 100 });
                                                }}
                                            />
                                            <span className="text-xs text-slate-500 ml-0.5">%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="font-medium text-slate-900">{person.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {Math.round((person.availability ?? 1) * 100)}% Avail
                                    </div>
                                </div>
                            )}
                        </div>
                        {iteration.categories.map(cat => (
                            <div key={cat.id} className="flex justify-center">
                                <input
                                    type="number"
                                    min="0"
                                    className="w-20 px-2 py-1 border border-slate-300 rounded text-center focus:border-indigo-500 outline-none"
                                    value={person.capacities[cat.id] || 0}
                                    onChange={(e) => updatePersonCapacity(iteration.id, person.id, cat.id, parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ))}
                        <div className="flex justify-end">
                            {isManagingPeople && (
                                <button
                                    onClick={() => removePerson(iteration.id, person.id)}
                                    className="text-slate-400 hover:text-red-600 p-1"
                                    title="Remove Person"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Person Form */}
                <form onSubmit={handleAddPerson} className="grid gap-4 items-center p-3 border border-dashed border-slate-300 rounded-lg" style={{ gridTemplateColumns: `200px 1fr` }}>
                    <input
                        type="text"
                        placeholder="Add New Person..."
                        className="bg-transparent outline-none text-sm font-medium"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                    />
                    <button type="submit" className="text-indigo-600 hover:text-indigo-800 justify-self-start">
                        <Plus className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
