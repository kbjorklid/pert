import { Estimate } from '../types';

export const calculatePERT = (optimistic: number, mostLikely: number, pessimistic: number) => {
    return (optimistic + 4 * mostLikely + pessimistic) / 6;
};

export const calculateStandardDeviation = (optimistic: number, pessimistic: number) => {
    return (pessimistic - optimistic) / 6;
};

export const calculateStoryEstimate = (estimates: Estimate[]) => {
    if (estimates.length === 0) return { expectedValue: 0, standardDeviation: 0 };

    const totalExpectedValue = estimates.reduce((acc, est) => {
        return acc + calculatePERT(est.optimistic, est.mostLikely, est.pessimistic);
    }, 0);

    const expectedValue = totalExpectedValue / estimates.length;

    const totalStandardDeviation = estimates.reduce((acc, est) => {
        return acc + calculateStandardDeviation(est.optimistic, est.pessimistic);
    }, 0);

    const standardDeviation = totalStandardDeviation / estimates.length;

    return { expectedValue, standardDeviation };
};

// Gamma function approximation (Lanczos approximation)
function gamma(z: number): number {
    const p = [
        676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012,
        9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));

    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
        x += p[i] / (z + i + 1);
    }
    const t = z + p.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Beta function
function beta(x: number, y: number): number {
    return (gamma(x) * gamma(y)) / gamma(x + y);
}

export const generateProbabilityData = (optimistic: number, mostLikely: number, pessimistic: number) => {
    if (optimistic >= pessimistic) return [];

    const range = pessimistic - optimistic;
    if (range === 0) return [];

    // PERT standard alpha and beta parameters
    const alpha = 1 + (4 * (mostLikely - optimistic)) / range;
    const betaVal = 1 + (4 * (pessimistic - mostLikely)) / range;

    const data = [];
    const steps = 100;
    const stepSize = range / steps;

    const betaConstant = beta(alpha, betaVal);

    for (let i = 0; i <= steps; i++) {
        const x = optimistic + i * stepSize;
        const normalizedX = (x - optimistic) / range;

        if (normalizedX <= 0 || normalizedX >= 1) {
            data.push({ value: Number(x.toFixed(2)), probability: 0 });
            continue;
        }

        const probability = (Math.pow(normalizedX, alpha - 1) * Math.pow(1 - normalizedX, betaVal - 1)) / (betaConstant * range);

        data.push({
            value: Number(x.toFixed(2)),
            probability: probability
        });
    }

    return data;
};

export const calculateConfidenceIntervals = (expectedValue: number, standardDeviation: number) => {
    // Z-scores for Normal Distribution
    const z95 = 1.960;
    const z80 = 1.282;
    const z70 = 1.036;
    const z50 = 0.674;

    return {
        ci95: {
            min: Math.max(0, expectedValue - z95 * standardDeviation),
            max: expectedValue + z95 * standardDeviation
        },
        ci80: {
            min: Math.max(0, expectedValue - z80 * standardDeviation),
            max: expectedValue + z80 * standardDeviation
        },
        ci70: {
            min: Math.max(0, expectedValue - z70 * standardDeviation),
            max: expectedValue + z70 * standardDeviation
        },
        ci50: {
            min: Math.max(0, expectedValue - z50 * standardDeviation),
            max: expectedValue + z50 * standardDeviation
        }
    };
};

export const calculateIterationStats = (stories: { estimates: Estimate[] }[]) => {
    let totalExpectedValue = 0;
    let totalVariance = 0;

    stories.forEach(story => {
        const { expectedValue, standardDeviation } = calculateStoryEstimate(story.estimates);
        totalExpectedValue += expectedValue;
        totalVariance += Math.pow(standardDeviation, 2);
    });

    const totalStandardDeviation = Math.sqrt(totalVariance);

    return {
        totalExpectedValue,
        totalStandardDeviation,
        ...calculateConfidenceIntervals(totalExpectedValue, totalStandardDeviation)
    };
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

export const generateMonteCarloData = (storiesEstimates: Estimate[][], iterations: number = 100000) => {
    if (storiesEstimates.length === 0) return [];

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

    if (storyParams.length === 0) return [];

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

    // Create Histogram
    const bucketCount = 25; // Number of points in graph
    const range = maxTotal - minTotal;
    if (range <= 0) return [{ value: minTotal, probability: 1 }];

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

    return data;
};
