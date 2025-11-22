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
