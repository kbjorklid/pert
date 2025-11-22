import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Iteration, Estimate, Story } from '../types';

interface AppState {
    iterations: Iteration[];
    addIteration: (name: string, capacity?: number) => void;
    deleteIteration: (id: string) => void;
    updateIteration: (id: string, updates: Partial<Iteration>) => void;
    updateIterationCapacity: (id: string, capacity: number) => void;
    addStory: (iterationId: string, title: string, description?: string) => void;
    updateStory: (iterationId: string, storyId: string, updates: Partial<Story>) => void;
    deleteStory: (iterationId: string, storyId: string) => void;
    reorderStories: (iterationId: string, newStories: Story[]) => void;
    addEstimate: (iterationId: string, storyId: string, estimate: Omit<Estimate, 'id'>) => void;
    removeEstimate: (iterationId: string, storyId: string, estimateId: string) => void;
}

// Simple UUID generator if uuid package is not available or we want to keep it light
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            iterations: [],
            addIteration: (name, capacity) =>
                set((state) => {
                    // Inherit capacity from the most recent iteration if not provided
                    const defaultCapacity = capacity ?? (state.iterations.length > 0 ? state.iterations[0].capacity : 10);

                    return {
                        iterations: [
                            {
                                id: generateId(),
                                name,
                                stories: [],
                                capacity: defaultCapacity,
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
            updateIterationCapacity: (id, capacity) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === id ? { ...it, capacity } : it
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
        }
    )
);
