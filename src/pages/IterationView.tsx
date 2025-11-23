import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, GripVertical, Settings } from 'lucide-react';
import { calculateStoryEstimate, generateMonteCarloData } from '../utils/pert';
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
import { PeopleAndCapacity } from '../components/iteration/PeopleAndCapacity';
import { CapacitiesAndStats } from '../components/iteration/CapacitiesAndStats';
import { CategoryGraphs } from '../components/iteration/CategoryGraphs';
import { StoryForm } from '../components/iteration/StoryForm';
import { StoryCutoffIndicator } from '../components/iteration/StoryCutoffIndicator';

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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    // Category Management State
    const [isManagingCats, setIsManagingCats] = useState(false);

    // Person Management State
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

    const handleCreateStory = (title: string, description: string) => {
        addStory(iteration.id, title, description);
        setIsCreating(false);
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



            {/* Capacities & Stats (Aggregated) */}
            <CapacitiesAndStats
                iteration={iteration}
                categoryGraphData={categoryGraphData}
                confidenceLevel={confidenceLevel}
                isManagingCats={isManagingCats}
                setIsManagingCats={setIsManagingCats}
                addCategory={addCategory}
                removeCategory={removeCategory}
                updateCategory={updateCategory}
            />


            {/* People & Capacity Management */}
            <PeopleAndCapacity
                iteration={iteration}
                isManagingPeople={isManagingPeople}
                setIsManagingPeople={setIsManagingPeople}
                addPerson={addPerson}
                removePerson={removePerson}
                updatePerson={updatePerson}
                updatePersonCapacity={updatePersonCapacity}
                updateTeamAvailability={updateTeamAvailability}
            />



            {/* Graphs Section */}
            <CategoryGraphs
                categoryGraphData={categoryGraphData}
                confidenceLevel={confidenceLevel}
                showGraphs={showGraphs}
                setShowGraphs={setShowGraphs}
            />


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
                    <StoryForm
                        onSubmit={handleCreateStory}
                        onCancel={() => setIsCreating(false)}
                    />
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
                                    <StoryCutoffIndicator
                                        categories={cutoffMap[-1]}
                                        allCategories={iteration.categories}
                                        confidenceLevel={confidenceLevel}
                                    />
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
                                                <StoryCutoffIndicator
                                                    categories={cutoffMap[index]}
                                                    allCategories={iteration.categories}
                                                    confidenceLevel={confidenceLevel}
                                                />
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
