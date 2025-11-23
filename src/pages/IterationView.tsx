import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, GripVertical, Settings, X, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { calculateStoryEstimate, generateMonteCarloData } from '../utils/pert';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Story, EstimateCategory, Estimate } from '../types';

// Sortable Story Item Component
const SortableStoryItem = ({
    story,
    iterationId,
    deleteStory,
    categories,
    categoryStats
}: {
    story: Story;
    iterationId: string;
    deleteStory: (itId: string, sId: string) => void;
    categories: EstimateCategory[];
    categoryStats: Record<string, { expectedValue: number }>;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: story.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
            <div className="flex items-center gap-3 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                </div>
                <Link to={`/iteration/${iterationId}/story/${story.id}`} className="flex-1">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {story.title}
                            </h3>
                            {story.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{story.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            {categories.map(cat => (
                                <div key={cat.id} className="text-right min-w-[60px]">
                                    <div className="text-xs text-slate-500 uppercase" style={{ color: cat.color }}>{cat.name}</div>
                                    <div className="font-bold text-lg text-slate-700">
                                        {categoryStats[cat.id]?.expectedValue > 0
                                            ? categoryStats[cat.id].expectedValue.toFixed(1)
                                            : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <Link
                    to={`/iteration/${iterationId}/story/${story.id}`}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
                <button
                    onClick={() => deleteStory(iterationId, story.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    title="Delete Story"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

type ConfidenceLevel = 'Avg' | '70%' | '80%' | '95%';

export const IterationView: React.FC = () => {
    const { iterationId } = useParams<{ iterationId: string }>();
    const {
        iterations,
        addStory,
        deleteStory,
        reorderStories,
        updateIteration,
        addCategory,
        removeCategory,
        updateCategory,
        // Person Management
        addPerson,
        removePerson,
        updatePerson,
        updatePersonCapacity,
        updateTeamAvailability
    } = useAppStore();

    const iteration = iterations.find((it) => it.id === iterationId);

    const [isCreating, setIsCreating] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDesc, setNewStoryDesc] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    // Category Management State
    const [isManagingCats, setIsManagingCats] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6366f1'); // Default indigo

    // Person Management State
    const [newPersonName, setNewPersonName] = useState('');
    const [isManagingPeople, setIsManagingPeople] = useState(false);

    // Confidence Level State
    const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('Avg');
    const [showGraphs, setShowGraphs] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!iteration) return <div>Iteration not found</div>;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            addStory(iteration.id, newStoryTitle.trim(), newStoryDesc.trim());
            setNewStoryTitle('');
            setNewStoryDesc('');
            setIsCreating(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = iteration.stories.findIndex((s) => s.id === active.id);
            const newIndex = iteration.stories.findIndex((s) => s.id === over.id);
            reorderStories(iteration.id, arrayMove(iteration.stories, oldIndex, newIndex));
        }
    };

    const handleTitleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (titleInput.trim()) {
            updateIteration(iteration.id, { name: titleInput.trim() });
            setIsEditingTitle(false);
        }
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCatName.trim()) {
            addCategory(iteration.id, newCatName.trim(), newCatColor);
            setNewCatName('');
        }
    };

    const handleAddPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPersonName.trim()) {
            addPerson(iteration.id, newPersonName.trim());
            setNewPersonName('');
        }
    };

    // --- Calculation Logic ---
    // Calculate total required capacity per category (for z-score fallback calculations if needed)
    const totalStats: Record<string, { ev: number, var: number }> = {};
    iteration.categories.forEach(cat => totalStats[cat.id] = { ev: 0, var: 0 });

    iteration.stories.forEach(story => {
        iteration.categories.forEach(cat => {
            const catEstimates = story.estimates.filter(e => e.categoryId === cat.id);
            const { expectedValue, standardDeviation } = calculateStoryEstimate(catEstimates);
            totalStats[cat.id].ev += expectedValue;
            totalStats[cat.id].var += Math.pow(standardDeviation, 2);
        });
    });

    // Optimization: Create stable dependencies for expensive calculations
    // We only want to re-run simulations if the actual numbers (estimates) or structure (categories) change.
    // We do NOT want to re-run if just a title or color changes.
    const estimatesString = useMemo(() => {
        return JSON.stringify(iteration.stories.map(s => s.estimates));
    }, [iteration.stories]);

    const categoryIdsString = useMemo(() => {
        return iteration.categories.map(c => c.id).join(',');
    }, [iteration.categories]);

    // Step 1: Cache cumulative Monte Carlo results for story cutoffs - ONLY depends on estimates/structure
    const cumulativeMonteCarloResults = useMemo(() => {
        const results: Record<string, Record<number, { p50: number, p70: number, p80: number, p95: number }>> = {};
        const allEstimates = JSON.parse(estimatesString) as Estimate[][];
        const categoryIds = categoryIdsString.split(',');

        categoryIds.forEach(catId => {
            results[catId] = {};

            allEstimates.forEach((_, storyIndex) => {
                // Collect all stories up to and including current index for this category
                const storiesUpToIndex: any[] = [];
                for (let i = 0; i <= storyIndex; i++) {
                    const estimates = allEstimates[i].filter((e: Estimate) => e.categoryId === catId);
                    if (estimates.length > 0) {
                        storiesUpToIndex.push(estimates);
                    }
                }

                // Run Monte Carlo simulation for cumulative stories and cache all percentiles
                if (storiesUpToIndex.length > 0) {
                    const result = generateMonteCarloData(storiesUpToIndex);
                    results[catId][storyIndex] = result.percentiles;
                }
            });
        });

        return results;
    }, [estimatesString, categoryIdsString]);

    // Step 2: Derive cutoffs from cached Monte Carlo using current capacity/confidence (cheap)
    const cutoffMap = useMemo(() => {
        const categoryCutoffs: Record<string, number> = {};
        iteration.categories.forEach(cat => categoryCutoffs[cat.id] = -1);

        // Percentile mapping for confidence levels
        const percentileKey: Record<ConfidenceLevel, 'p50' | 'p70' | 'p80' | 'p95'> = {
            'Avg': 'p50',
            '70%': 'p70',
            '80%': 'p80',
            '95%': 'p95'
        };

        iteration.categories.forEach(cat => {
            const capacity = iteration.capacities[cat.id] || 0;
            const catResults = cumulativeMonteCarloResults[cat.id];

            if (catResults) {
                // Find the highest story index where required capacity <= available capacity
                for (let storyIndex = iteration.stories.length - 1; storyIndex >= 0; storyIndex--) {
                    const percentiles = catResults[storyIndex];
                    if (percentiles) {
                        const percentile = percentileKey[confidenceLevel];
                        const required = percentiles[percentile];

                        if (required <= capacity) {
                            categoryCutoffs[cat.id] = storyIndex;
                            break;
                        }
                    }
                }
            }
        });

        // Map cut-offs to indices for rendering
        const resultMap: Record<number, string[]> = {};
        Object.entries(categoryCutoffs).forEach(([catId, cutoffIndex]) => {
            const cat = iteration.categories.find(c => c.id === catId);
            if (cat) {
                if (!resultMap[cutoffIndex]) resultMap[cutoffIndex] = [];
                resultMap[cutoffIndex].push(cat.name);
            }
        });

        return resultMap;
    }, [cumulativeMonteCarloResults, iteration.categories, iteration.capacities, confidenceLevel, iteration.stories.length]);

    // Step 1: Memoize expensive Monte Carlo calculations - ONLY depends on estimates/structure
    const categoryMonteCarloResults = useMemo(() => {
        const allEstimates = JSON.parse(estimatesString) as Estimate[][];
        const categoryIds = categoryIdsString.split(',');

        return categoryIds.map(catId => {
            const storiesEstimates: any[] = [];
            let hasEstimates = false;

            allEstimates.forEach(storyEstimates => {
                const catEstimates = storyEstimates.filter((e: Estimate) => e.categoryId === catId);
                if (catEstimates.length > 0) {
                    hasEstimates = true;
                    storiesEstimates.push(catEstimates);
                }
            });

            const result = hasEstimates ? generateMonteCarloData(storiesEstimates) : { data: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 } };

            return {
                categoryId: catId,
                chartData: result.data,
                percentiles: result.percentiles,
                hasEstimates,
                minVal: result.data.length > 0 ? result.data[0].value : 0,
                maxVal: result.data.length > 0 ? result.data[result.data.length - 1].value : 100
            };
        });
    }, [estimatesString, categoryIdsString]);

    // Step 2: Derive required capacity from confidence level (cheap - just percentile lookup)
    const categoryGraphData = useMemo(() => {
        const percentileKey: Record<ConfidenceLevel, 'p50' | 'p70' | 'p80' | 'p95'> = {
            'Avg': 'p50',
            '70%': 'p70',
            '80%': 'p80',
            '95%': 'p95'
        };

        return iteration.categories.map((cat, index) => {
            const mcResult = categoryMonteCarloResults[index];
            const percentile = percentileKey[confidenceLevel];
            const requiredCapacity = mcResult.hasEstimates ? mcResult.percentiles[percentile] : 0;
            const availableCapacity = iteration.capacities[cat.id] || 0;

            return {
                ...cat,
                chartData: mcResult.chartData,
                minVal: mcResult.minVal,
                maxVal: mcResult.maxVal,
                requiredCapacity,
                availableCapacity,
                expectedValue: totalStats[cat.id].ev,
                hasEstimates: mcResult.hasEstimates
            };
        });
    }, [categoryMonteCarloResults, iteration.categories, confidenceLevel, iteration.capacities, totalStats]);

    return (
        <div className="space-y-8">
            {/* Header & Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        {isEditingTitle ? (
                            <form onSubmit={handleTitleUpdate} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    autoFocus
                                    onBlur={() => setIsEditingTitle(false)}
                                />
                            </form>
                        ) : (
                            <h1
                                className="text-3xl font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-2 group"
                                onClick={() => {
                                    setTitleInput(iteration.name);
                                    setIsEditingTitle(true);
                                }}
                            >
                                {iteration.name}
                                <Settings className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h1>
                        )}
                        <p className="text-slate-500 mt-1">
                            {iteration.stories.length} stories • {iteration.categories.length} categories
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {(['Avg', '70%', '80%', '95%'] as ConfidenceLevel[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => setConfidenceLevel(level)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${confidenceLevel === level
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* People & Capacity Management */}
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

            {/* Capacities & Stats (Aggregated) */}
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

            {/* Graphs Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowGraphs(!showGraphs)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <BarChart2 className="w-5 h-5 text-indigo-600" />
                        Category Probability Distributions
                    </div>
                    {showGraphs ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>

                {showGraphs && (
                    <div className="p-6 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryGraphData.map(catData => (
                                <div key={catData.id} className="space-y-2">
                                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catData.color }}></span>
                                        {catData.name}
                                    </h4>
                                    <div className="h-[200px] w-full bg-slate-50 rounded-lg border border-slate-100 relative">
                                        {catData.hasEstimates && catData.chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={catData.chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id={`colorProb-${catData.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={catData.color} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={catData.color} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="value"
                                                        type="number"
                                                        domain={[catData.minVal, catData.maxVal]}
                                                        tickFormatter={(val) => val.toFixed(0)}
                                                        stroke="#94a3b8"
                                                        fontSize={10}
                                                        tickCount={5}
                                                    />
                                                    <YAxis hide />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                        formatter={(value: number) => [value.toFixed(4), 'Prob']}
                                                        labelFormatter={(label) => `Est: ${label}`}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="probability"
                                                        stroke={catData.color}
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill={`url(#colorProb-${catData.id})`}
                                                    />
                                                    {/* Cutoff Line (Required Capacity) */}
                                                    <ReferenceLine
                                                        x={catData.requiredCapacity}
                                                        stroke="#ef4444"
                                                        strokeDasharray="3 3"
                                                        label={{
                                                            value: `${confidenceLevel}`,
                                                            position: 'top',
                                                            fill: '#ef4444',
                                                            fontSize: 10
                                                        }}
                                                    />
                                                    {/* Available Capacity Line */}
                                                    {catData.availableCapacity > 0 && (
                                                        <ReferenceLine
                                                            x={catData.availableCapacity}
                                                            stroke="#10b981"
                                                            label={{
                                                                value: 'Cap',
                                                                position: 'top',
                                                                fill: '#10b981',
                                                                fontSize: 10
                                                            }}
                                                        />
                                                    )}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                                                No data
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 px-1">
                                        <span>Req: {catData.requiredCapacity.toFixed(1)}</span>
                                        <span>Cap: {catData.availableCapacity.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Stories List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Stories</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Story
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Story Title</label>
                                <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    placeholder="e.g., Implement User Login"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={newStoryDesc}
                                    onChange={(e) => setNewStoryDesc(e.target.value)}
                                    placeholder="As a user, I want to..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Add Story
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-4">
                    {iteration.stories.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No stories yet</h3>
                            <p className="text-slate-500">Add a story to start estimating.</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={iteration.stories.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {/* Cut-off before first story */}
                                {cutoffMap[-1] && (
                                    <div className="relative py-4 flex items-center justify-center">
                                        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-300"></div>
                                        <div className="relative flex gap-2">
                                            {cutoffMap[-1].map(catName => {
                                                const cat = iteration.categories.find(c => c.name === catName);
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
                                )}

                                {iteration.stories.map((story, index) => {
                                    // Calculate stats per category for this story
                                    const categoryStats: Record<string, { expectedValue: number }> = {};
                                    iteration.categories.forEach(cat => {
                                        const catEstimates = story.estimates.filter(e => e.categoryId === cat.id);
                                        categoryStats[cat.id] = calculateStoryEstimate(catEstimates);
                                    });

                                    return (
                                        <React.Fragment key={story.id}>
                                            <SortableStoryItem
                                                story={story}
                                                iterationId={iteration.id}
                                                deleteStory={deleteStory}
                                                categories={iteration.categories}
                                                categoryStats={categoryStats}
                                            />
                                            {/* Cut-off after this story */}
                                            {cutoffMap[index] && (
                                                <div className="relative py-4 flex items-center justify-center">
                                                    <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-300"></div>
                                                    <div className="relative flex gap-2">
                                                        {cutoffMap[index].map(catName => {
                                                            const cat = iteration.categories.find(c => c.name === catName);
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
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
};
