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

export interface Iteration {
    id: string;
    name: string;
    stories: Story[];
    // New fields
    categories: EstimateCategory[];
    capacities: Record<string, number>; // categoryId -> capacity
    // Legacy support (optional)
    capacity?: number;
    createdAt: number;
}
