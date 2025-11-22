import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Iteration, Estimate } from '../types';

interface AppState {
    iterations: Iteration[];
    addIteration: (name: string) => void;
    deleteIteration: (id: string) => void;
    addStory: (iterationId: string, title: string, description?: string) => void;
    deleteStory: (iterationId: string, storyId: string) => void;
    addEstimate: (iterationId: string, storyId: string, estimate: Omit<Estimate, 'id'>) => void;
    removeEstimate: (iterationId: string, storyId: string, estimateId: string) => void;
}

// Simple UUID generator if uuid package is not available or we want to keep it light
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            iterations: [],
            addIteration: (name) =>
                set((state) => ({
                    iterations: [
                        ...state.iterations,
                        {
                            id: generateId(),
                            name,
                            stories: [],
                            createdAt: Date.now(),
                        },
                    ],
                })),
            deleteIteration: (id) =>
                set((state) => ({
                    iterations: state.iterations.filter((it) => it.id !== id),
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
            deleteStory: (iterationId, storyId) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.filter((s) => s.id !== storyId),
                            }
                            : it
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
