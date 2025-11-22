export interface Estimate {
    id: string;
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
    createdAt: number;
}
