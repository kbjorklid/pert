import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, GripVertical, Settings, Eye, EyeOff } from 'lucide-react';
import { AlgorithmRegistry } from '../utils/algorithms/AlgorithmRegistry';

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
import { QuickAddStories } from '../components/QuickAddStories';
import { EstimatePopup } from '../components/EstimatePopup';

// Sortable Story Item Component
const SortableStoryItem = ({
    story,
    iterationId,
    deleteStory,
    categories,
    categoryStats,
    updateStory,
    onCategoryClick
}: {
    story: Story;
    iterationId: string;
    deleteStory: (itId: string, sId: string) => void;
    categories: EstimateCategory[];
    categoryStats: Record<string, { expectedValue: number }>;
    updateStory: (itId: string, sId: string, updates: Partial<Story>) => void;
    onCategoryClick: (story: Story, category: EstimateCategory, event: React.MouseEvent) => void;
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

    const isExcluded = story.excluded;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${isExcluded ? 'opacity-60 bg-slate-50' : ''}`}
        >
            <div className="flex items-center gap-3 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                </div>
                <Link to={`/iteration/${iterationId}/story/${story.id}`} className="flex-1">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <h3 className={`text-lg font-semibold transition-colors ${isExcluded ? 'text-slate-500 line-through' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                                {story.title}
                            </h3>
                            {story.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{story.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="text-right min-w-[60px] cursor-pointer hover:bg-slate-50 rounded px-1 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevent navigation
                                        onCategoryClick(story, cat, e);
                                    }}
                                >
                                    <div className="text-xs text-slate-500 uppercase" style={{ color: cat.color }}>{cat.name}</div>
                                    <div className={`font-bold text-lg ${isExcluded ? 'text-slate-400' : 'text-slate-700'}`}>
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
                <button
                    onClick={() => updateStory(iterationId, story.id, { excluded: !isExcluded })}
                    className={`p-2 rounded-lg transition-colors ${isExcluded ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
                    title={isExcluded ? "Include in calculations" : "Exclude from calculations"}
                >
                    {isExcluded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

const PERCENTILE_KEY: Record<ConfidenceLevel, 'p50' | 'p70' | 'p80' | 'p95'> = {
    'Avg': 'p50',
    '70%': 'p70',
    '80%': 'p80',
    '95%': 'p95'
};

export const IterationView: React.FC = () => {
    const { iterationId } = useParams<{ iterationId: string }>();
    const {
        iterations,
        addStory,
        addStories,
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
        updateTeamAvailability,
        algorithm: algorithmType,
        updateStory,
        quickAddAddToTop,
        setQuickAddAddToTop,
        addEstimate,
        updateEstimate
    } = useAppStore();

    const algorithm = useMemo(() => AlgorithmRegistry.getAlgorithm(algorithmType), [algorithmType]);

    const iteration = iterations.find((it) => it.id === iterationId);

    const [isCreating, setIsCreating] = useState(false);
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    // Category Management State
    const [isManagingCats, setIsManagingCats] = useState(false);

    // Person Management State
    // Removed isManagingPeople state as it's no longer needed

    // Confidence Level State
    const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('Avg');
    const [showGraphs, setShowGraphs] = useState(false);

    // Estimate Popup State
    const [activePopup, setActivePopup] = useState<{
        storyId: string;
        categoryId: string;
        position: { x: number; y: number };
    } | null>(null);

    const handleCategoryClick = (story: Story, category: EstimateCategory, event: React.MouseEvent) => {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setActivePopup({
            storyId: story.id,
            categoryId: category.id,
            position: { x: rect.left, y: rect.bottom + window.scrollY + 5 }
        });
    };

    const handleSaveEstimate = (estimate: { categoryId: string; userName: string; optimistic: number; mostLikely: number; pessimistic: number }, estimateId?: string) => {
        if (!activePopup || !iteration) return;

        const { storyId } = activePopup;

        if (estimateId) {
            updateEstimate(iteration.id, storyId, estimateId, estimate);
        } else {
            addEstimate(iteration.id, storyId, estimate);
        }
        setActivePopup(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!iteration) return <div>Iteration not found</div>;

    const handleCreateStory = (title: string, description: string, ticketLink: string) => {
        addStory(iteration.id, title, description, ticketLink);
        setIsCreating(false);
    };

    const handleQuickAddStories = (stories: { title: string; description?: string; ticketLink?: string }[], position: 'top' | 'bottom') => {
        addStories(iteration.id, stories, position);
        setIsQuickAdding(false);
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
    // We only want to re-run simulations if the actual numbers (estimates) or structure (categories) change.
    // We do NOT want to re-run if just a title or color changes.
    const activeStoriesJson = useMemo(() => {
        return JSON.stringify(iteration.stories.map(s => ({
            estimates: s.estimates,
            excluded: s.excluded
        })));
    }, [iteration.stories]);

    const categoryIdsString = useMemo(() => {
        return iteration.categories.map(c => c.id).join(',');
    }, [iteration.categories]);

    // Step 1: Cache cumulative Monte Carlo results for story cutoffs - ONLY depends on estimates/structure
    const cumulativeMonteCarloResults = useMemo(() => {
        const results: Record<string, Record<number, { p50: number, p70: number, p80: number, p95: number }>> = {};
        const allStoriesData = JSON.parse(activeStoriesJson) as { estimates: Estimate[], excluded?: boolean }[];
        const categoryIds = categoryIdsString.split(',');

        categoryIds.forEach(catId => {
            results[catId] = {};

            allStoriesData.forEach((_, storyIndex) => {
                // Collect all stories up to and including current index for this category
                const storiesUpToIndex: any[] = [];
                for (let i = 0; i <= storyIndex; i++) {
                    const storyData = allStoriesData[i];
                    if (storyData.excluded) continue; // Skip excluded stories

                    const estimates = storyData.estimates.filter((e: Estimate) => e.categoryId === catId);
                    if (estimates.length > 0) {
                        storiesUpToIndex.push(estimates);
                    }
                }

                // Run Monte Carlo simulation for cumulative stories and cache all percentiles
                if (storiesUpToIndex.length > 0) {
                    const result = algorithm.calculate(storiesUpToIndex);
                    results[catId][storyIndex] = result.percentiles;
                } else {
                    // If no stories (or all excluded), result is 0
                    results[catId][storyIndex] = { p50: 0, p70: 0, p80: 0, p95: 0 };
                }
            });
        });

        return results;
    }, [activeStoriesJson, categoryIdsString, algorithm]);

    // Step 2: Derive cutoffs from cached Monte Carlo using current capacity/confidence (cheap)
    const cutoffMap = useMemo(() => {
        const categoryCutoffs: Record<string, number> = {};
        iteration.categories.forEach(cat => categoryCutoffs[cat.id] = -1);

        // Percentile mapping for confidence levels
        // Uses PERCENTILE_KEY defined above

        iteration.categories.forEach(cat => {
            const capacity = iteration.capacities[cat.id] || 0;
            const catResults = cumulativeMonteCarloResults[cat.id];

            if (catResults) {
                // Find the highest story index where required capacity <= available capacity
                for (let storyIndex = iteration.stories.length - 1; storyIndex >= 0; storyIndex--) {
                    const percentiles = catResults[storyIndex];
                    if (percentiles) {
                        const percentile = PERCENTILE_KEY[confidenceLevel];
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
        const allStoriesData = JSON.parse(activeStoriesJson) as { estimates: Estimate[], excluded?: boolean }[];
        const categoryIds = categoryIdsString.split(',');

        return categoryIds.map(catId => {
            const storiesEstimates: any[] = [];
            let hasEstimates = false;

            allStoriesData.forEach(storyData => {
                if (storyData.excluded) return; // Skip excluded stories

                const catEstimates = storyData.estimates.filter((e: Estimate) => e.categoryId === catId);
                if (catEstimates.length > 0) {
                    hasEstimates = true;
                    storiesEstimates.push(catEstimates);
                }
            });

            const result = hasEstimates ? algorithm.calculate(storiesEstimates) : { data: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 }, mean: 0 };

            return {
                categoryId: catId,
                chartData: result.data,
                percentiles: result.percentiles,
                mean: result.mean,
                hasEstimates,
                minVal: result.data.length > 0 ? result.data[0].value : 0,
                maxVal: result.data.length > 0 ? result.data[result.data.length - 1].value : 100
            };
        });
    }, [activeStoriesJson, categoryIdsString, algorithm]);

    // Step 1b: Memoize individual story Monte Carlo calculations - ONLY depends on estimates/structure
    const storyMonteCarloResults = useMemo(() => {
        const allStoriesData = JSON.parse(activeStoriesJson) as { estimates: Estimate[], excluded?: boolean }[];
        const categoryIds = categoryIdsString.split(',');
        // Map: storyIndex -> categoryId -> percentiles
        const results: Record<number, Record<string, { p50: number, p70: number, p80: number, p95: number }>> = {};

        allStoriesData.forEach((storyData, index) => {
            results[index] = {};
            categoryIds.forEach(catId => {
                const catEstimates = storyData.estimates.filter(e => e.categoryId === catId);
                if (catEstimates.length > 0) {
                    // Use fewer iterations for individual stories to keep it snappy
                    const result = algorithm.calculate([catEstimates], 10000);
                    results[index][catId] = result.percentiles;
                }
            });
        });

        return results;
    }, [activeStoriesJson, categoryIdsString, algorithm]);

    // Step 2: Derive required capacity from confidence level (cheap - just percentile lookup)
    const categoryGraphData = useMemo(() => {


        return iteration.categories.map((cat, index) => {
            const mcResult = categoryMonteCarloResults[index];

            let requiredCapacity = 0;
            if (mcResult.hasEstimates) {
                if (confidenceLevel === 'Avg') {
                    requiredCapacity = mcResult.mean;
                } else {
                    const percentile = PERCENTILE_KEY[confidenceLevel];
                    requiredCapacity = mcResult.percentiles[percentile];
                }
            }

            const availableCapacity = iteration.capacities[cat.id] || 0;

            return {
                ...cat,
                chartData: mcResult.chartData,
                minVal: mcResult.minVal,
                maxVal: mcResult.maxVal,
                requiredCapacity,
                availableCapacity,
                expectedValue: mcResult.mean,
                hasEstimates: mcResult.hasEstimates
            };
        });
    }, [categoryMonteCarloResults, iteration.categories, confidenceLevel, iteration.capacities]);

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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Story
                        </button>
                        <button
                            onClick={() => setIsQuickAdding(true)}
                            className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Quick Add
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <StoryForm
                        onSubmit={handleCreateStory}
                        onCancel={() => setIsCreating(false)}
                    />
                )}

                {isQuickAdding && (
                    <QuickAddStories
                        onSave={handleQuickAddStories}
                        onCancel={() => setIsQuickAdding(false)}
                        initialAddToTop={quickAddAddToTop}
                        onAddToTopChange={setQuickAddAddToTop}
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
                                    // Calculate stats per category for this story
                                    const categoryStats: Record<string, { expectedValue: number }> = {};
                                    iteration.categories.forEach(cat => {
                                        const storyResults = storyMonteCarloResults[index];
                                        const percentiles = storyResults ? storyResults[cat.id] : null;

                                        if (percentiles) {
                                            const key = PERCENTILE_KEY[confidenceLevel];
                                            categoryStats[cat.id] = { expectedValue: percentiles[key] };
                                        } else {
                                            categoryStats[cat.id] = { expectedValue: 0 };
                                        }
                                    });

                                    return (
                                        <React.Fragment key={story.id}>
                                            <SortableStoryItem
                                                story={story}
                                                iterationId={iteration.id}
                                                deleteStory={deleteStory}
                                                categories={iteration.categories}
                                                categoryStats={categoryStats}
                                                updateStory={updateStory}
                                                onCategoryClick={handleCategoryClick}
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

            {activePopup && (
                (() => {
                    const story = iteration.stories.find(s => s.id === activePopup.storyId);
                    const category = iteration.categories.find(c => c.id === activePopup.categoryId);

                    if (story && category) {
                        return (
                            <EstimatePopup
                                iteration={iteration}
                                story={story}
                                category={category}
                                position={activePopup.position}
                                onClose={() => setActivePopup(null)}
                                onSave={handleSaveEstimate}
                            />
                        );
                    }
                    return null;
                })()
            )}
        </div>
    );
};
