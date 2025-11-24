import { Estimate } from '../types';

export const calculatePERT = (optimistic: number, mostLikely: number, pessimistic: number) => {
    return (optimistic + 4 * mostLikely + pessimistic) / 6;
};



// --- Monte Carlo Simulation Helpers ---

// Marsaglia and Tsang's Method for generating Gamma(alpha, 1) variates
function sampleGamma(alpha: number): number {
    if (alpha < 1) {
        return sampleGamma(1 + alpha) * Math.pow(Math.random(), 1 / alpha);
    }

    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        const x = generateNormal();
        const v = 1 + c * x;

        if (v <= 0) continue;

        const v3 = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * x * x * x * x) return d * v3;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v3 + Math.log(v3))) return d * v3;
    }
}

// Box-Muller transform for Normal(0, 1)
function generateNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function sampleBeta(alpha: number, beta: number): number {
    const x = sampleGamma(alpha);
    const y = sampleGamma(beta);
    return x / (x + y);
}

// Calculate percentile from sorted array using linear interpolation
function calculatePercentile(sortedData: Float64Array, percentile: number): number {
    if (sortedData.length === 0) return 0;
    if (sortedData.length === 1) return sortedData[0];

    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

export const generateMonteCarloData = (storiesEstimates: Estimate[][], iterations: number = 50000) => {
    if (storiesEstimates.length === 0) return { data: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 }, mean: 0 };

    const samples = new Float64Array(iterations).fill(0);
    let minTotal = 0;
    let maxTotal = 0;

    // Pre-calculate PERT parameters for each story to avoid re-calc in loop
    const storyParams = storiesEstimates.map(estimates => {
        if (estimates.length === 0) return null;

        // We need O, M, P for the story (averaged estimates)
        const total = estimates.reduce((acc, est) => ({
            o: acc.o + est.optimistic,
            m: acc.m + est.mostLikely,
            p: acc.p + est.pessimistic
        }), { o: 0, m: 0, p: 0 });

        const o = total.o / estimates.length;
        const m = total.m / estimates.length;
        const p = total.p / estimates.length;

        minTotal += o;
        maxTotal += p;

        if (o >= p) return { fixed: o }; // No variance

        const range = p - o;
        const alpha = 1 + (4 * (m - o)) / range;
        const betaVal = 1 + (4 * (p - m)) / range;

        return { o, p, range, alpha, betaVal };
    }).filter(p => p !== null) as ({ o: number, p: number, range: number, alpha: number, betaVal: number } | { fixed: number })[];

    if (storyParams.length === 0) return { data: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 }, mean: 0 };

    // Run simulation
    for (let i = 0; i < iterations; i++) {
        for (const param of storyParams) {
            if ('fixed' in param) {
                samples[i] += param.fixed;
            } else {
                const val = sampleBeta(param.alpha, param.betaVal);
                samples[i] += param.o + val * param.range;
            }
        }
    }

    // Sort samples for percentile calculation
    const sortedSamples = samples.slice().sort((a, b) => a - b);

    // Calculate percentiles from actual sample data
    const percentiles = {
        p50: calculatePercentile(sortedSamples, 50),
        p70: calculatePercentile(sortedSamples, 70),
        p80: calculatePercentile(sortedSamples, 80),
        p95: calculatePercentile(sortedSamples, 95)
    };

    // Create Histogram
    const bucketCount = 25; // Number of points in graph
    const range = maxTotal - minTotal;
    if (range <= 0) return { data: [{ value: minTotal, probability: 1 }], percentiles, mean: minTotal };

    const buckets = new Array(bucketCount).fill(0);
    const stepSize = range / bucketCount;

    for (let i = 0; i < iterations; i++) {
        const val = samples[i];
        const bucketIndex = Math.min(bucketCount - 1, Math.floor((val - minTotal) / stepSize));
        if (bucketIndex >= 0) {
            buckets[bucketIndex]++;
        }
    }

    // Convert to density
    const data = buckets.map((count, index) => ({
        value: Number((minTotal + index * stepSize + stepSize / 2).toFixed(2)),
        probability: count / iterations / stepSize // Density
    }));

    // Smooth edges (optional, but good for visualization)
    // Add zero points at ends if not present
    if (data[0].probability > 0) data.unshift({ value: minTotal, probability: 0 });
    if (data[data.length - 1].probability > 0) data.push({ value: maxTotal, probability: 0 });

    // Calculate mean
    const totalSum = samples.reduce((a, b) => a + b, 0);
    const mean = totalSum / iterations;

    return { data, percentiles, mean };
};
