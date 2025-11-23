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
}

export interface Person {
    id: string;
    name: string;
    capacities: Record<string, number>; // categoryId -> capacity
    availability: number; // 0-1 multiplier (default 1.0)
}

export interface Iteration {
    id: string;
    name: string;
    stories: Story[];
    // New fields
    categories: EstimateCategory[];
    people: Person[];
    teamAvailability: number; // 0-1 multiplier (default 0.7)
    capacities: Record<string, number>; // categoryId -> capacity (Legacy/Aggregated cache)
    // Legacy support (optional)
    capacity?: number;
    createdAt: number;
}
