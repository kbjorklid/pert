import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Trash2, Users, Calculator, Save, Edit2, X } from 'lucide-react';
import { calculateStoryEstimate, calculatePERT, generateMonteCarloData, calculateConfidenceIntervals } from '../utils/pert';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const StoryView: React.FC = () => {
    const { iterationId, storyId } = useParams<{ iterationId: string; storyId: string }>();
    const { iterations, addEstimate, removeEstimate, updateStory } = useAppStore();

    const iteration = iterations.find((it) => it.id === iterationId);
    const story = iteration?.stories.find((s) => s.id === storyId);

    const [userName, setUserName] = useState('');
    const [optimistic, setOptimistic] = useState('');
    const [mostLikely, setMostLikely] = useState('');
    const [pessimistic, setPessimistic] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [newUserInput, setNewUserInput] = useState('');

    // Set default category when iteration loads
    React.useEffect(() => {
        if (iteration && iteration.categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(iteration.categories[0].id);
        }
    }, [iteration, selectedCategoryId]);

    const activeCategory = iteration?.categories.find(c => c.id === selectedCategoryId);

    // Collect all unique usernames from all stories in this iteration
    const existingUsernames = useMemo(() => {
        if (!iteration) return [];
        const names = new Set<string>();
        iteration.stories.forEach(story => {
            story.estimates.forEach(est => {
                if (est.userName && est.userName.trim()) {
                    names.add(est.userName.trim());
                }
            });
        });
        return Array.from(names).sort();
    }, [iteration]);

    const { expectedValue, standardDeviation, estimatesForCategory } = useMemo(() => {
        if (!story || !selectedCategoryId) {
            return { expectedValue: 0, standardDeviation: 0, estimatesForCategory: [] };
        }

        const filteredEstimates = story.estimates.filter(e => e.categoryId === selectedCategoryId);

        if (filteredEstimates.length === 0) {
            return { expectedValue: 0, standardDeviation: 0, estimatesForCategory: [] };
        }

        const stats = calculateStoryEstimate(filteredEstimates);

        return {
            ...stats,
            estimatesForCategory: filteredEstimates
        };
    }, [story, selectedCategoryId]);

    const { chartData, percentiles } = useMemo(() => {
        if (estimatesForCategory.length === 0) return { chartData: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 } };
        const result = generateMonteCarloData([estimatesForCategory]);
        return { chartData: result.data, percentiles: result.percentiles };
    }, [estimatesForCategory]);

    if (!iteration || !story) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900">Story not found</h2>
                <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const handleAddEstimate = (e: React.FormEvent) => {
        e.preventDefault();
        const finalUserName = isNewUser ? newUserInput.trim() : userName;
        if (finalUserName && optimistic && mostLikely && pessimistic && selectedCategoryId) {
            addEstimate(iteration.id, story.id, {
                categoryId: selectedCategoryId,
                userName: finalUserName,
                optimistic: Number(optimistic),
                mostLikely: Number(mostLikely),
                pessimistic: Number(pessimistic),
            });
            // Keep the user name selected for convenience
            if (isNewUser) {
                setUserName(finalUserName);
                setIsNewUser(false);
                setNewUserInput('');
            }
            setOptimistic('');
            setMostLikely('');
            setPessimistic('');
        }
    };

    const handleSaveEdit = () => {
        if (iterationId && storyId && editTitle.trim()) {
            updateStory(iterationId, storyId, {
                title: editTitle.trim(),
                description: editDesc.trim()
            });
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        if (story) {
            setEditTitle(story.title);
            setEditDesc(story.description || '');
            setIsEditing(true);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link to={`/iteration/${iteration.id}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1">
                    <div className="text-sm text-slate-500 mb-1">Story in {iteration.name}</div>
                    {isEditing ? (
                        <div className="space-y-2 min-w-[300px]">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                                placeholder="Story Title"
                                autoFocus
                            />
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full text-slate-500 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
                                placeholder="Description"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-indigo-700 flex items-center gap-1"
                                >
                                    <Save className="w-3 h-3" /> Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm font-medium hover:bg-slate-300 flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 group">
                                {story.title}
                                <button
                                    onClick={startEditing}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </h1>
                            {story.description && (
                                <p className="text-slate-500 mt-1 text-lg">{story.description}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                {iteration.categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
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

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Estimates List & Form */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600" />
                            Add Estimate ({activeCategory?.name})
                        </h3>
                        <form onSubmit={handleAddEstimate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">User Name</label>
                                {isNewUser ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newUserInput}
                                            onChange={(e) => setNewUserInput(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            placeholder="Enter new name"
                                            autoFocus
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewUser(false);
                                                setUserName('');
                                            }}
                                            className="px-3 py-2 text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={userName}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewUser(true);
                                                setNewUserInput('');
                                                setUserName('');
                                            } else {
                                                setUserName(e.target.value);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                    >
                                        <option value="">Select user...</option>
                                        {existingUsernames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                        <option value="__new__">+ New User...</option>
                                    </select>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-green-600 uppercase mb-1" title="Optimistic">Opt (O)</label>
                                    <input
                                        type="number"
                                        value={optimistic}
                                        onChange={(e) => setOptimistic(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 uppercase mb-1" title="Most Likely">Likely (M)</label>
                                    <input
                                        type="number"
                                        value={mostLikely}
                                        onChange={(e) => setMostLikely(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-red-600 uppercase mb-1" title="Pessimistic">Pess (P)</label>
                                    <input
                                        type="number"
                                        value={pessimistic}
                                        onChange={(e) => setPessimistic(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Submit Estimate
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-500" />
                            {activeCategory?.name} Estimates ({estimatesForCategory.length})
                        </h3>
                        {estimatesForCategory.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No estimates for this category yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {estimatesForCategory.map((est) => {
                                    const pert = calculatePERT(est.optimistic, est.mostLikely, est.pessimistic);
                                    return (
                                        <div key={est.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-slate-900">{est.userName}</span>
                                                <button
                                                    onClick={() => removeEstimate(iteration.id, story.id, est.id)}
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
                </div>

                {/* Right Column: Visualization & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                            Probability Distribution ({activeCategory?.name})
                        </h3>

                        {estimatesForCategory.length > 0 ? (
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeCategory?.color || '#4f46e5'} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={activeCategory?.color || '#4f46e5'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="value"
                                            type="number"
                                            domain={['dataMin', 'dataMax']}
                                            tickFormatter={(val) => val.toFixed(1)}
                                            stroke="#64748b"
                                            fontSize={12}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => [value.toFixed(4), 'Probability Density']}
                                            labelFormatter={(label) => `Estimate: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="probability"
                                            stroke={activeCategory?.color || '#4f46e5'}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorProb)"
                                        />
                                        {/* Percentile Lines from Monte Carlo Simulation */}
                                        <ReferenceLine
                                            x={percentiles.p50}
                                            stroke="#4f46e5"
                                            strokeDasharray="3 3"
                                            label={{ value: 'Avg', position: 'top', fill: '#4f46e5', fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            x={percentiles.p70}
                                            stroke="#f59e0b"
                                            strokeDasharray="3 3"
                                            label={{ value: '70%', position: 'top', fill: '#f59e0b', fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            x={percentiles.p80}
                                            stroke="#f97316"
                                            strokeDasharray="3 3"
                                            label={{ value: '80%', position: 'top', fill: '#f97316', fontSize: 11 }}
                                        />
                                        <ReferenceLine
                                            x={percentiles.p95}
                                            stroke="#ef4444"
                                            strokeDasharray="3 3"
                                            label={{ value: '95%', position: 'top', fill: '#ef4444', fontSize: 11 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                Add estimates to see the probability distribution
                            </div>
                        )}
                    </div>

                    {estimatesForCategory.length > 0 && (
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                    <div className="text-sm text-indigo-600 font-medium uppercase mb-1">Final PERT Estimate</div>
                                    <div className="text-4xl font-bold text-indigo-900">{expectedValue.toFixed(2)}</div>
                                    <p className="text-sm text-indigo-700 mt-2">
                                        Based on {estimatesForCategory.length} estimates.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="text-sm text-slate-500 font-medium uppercase mb-1">Uncertainty (Std Dev)</div>
                                    <div className="text-4xl font-bold text-slate-700">{standardDeviation.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Confidence Intervals</h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">50% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci50.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci50.max.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">80% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci80.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci80.max.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">95% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci95.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci95.max.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
