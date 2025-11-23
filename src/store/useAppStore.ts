import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Iteration, Estimate, Story, EstimateCategory } from '../types';

interface AppState {
    iterations: Iteration[];
    addIteration: (name: string) => void;
    deleteIteration: (id: string) => void;
    updateIteration: (id: string, updates: Partial<Iteration>) => void;

    // Category Management
    addCategory: (iterationId: string, name: string, color: string) => void;
    removeCategory: (iterationId: string, categoryId: string) => void;
    updateCategory: (iterationId: string, categoryId: string, updates: { name?: string; color?: string }) => void;
    updateCategoryCapacity: (iterationId: string, categoryId: string, capacity: number) => void;

    addStory: (iterationId: string, title: string, description?: string) => void;
    updateStory: (iterationId: string, storyId: string, updates: Partial<Story>) => void;
    deleteStory: (iterationId: string, storyId: string) => void;
    reorderStories: (iterationId: string, newStories: Story[]) => void;

    addEstimate: (iterationId: string, storyId: string, estimate: Omit<Estimate, 'id'>) => void;
    removeEstimate: (iterationId: string, storyId: string, estimateId: string) => void;
}

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const DEFAULT_CATEGORY: EstimateCategory = { id: 'default', name: 'Default', color: '#6366f1' };

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            iterations: [],
            addIteration: (name) =>
                set((state) => {
                    // Inherit categories from the most recent iteration, or use default
                    let categories: EstimateCategory[] = [DEFAULT_CATEGORY];
                    let capacities: Record<string, number> = { [DEFAULT_CATEGORY.id]: 10 };

                    if (state.iterations.length > 0) {
                        const prev = state.iterations[0];
                        // If previous iteration has categories, copy them
                        if (prev.categories && prev.categories.length > 0) {
                            categories = [...prev.categories];
                            capacities = { ...prev.capacities };
                        } else if (prev.capacity) {
                            // Legacy migration for inheritance
                            capacities = { [DEFAULT_CATEGORY.id]: prev.capacity };
                        }
                    }

                    return {
                        iterations: [
                            {
                                id: generateId(),
                                name,
                                stories: [],
                                categories,
                                capacities,
                                createdAt: Date.now(),
                            },
                            ...state.iterations,
                        ],
                    };
                }),
            deleteIteration: (id) =>
                set((state) => ({
                    iterations: state.iterations.filter((it) => it.id !== id),
                })),
            updateIteration: (id, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === id ? { ...it, ...updates } : it
                    ),
                })),

            addCategory: (iterationId, name, color) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;
                        const newCat = { id: generateId(), name, color };
                        return {
                            ...it,
                            categories: [...(it.categories || []), newCat],
                            capacities: { ...it.capacities, [newCat.id]: 0 } // Default 0 capacity
                        };
                    }),
                })),
            removeCategory: (iterationId, categoryId) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;
                        const newCapacities = { ...it.capacities };
                        delete newCapacities[categoryId];
                        return {
                            ...it,
                            categories: it.categories.filter(c => c.id !== categoryId),
                            capacities: newCapacities
                        };
                    }),
                })),
            updateCategory: (iterationId, categoryId, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                categories: it.categories.map((c) =>
                                    c.id === categoryId ? { ...c, ...updates } : c
                                ),
                            }
                            : it
                    ),
                })),
            updateCategoryCapacity: (iterationId, categoryId, capacity) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                capacities: { ...it.capacities, [categoryId]: capacity }
                            }
                            : it
                    ),
                })),

            addStory: (iterationId, title, description) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: [
                                    ...it.stories,
                                    {
                                        id: generateId(),
                                        title,
                                        description,
                                        estimates: [],
                                        createdAt: Date.now(),
                                    },
                                ],
                            }
                            : it
                    ),
                })),
            updateStory: (iterationId, storyId, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.map((s) =>
                                    s.id === storyId ? { ...s, ...updates } : s
                                ),
                            }
                            : it
                    ),
                })),
            deleteStory: (iterationId, storyId) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? { ...it, stories: it.stories.filter((s) => s.id !== storyId) }
                            : it
                    ),
                })),
            reorderStories: (iterationId, newStories) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId ? { ...it, stories: newStories } : it
                    ),
                })),
            addEstimate: (iterationId, storyId, estimate) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.map((s) =>
                                    s.id === storyId
                                        ? {
                                            ...s,
                                            estimates: [
                                                ...s.estimates,
                                                { ...estimate, id: generateId() },
                                            ],
                                        }
                                        : s
                                ),
                            }
                            : it
                    ),
                })),
            removeEstimate: (iterationId, storyId, estimateId) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.map((s) =>
                                    s.id === storyId
                                        ? {
                                            ...s,
                                            estimates: s.estimates.filter((e) => e.id !== estimateId),
                                        }
                                        : s
                                ),
                            }
                            : it
                    ),
                })),
        }),
        {
            name: 'pert-storage',
            // Simple migration to ensure categories exist on load
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.iterations = state.iterations.map(it => {
                        if (!it.categories || it.categories.length === 0) {
                            return {
                                ...it,
                                categories: [DEFAULT_CATEGORY],
                                capacities: { [DEFAULT_CATEGORY.id]: it.capacity || 10 }
                            };
                        }
                        return it;
                    });
                }
            }
        }
    )
);
