import { Estimate } from '../../types';

export interface SimulationResult {
    data: { value: number; probability: number }[];
    percentiles: { p50: number; p70: number; p80: number; p95: number };
    mean: number;
}

export interface EstimationAlgorithm {
    name: string;
    calculate(storiesEstimates: Estimate[][], iterations?: number): SimulationResult;
}
