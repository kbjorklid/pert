import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Iteration, Estimate, Story, EstimateCategory, Person, TagDefinition } from '../types';
import { AlgorithmType } from '../utils/algorithms/AlgorithmRegistry';
import { getTagColor } from '../components/Tag';

interface AppState {
    iterations: Iteration[];
    addIteration: (name: string) => void;
    deleteIteration: (id: string) => void;
    updateIteration: (id: string, updates: Partial<Iteration>) => void;
    duplicateIteration: (id: string) => void;
    updateTeamAvailability: (id: string, availability: number) => void;

    // Category Management
    addCategory: (iterationId: string, name: string, color: string) => void;
    removeCategory: (iterationId: string, categoryId: string) => void;
    updateCategory: (iterationId: string, categoryId: string, updates: { name?: string; color?: string }) => void;
    updateCategoryCapacity: (iterationId: string, categoryId: string, capacity: number) => void;

    addStory: (iterationId: string, title: string, description?: string, ticketLink?: string) => void;
    addStories: (iterationId: string, stories: { title: string, description?: string, ticketLink?: string }[], position?: 'top' | 'bottom') => void;
    updateStory: (iterationId: string, storyId: string, updates: Partial<Story>) => void;
    deleteStory: (iterationId: string, storyId: string) => void;
    reorderStories: (iterationId: string, newStories: Story[]) => void;

    addEstimate: (iterationId: string, storyId: string, estimate: Omit<Estimate, 'id'>) => void;
    updateEstimate: (iterationId: string, storyId: string, estimateId: string, updates: Partial<Estimate>) => void;
    removeEstimate: (iterationId: string, storyId: string, estimateId: string) => void;

    // Person Management
    addPerson: (iterationId: string, name: string) => void;
    removePerson: (iterationId: string, personId: string) => void;
    updatePerson: (iterationId: string, personId: string, updates: { name?: string; availability?: number }) => void;
    updatePersonCapacity: (iterationId: string, personId: string, categoryId: string, capacity: number) => void;

    // Tag Management
    addTag: (iterationId: string, tag: string) => void;
    deleteTag: (iterationId: string, tag: string) => void;
    updateTagColor: (iterationId: string, tag: string, color: string) => void;
    updateStoryTags: (iterationId: string, storyId: string, tags: string[]) => void;

    // Data Management
    importData: (data: AppState, mode: 'replace' | 'add') => void;

    // Algorithm Settings
    algorithm: AlgorithmType;
    setAlgorithm: (algo: AlgorithmType) => void;

