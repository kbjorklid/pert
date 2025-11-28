export interface EstimateCategory {
    id: string;
    name: string;
    color: string; // Tailwind class or hex code
}

export interface Estimate {
    id: string;
    categoryId: string; // New field
    userName: string;
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
}

export interface Story {
    id: string;
    title: string;
    description?: string;
    estimates: Estimate[];
    createdAt: number;
    excluded?: boolean; // New field for What-If scenarios
    ticketLink?: string;
    tags: string[]; // New field
}

export interface Person {
    id: string;
    name: string;
    capacities: Record<string, number>; // categoryId -> capacity
    availability: number; // 0-1 multiplier (default 1.0)
}

export interface TagDefinition {
    id: string; // usually same as name for now, or UUID
    name: string;
    color: string; // Tailwind class
}

export interface Iteration {
    id: string;
    name: string;
    stories: Story[];
    // New fields
    categories: EstimateCategory[];
    tags: TagDefinition[]; // List of all defined tags in this iteration
    people: Person[];
    teamAvailability: number; // 0-1 multiplier (default 0.7)
    capacities: Record<string, number>; // categoryId -> capacity (Legacy/Aggregated cache)
    // Legacy support (optional)
    capacity?: number;
    createdAt: number;
}

export type Category = EstimateCategory;

export type ConfidenceLevel = 'Avg' | '70%' | '80%' | '95%';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CategoryStats {
    expectedValue: number;
}

export interface CategoryProbabilities {
    data: { value: number; probability: number }[];
    percentiles: { p50: number; p70: number; p80: number; p95: number };
    mean: number;
}
