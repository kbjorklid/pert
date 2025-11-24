import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Calendar, ChevronRight, Copy, Download, Upload, AlertTriangle, Pencil, Settings } from 'lucide-react';
import { AlgorithmRegistry, AlgorithmType } from '../utils/algorithms/AlgorithmRegistry';


export const Dashboard: React.FC = () => {
    const { iterations, addIteration, deleteIteration, duplicateIteration, importData, updateIteration, algorithm, setAlgorithm } = useAppStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newIterationName, setNewIterationName] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newIterationName.trim()) {
            addIteration(newIterationName.trim());
            setNewIterationName('');
            setIsCreating(false);
        }
    };

    const handleExport = () => {
        const data = useAppStore.getState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pert-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setPendingImportData(data);
                setShowImportModal(true);
            } catch (error) {
                alert('Failed to parse JSON file');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const confirmImport = (mode: 'replace' | 'add') => {
        if (pendingImportData) {
            importData(pendingImportData, mode);
            setShowImportModal(false);
            setPendingImportData(null);
        }
    };

    const handleStartEdit = (iterationId: string, currentName: string) => {
        setEditingId(iterationId);
        setEditValue(currentName);
    };

    const handleSaveEdit = (iterationId: string) => {
        if (editValue.trim() && editValue !== iterations.find(it => it.id === iterationId)?.name) {
            updateIteration(iterationId, { name: editValue.trim() });
        }
        setEditingId(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Iterations</h1>
                    <p className="text-slate-500 mt-1">Manage your estimation cycles</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="bg-white text-slate-600 px-4 py-2 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-white text-slate-600 px-4 py-2 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        title="Export Data"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="bg-white text-slate-600 px-4 py-2 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        title="Import Data"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        New Iteration
                    </button>
                </div>
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

            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold text-slate-900">Import Data</h3>
                        </div>
                        <p className="text-slate-600 mb-6">
                            How would you like to import this data? You can either replace your current data entirely or add the imported iterations to your existing data.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => confirmImport('add')}
                                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add to existing data
                            </button>
                            <button
                                onClick={() => confirmImport('replace')}
                                className="w-full bg-white text-red-600 border border-red-200 px-4 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Replace existing data
                            </button>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="w-full text-slate-500 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-slate-700 mb-4">
                            <Settings className="w-6 h-6" />
                            <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Estimation Algorithm
                                </label>
                                <select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                >
                                    {AlgorithmRegistry.getAvailableAlgorithms().map((algo) => (
                                        <option key={algo.type} value={algo.type}>
                                            {algo.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    {algorithm === 'monte-carlo'
                                        ? 'Simulates thousands of scenarios to estimate risk.'
                                        : 'Uses statistical moments to fit a Beta distribution. Faster and smoother.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
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
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                    {iteration.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 group/title">
                                        {editingId === iteration.id ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(iteration.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                                onBlur={() => handleSaveEdit(iteration.id)}
                                                className="text-lg font-semibold text-slate-900 border border-indigo-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <Link to={`/iteration/${iteration.id}`}>
                                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {iteration.name}
                                                    </h3>
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleStartEdit(iteration.id, iteration.name);
                                                    }}
                                                    className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1 hover:bg-indigo-50 rounded"
                                                    title="Edit title"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {iteration.stories.length} stories • Created {new Date(iteration.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
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
        </div >
    );
};