    // Preferences
    quickAddAddToTop: boolean;
    setQuickAddAddToTop: (addToTop: boolean) => void;
}

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const DEFAULT_CATEGORY: EstimateCategory = { id: 'default', name: 'Default', color: '#6366f1' };

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            algorithm: 'method-of-moments', // Default
            setAlgorithm: (algo) => set({ algorithm: algo }),
            quickAddAddToTop: false,
            setQuickAddAddToTop: (addToTop) => set({ quickAddAddToTop: addToTop }),
            iterations: [],
            addIteration: (name) =>
                set((state) => {
                    // Inherit categories from the most recent iteration, or use default
                    let categories: EstimateCategory[] = [DEFAULT_CATEGORY];
                    let tags: TagDefinition[] = [];
                    let capacities: Record<string, number> = { [DEFAULT_CATEGORY.id]: 10 };

                    if (state.iterations.length > 0) {
                        const prev = state.iterations[0];
                        // If previous iteration has categories, copy them
                        if (prev.categories && prev.categories.length > 0) {
                            categories = [...prev.categories];
                            capacities = { ...prev.capacities };
                            tags = prev.tags ? [...prev.tags] : [];
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
                                tags,
                                people: [],
                                teamAvailability: 0.7, // Default 70%
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
            duplicateIteration: (id) =>
                set((state) => {
                    const sourceIteration = state.iterations.find((it) => it.id === id);
                    if (!sourceIteration) return state;

                    const newIteration: Iteration = {
                        ...sourceIteration,
                        id: generateId(),
                        name: `${sourceIteration.name} (Copy)`,
                        createdAt: Date.now(),
                        tags: sourceIteration.tags ? [...sourceIteration.tags] : [],
                        stories: sourceIteration.stories.map((story) => ({
                            ...story,
                            id: generateId(),
                            estimates: story.estimates.map((est) => ({
                                ...est,
                                id: generateId(),
                            })),
                        })),
                        people: sourceIteration.people.map((person) => ({
                            ...person,
                            id: generateId(),
                        })),
                    };

                    return {
                        iterations: [newIteration, ...state.iterations],
                    };
                }),
            updateIteration: (id, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === id ? { ...it, ...updates } : it
                    ),
                })),
            updateTeamAvailability: (id, availability) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== id) return it;

                        // Recalculate all capacities with new team availability
                        const newCapacities = { ...it.capacities };
                        it.categories.forEach(cat => {
                            const rawSum = it.people.reduce((sum, p) => sum + ((p.capacities[cat.id] || 0) * (p.availability ?? 1)), 0);
                            newCapacities[cat.id] = rawSum * availability;
                        });

                        return {
                            ...it,
                            teamAvailability: availability,
                            capacities: newCapacities
                        };
                    }),
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

            addStory: (iterationId, title, description, ticketLink) =>
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
                                        ticketLink,
                                        tags: [],
                                        estimates: [],
                                        createdAt: Date.now(),
                                    },
                                ],
                            }
                            : it
                    ),
                })),
            addStories: (iterationId, stories, position = 'bottom') =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: position === 'top'
                                    ? [
                                        ...stories.map(s => ({
                                            id: generateId(),
                                            title: s.title,
                                            description: s.description,
                                            ticketLink: s.ticketLink,
                                            tags: [],
                                            estimates: [],
                                            createdAt: Date.now(),
                                        })),
                                        ...it.stories,
                                    ]
                                    : [
                                        ...it.stories,
                                        ...stories.map(s => ({
                                            id: generateId(),
                                            title: s.title,
                                            description: s.description,
                                            ticketLink: s.ticketLink,
                                            tags: [],
                                            estimates: [],
                                            createdAt: Date.now(),
                                        }))
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
            updateEstimate: (iterationId, storyId, estimateId, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.map((s) =>
                                    s.id === storyId
                                        ? {
                                            ...s,
                                            estimates: s.estimates.map((e) =>
                                                e.id === estimateId ? { ...e, ...updates } : e
                                            ),
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

            addPerson: (iterationId, name) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;
                        const newPerson: Person = {
                            id: generateId(),
                            name,
                            capacities: {},
                            availability: 1.0 // Default 100%
                        };
                        // Initialize capacities for existing categories
                        it.categories.forEach(cat => {
                            newPerson.capacities[cat.id] = 0;
                        });
                        return {
                            ...it,
                            people: [...(it.people || []), newPerson]
                        };
                    }),
                })),

            removePerson: (iterationId, personId) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;

                        const updatedPeople = it.people.filter(p => p.id !== personId);

                        // Recalculate all capacities
                        const newCapacities = { ...it.capacities };
                        const teamAvail = it.teamAvailability ?? 0.7;
                        it.categories.forEach(cat => {
                            newCapacities[cat.id] = updatedPeople.reduce((sum, p) => sum + ((p.capacities[cat.id] || 0) * (p.availability ?? 1)), 0) * teamAvail;
                        });

                        return {
                            ...it,
                            people: updatedPeople,
                            capacities: newCapacities
                        };
                    }),
                })),

            updatePerson: (iterationId, personId, updates) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;

                        const updatedPeople = it.people.map(p =>
                            p.id === personId ? { ...p, ...updates } : p
                        );

                        // Recalculate capacities if availability changed
                        let newCapacities = it.capacities;
                        if (updates.availability !== undefined) {
                            newCapacities = { ...it.capacities };
                            const teamAvail = it.teamAvailability ?? 0.7;
                            it.categories.forEach(cat => {
                                newCapacities[cat.id] = updatedPeople.reduce((sum, p) => sum + ((p.capacities[cat.id] || 0) * (p.availability ?? 1)), 0) * teamAvail;
                            });
                        }

                        return {
                            ...it,
                            people: updatedPeople,
                            capacities: newCapacities
                        };
                    }),
                })),

            updatePersonCapacity: (iterationId, personId, categoryId, capacity) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;

                        const updatedPeople = it.people.map(p => {
                            if (p.id !== personId) return p;
                            return {
                                ...p,
                                capacities: { ...p.capacities, [categoryId]: capacity }
                            };
                        });

                        // Recalculate total capacity for the category
                        const teamAvail = it.teamAvailability ?? 0.7;
                        const totalCapacity = updatedPeople.reduce((sum, p) => sum + ((p.capacities[categoryId] || 0) * (p.availability ?? 1)), 0) * teamAvail;

                        return {
                            ...it,
                            people: updatedPeople,
                            capacities: { ...it.capacities, [categoryId]: totalCapacity }
                        };
                    }),
                })),

            addTag: (iterationId, tagName) =>
                set((state) => ({
                    iterations: state.iterations.map((it) => {
                        if (it.id !== iterationId) return it;
                        if (it.tags?.some(t => t.name === tagName)) return it;

                        const newTag: TagDefinition = {
                            id: tagName,
                            name: tagName,
                            color: getTagColor(tagName)
                        };

                        return {
                            ...it,
                            tags: [...(it.tags || []), newTag]
                        };
                    })
                })),

            deleteTag: (iterationId, tagName) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                tags: (it.tags || []).filter((t) => t.name !== tagName),
                                stories: it.stories.map((s) => ({
                                    ...s,
                                    tags: (s.tags || []).filter((t) => t !== tagName),
                                })),
                            }
                            : it
                    ),
                })),

            updateTagColor: (iterationId, tagName, color) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                tags: (it.tags || []).map((t) =>
                                    t.name === tagName ? { ...t, color } : t
                                ),
                            }
                            : it
                    ),
                })),

            updateStoryTags: (iterationId, storyId, tags) =>
                set((state) => ({
                    iterations: state.iterations.map((it) =>
                        it.id === iterationId
                            ? {
                                ...it,
                                stories: it.stories.map((s) =>
                                    s.id === storyId ? { ...s, tags } : s
                                ),
                            }
                            : it
                    ),
                })),

            importData: (data, mode) =>
                set((state) => {
                    if (mode === 'replace') {
                        return {
                            iterations: data.iterations,
                        };
                    }

                    // Mode is 'add'
                    const newIterations = [...state.iterations];
                    const existingNames = new Set(state.iterations.map((it) => it.name));

                    data.iterations.forEach((importedIteration) => {
                        let newName = importedIteration.name;
                        while (existingNames.has(newName)) {
                            newName += ' (imported)';
                        }
                        existingNames.add(newName);

                        // Deep copy with new IDs to avoid collisions
                        const newIteration: Iteration = {
                            ...importedIteration,
                            id: generateId(),
                            name: newName,
                            stories: importedIteration.stories.map((story) => ({
                                ...story,
                                id: generateId(),
                                tags: story.tags ? [...story.tags] : [],
                                estimates: story.estimates.map((est) => ({
                                    ...est,
                                    id: generateId(),
                                })),
                            })),
                            people: importedIteration.people.map((person) => ({
                                ...person,
                                id: generateId(),
                            })),
                        };
                        newIterations.push(newIteration);
                    });

                    return {
                        iterations: newIterations,
                    };
                }),

        }),
        {
            name: 'pert-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.iterations = state.iterations.map(it => {
                        if (!it.categories || it.categories.length === 0) {
                            return {
                                ...it,
                                categories: [DEFAULT_CATEGORY],
                                tags: [],
                                people: [],
                                capacities: { [DEFAULT_CATEGORY.id]: it.capacity || 10 }
                            };
                        }
                        if (!it.people) {
                            // Migration: Create a "Team" person with the legacy capacities if they exist
                            const legacyPeople: Person[] = [];
                            if (it.capacities && Object.values(it.capacities).some(v => v > 0)) {
                                legacyPeople.push({
                                    id: generateId(),
                                    name: 'Team (Legacy)',
                                    capacities: { ...it.capacities },
                                    availability: 1.0
                                });
                            }
                            // Migration: Set team availability to 1.0 for existing iterations to preserve values
                            return { ...it, people: legacyPeople, teamAvailability: 1.0 };
                        }
                        // Ensure teamAvailability exists
                        if (it.teamAvailability === undefined) {
                            return { ...it, teamAvailability: 1.0 }; // Default to 1.0 for existing to avoid drop
                        }
                        return it;
                    });
                }
            }
        }
    )
);
