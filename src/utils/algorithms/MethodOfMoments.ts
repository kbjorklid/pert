import { Estimate } from '../../types';
import { EstimationAlgorithm, SimulationResult } from './types';

// --- Math Helpers ---

// Lanczos approximation for Natural Log of Gamma function
function logGamma(z: number): number {
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);

    z -= 1;
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);

    const t = z + 7.5;
    return Math.log(Math.sqrt(2 * Math.PI)) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Probability Density Function for Beta Distribution
function getBetaPDF(x: number, alpha: number, beta: number): number {
    if (x <= 0 || x >= 1) return 0;
    // Using logs to avoid overflow/underflow with large factorials
    const lnVal = logGamma(alpha + beta) - logGamma(alpha) - logGamma(beta) +
        (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x);
    return Math.exp(lnVal);
}

export class MethodOfMomentsAlgorithm implements EstimationAlgorithm {
    name = 'Method of Moments';

    calculate(storiesEstimates: Estimate[][]): SimulationResult {
        if (storiesEstimates.length === 0) return { data: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 }, mean: 0 };

        // 1. Aggregate Statistics
        let totalMean = 0;
        let totalVariance = 0;
        let totalMin = 0;
        let totalMax = 0;

        storiesEstimates.forEach(estimates => {
            if (estimates.length === 0) return;

            const totals = estimates.reduce((acc, est) => ({
                o: acc.o + est.optimistic,
                m: acc.m + est.mostLikely,
                p: acc.p + est.pessimistic
            }), { o: 0, m: 0, p: 0 });

            const o = totals.o / estimates.length;
            const m = totals.m / estimates.length;
            const p = totals.p / estimates.length;

            totalMin += o;
            totalMax += p;
            totalMean += this.calculatePERT(o, m, p);
            totalVariance += this.calculateVariance(o, p);
        });

        // Edge case: No variance (O=M=P)
        if (totalVariance === 0 || totalMin === totalMax) {
            return {
                data: [{ value: totalMean, probability: 1 }],
                percentiles: { p50: totalMean, p70: totalMean, p80: totalMean, p95: totalMean },
                mean: totalMean
            };
        }

        // 2. Reverse-Engineer Beta Parameters (Method of Moments)
        // We match the Total Mean and Total Variance to a new Alpha/Beta curve
        const range = totalMax - totalMin;
        const meanNorm = (totalMean - totalMin) / range; // Normalized mean (0 to 1)
        const varNorm = totalVariance / (range * range); // Normalized variance

        // Formula to find Alpha/Beta from Mean/Variance
        // value = (mean * (1 - mean) / variance) - 1
        // Guard against division by zero or negative values if variance is extremely small relative to range
        let commonFactor = 0;
        if (varNorm > 0) {
            commonFactor = (meanNorm * (1 - meanNorm) / varNorm) - 1;
        }

        // If commonFactor is negative (impossible for valid Beta), fallback or clamp?
        // Usually means variance is too high for a Beta distribution on [0,1] with this mean.
        // For PERT, variance is constrained, so this should be rare unless inputs are weird.
        if (commonFactor < 0) commonFactor = 0.1; // Fallback to avoid crash

        const alpha = Math.max(0.1, meanNorm * commonFactor); // Ensure > 0
        const betaVal = Math.max(0.1, (1 - meanNorm) * commonFactor); // Ensure > 0

        // 3. Generate Curve Points & Calculate Percentiles via Integration
        const data = [];
        const points = 100; // Resolution of the graph
        const percentiles = { p50: 0, p70: 0, p80: 0, p95: 0 };

        let cumulativeProbability = 0;
        let foundP50 = false, foundP70 = false, foundP80 = false, foundP95 = false;

        for (let i = 0; i <= points; i++) {
            const xNorm = i / points; // 0 to 1
            const value = totalMin + xNorm * range; // Actual days

            // Get probability density
            let probability = 0;
            if (xNorm > 0 && xNorm < 1) {
                probability = getBetaPDF(xNorm, alpha, betaVal) / range; // Scale by range
            }

            data.push({ value: Number(value.toFixed(2)), probability });

            // Integration (Reimann Sum) to find percentiles
            // We add (probability * step_width) to get area under curve
            if (i > 0) {
                // Average height of this slice * width of slice
                const prevProb = data[i - 1].probability;
                const sliceArea = ((prevProb + probability) / 2) * (range / points);
                cumulativeProbability += sliceArea;
            }

            // Check for percentiles
            if (!foundP50 && cumulativeProbability >= 0.50) { percentiles.p50 = value; foundP50 = true; }
            if (!foundP70 && cumulativeProbability >= 0.70) { percentiles.p70 = value; foundP70 = true; }
            if (!foundP80 && cumulativeProbability >= 0.80) { percentiles.p80 = value; foundP80 = true; }
            if (!foundP95 && cumulativeProbability >= 0.95) { percentiles.p95 = value; foundP95 = true; }
        }

        // Fill missing percentiles if integration didn't reach them (e.g. due to precision)
        if (!foundP50) percentiles.p50 = totalMax;
        if (!foundP70) percentiles.p70 = totalMax;
        if (!foundP80) percentiles.p80 = totalMax;
        if (!foundP95) percentiles.p95 = totalMax;

        return { data, percentiles, mean: totalMean };
    }

    private calculatePERT(o: number, m: number, p: number) {
        return (o + 4 * m + p) / 6;
    }

    private calculateVariance(o: number, p: number) {
        return Math.pow((p - o) / 6, 2);
    }
}
