import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, GripVertical, Settings, X } from 'lucide-react';
import { calculateStoryEstimate } from '../utils/pert';
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
import { Story, EstimateCategory } from '../types';

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
        updateCategoryCapacity
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

    // Confidence Level State
    const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('Avg');

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

    // --- Calculation Logic ---
    // Z-scores
    const zScores: Record<string, number> = {
        'Avg': 0,
        '70%': 1.036,
        '80%': 1.282,
        '95%': 1.960
    };
    const z = zScores[confidenceLevel];

    // Track cumulative stats per category
    const runningStats: Record<string, { ev: number, var: number }> = {};
    iteration.categories.forEach(cat => runningStats[cat.id] = { ev: 0, var: 0 });

    // Calculate total required capacity per category
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

    // Initialize cut-offs
    const categoryCutoffs: Record<string, number> = {};
    iteration.categories.forEach(cat => categoryCutoffs[cat.id] = -1);

    iteration.stories.forEach((story, index) => {
        iteration.categories.forEach(cat => {
            const catEstimates = story.estimates.filter(e => e.categoryId === cat.id);
            const { expectedValue, standardDeviation } = calculateStoryEstimate(catEstimates);

            runningStats[cat.id].ev += expectedValue;
            runningStats[cat.id].var += Math.pow(standardDeviation, 2);

            const cumStdDev = Math.sqrt(runningStats[cat.id].var);
            const required = runningStats[cat.id].ev + (z * cumStdDev);

            const capacity = iteration.capacities[cat.id] || 0;

            if (required <= capacity) {
                categoryCutoffs[cat.id] = index;
            }
        });
    });

    // Map cut-offs to indices for rendering
    const cutoffMap: Record<number, string[]> = {};
    Object.entries(categoryCutoffs).forEach(([catId, cutoffIndex]) => {
        const cat = iteration.categories.find(c => c.id === catId);
        if (cat) {
            if (!cutoffMap[cutoffIndex]) cutoffMap[cutoffIndex] = [];
            cutoffMap[cutoffIndex].push(cat.name);
        }
    });

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
                    <button
                        onClick={() => setIsManagingCats(!isManagingCats)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        {isManagingCats ? 'Done Managing' : 'Manage Categories'}
                    </button>
                </div>
            </div>

            {/* Category Management & Capacities */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                        Capacities & Stats ({confidenceLevel === 'Avg' ? 'Average' : `${confidenceLevel} Certainty`})
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {iteration.categories.map(cat => {
                        const totalEV = totalStats[cat.id].ev;
                        const totalStdDev = Math.sqrt(totalStats[cat.id].var);
                        const requiredCapacity = totalEV + (z * totalStdDev);
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
                                    <div className="text-slate-500">Capacity:</div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-16 px-2 py-0.5 border border-slate-300 rounded text-right"
                                        value={availableCapacity}
                                        onChange={(e) => updateCategoryCapacity(iteration.id, cat.id, parseInt(e.target.value) || 0)}
                                    />
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
