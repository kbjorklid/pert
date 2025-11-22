import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Clock, Trash2, ChevronRight, BarChart, GripVertical, Settings } from 'lucide-react';
import { calculateStoryEstimate, calculateIterationStats } from '../utils/pert';
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
import { Story } from '../types';

// Sortable Story Item Component
const SortableStoryItem = ({
    story,
    iterationId,
    deleteStory,
    expectedValue,
    isOverCapacity
}: {
    story: Story;
    iterationId: string;
    deleteStory: (itId: string, sId: string) => void;
    expectedValue: number;
    isOverCapacity: boolean;
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
            className={`group bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all flex items-center justify-between ${isOverCapacity ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                }`}
        >
            <div className="flex items-center gap-3 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                </div>
                <Link to={`/iteration/${iterationId}/story/${story.id}`} className="flex-1">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <h3 className={`text-lg font-semibold transition-colors ${isOverCapacity ? 'text-red-900 group-hover:text-red-700' : 'text-slate-900 group-hover:text-indigo-600'
                                }`}>
                                {story.title}
                            </h3>
                            {story.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{story.description}</p>
                            )}
                            {isOverCapacity && (
                                <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                                    Exceeds Capacity
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Estimates</div>
                                <div className="font-medium text-slate-900">{story.estimates.length}</div>
                            </div>
                            <div className="text-right min-w-[80px]">
                                <div className="text-sm text-slate-500">PERT Avg</div>
                                <div className={`font-bold text-lg ${isOverCapacity ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {expectedValue > 0 ? expectedValue.toFixed(1) : '-'}
                                </div>
                            </div>
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

export const IterationView: React.FC = () => {
    const { iterationId } = useParams<{ iterationId: string }>();
    const { iterations, addStory, deleteStory, reorderStories, updateIterationCapacity, updateIteration } = useAppStore();

    const iteration = iterations.find((it) => it.id === iterationId);

    const [isCreating, setIsCreating] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDesc, setNewStoryDesc] = useState('');
    const [confidenceLevel, setConfidenceLevel] = useState<50 | 80 | 95>(95);
    const [isEditingCapacity, setIsEditingCapacity] = useState(false);
    const [capacityInput, setCapacityInput] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!iteration) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900">Iteration not found</h2>
                <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

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

            const newStories = arrayMove(iteration.stories, oldIndex, newIndex);
            reorderStories(iteration.id, newStories);
        }
    };

    const handleCapacityUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        const cap = parseInt(capacityInput);
        if (!isNaN(cap) && cap >= 1) {
            updateIterationCapacity(iteration.id, cap);
            setIsEditingCapacity(false);
        }
    };

    const handleTitleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (titleInput.trim()) {
            updateIteration(iteration.id, { name: titleInput.trim() });
            setIsEditingTitle(false);
        }
    };

    let cumulativeExpectedValue = 0;
    const capacity = iteration.capacity || 10; // Default capacity if undefined

    return (
        <div className="space-y-8">
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
                            {iteration.stories.length} stories • Created {new Date(iteration.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-sm font-medium text-slate-500 uppercase">Capacity:</div>
                    {isEditingCapacity ? (
                        <form onSubmit={handleCapacityUpdate} className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
                                value={capacityInput}
                                onChange={(e) => setCapacityInput(e.target.value)}
                                autoFocus
                                onBlur={() => setIsEditingCapacity(false)}
                            />
                        </form>
                    ) : (
                        <button
                            onClick={() => {
                                setCapacityInput(capacity.toString());
                                setIsEditingCapacity(true);
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                        >
                            {capacity}
                            <Settings className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {iteration.stories.length > 0 && (
                <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart className="w-5 h-5 text-indigo-300" />
                        <h2 className="text-lg font-semibold">Iteration Forecast</h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-indigo-300 text-sm font-medium uppercase mb-1">Total Expected</div>
                            <div className="text-3xl font-bold">
                                {calculateIterationStats(iteration.stories).totalExpectedValue.toFixed(1)}
                            </div>
                        </div>
                        <div>
                            <div className="text-indigo-300 text-sm font-medium uppercase mb-1">Uncertainty (σ)</div>
                            <div className="text-3xl font-bold">
                                {calculateIterationStats(iteration.stories).totalStandardDeviation.toFixed(1)}
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-indigo-800/50 rounded-lg p-3 border border-indigo-700">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-indigo-300 text-xs font-medium uppercase">{confidenceLevel}% Confidence Interval</div>
                                <div className="flex bg-indigo-900/50 rounded-lg p-0.5 border border-indigo-700/50">
                                    {[50, 80, 95].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setConfidenceLevel(level as 50 | 80 | 95)}
                                            className={`px-2 py-0.5 text-xs font-medium rounded-md transition-colors ${confidenceLevel === level
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-indigo-300 hover:text-white hover:bg-indigo-800'
                                                }`}
                                        >
                                            {level}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {calculateIterationStats(iteration.stories)[`ci${confidenceLevel}`].min.toFixed(1)}
                                </span>
                                <span className="text-indigo-400">to</span>
                                <span className="text-2xl font-bold">
                                    {calculateIterationStats(iteration.stories)[`ci${confidenceLevel}`].max.toFixed(1)}
                                </span>
                            </div>
                            <div className="text-xs text-indigo-400 mt-1">
                                There is a {confidenceLevel}% chance the iteration will finish within this range.
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            {iteration.stories.map((story, index) => {
                                const { expectedValue } = calculateStoryEstimate(story.estimates);
                                cumulativeExpectedValue += expectedValue;
                                const isOverCapacity = cumulativeExpectedValue > capacity;
                                const showCutoff = !isOverCapacity && (cumulativeExpectedValue + (iteration.stories[index + 1] ? calculateStoryEstimate(iteration.stories[index + 1].estimates).expectedValue : 0)) > capacity;

                                return (
                                    <React.Fragment key={story.id}>
                                        <SortableStoryItem
                                            story={story}
                                            iterationId={iteration.id}
                                            deleteStory={deleteStory}
                                            expectedValue={expectedValue}
                                            isOverCapacity={isOverCapacity}
                                        />
                                        {showCutoff && (
                                            <div className="relative py-2 flex items-center justify-center">
                                                <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-red-300"></div>
                                                <span className="relative bg-slate-50 px-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                                                    Capacity Cut-off ({capacity})
                                                </span>
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
    );
};
