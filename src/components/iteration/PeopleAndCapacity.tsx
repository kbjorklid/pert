import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Iteration, Person } from '../../types';

interface PeopleAndCapacityProps {
    iteration: Iteration;
    addPerson: (iterationId: string, name: string) => void;
    removePerson: (iterationId: string, personId: string) => void;
    updatePerson: (iterationId: string, personId: string, updates: Partial<Person>) => void;
    updatePersonCapacity: (iterationId: string, personId: string, categoryId: string, capacity: number) => void;
    updateTeamAvailability: (iterationId: string, availability: number) => void;
}

export const PeopleAndCapacity: React.FC<PeopleAndCapacityProps> = ({
    iteration,
    addPerson,
    removePerson,
    updatePerson,
    updatePersonCapacity,
    updateTeamAvailability
}) => {
    const [newPersonName, setNewPersonName] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    const handleAddPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPersonName.trim()) {
            addPerson(iteration.id, newPersonName.trim());
            setNewPersonName('');
        }
    };

    const startEditingName = (person: Person) => {
        setEditingNameId(person.id);
        setEditNameValue(person.name);
    };

    const saveName = (personId: string) => {
        if (editNameValue.trim()) {
            updatePerson(iteration.id, personId, { name: editNameValue.trim() });
        }
        setEditingNameId(null);
    };

    const handleDeletePerson = (personId: string, personName: string) => {
        if (window.confirm(`Are you sure you want to remove ${personName}?`)) {
            removePerson(iteration.id, personId);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <h3 className="text-lg font-semibold text-slate-900">
                        People & Capacity
                    </h3>
                    {!isExpanded && (
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{iteration.people?.length || 0} People</span>
                            <span>•</span>
                            <span>{Math.round((iteration.teamAvailability ?? 0.7) * 100)}% Efficiency</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" onClick={e => e.stopPropagation()}>
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

            {isExpanded && (
                <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
                    {/* Header Row */}
                    <div className="grid gap-4 items-center mt-4" style={{ gridTemplateColumns: `200px repeat(${iteration.categories.length}, 1fr) 40px` }}>
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
                        <div key={person.id} className="grid gap-4 items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group" style={{ gridTemplateColumns: `200px repeat(${iteration.categories.length}, 1fr) 40px` }}>
                            <div>
                                {editingNameId === person.id ? (
                                    <input
                                        type="text"
                                        className="font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-full focus:border-indigo-500 outline-none"
                                        value={editNameValue}
                                        onChange={(e) => setEditNameValue(e.target.value)}
                                        onBlur={() => saveName(person.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveName(person.id);
                                            if (e.key === 'Escape') setEditingNameId(null);
                                        }}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 group/name">
                                        <div className="font-medium text-slate-900">{person.name}</div>
                                        <button
                                            onClick={() => startEditingName(person)}
                                            className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500">Avail:</span>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="w-12 px-1 py-0.5 text-xs border border-transparent hover:border-slate-300 bg-transparent hover:bg-white rounded text-right focus:border-indigo-500 focus:bg-white outline-none transition-colors"
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
                                <button
                                    onClick={() => handleDeletePerson(person.id, person.name)}
                                    className="text-slate-400 hover:text-red-600 p-1 opacity-100 transition-opacity"
                                    title="Remove Person"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
            )}
        </div>
    );
};
