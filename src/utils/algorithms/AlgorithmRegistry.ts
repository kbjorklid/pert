import { EstimationAlgorithm } from './types';
import { MonteCarloAlgorithm } from './MonteCarlo';
import { MethodOfMomentsAlgorithm } from './MethodOfMoments';

export type AlgorithmType = 'monte-carlo' | 'method-of-moments';

export class AlgorithmRegistry {
    private static algorithms: Record<AlgorithmType, EstimationAlgorithm> = {
        'monte-carlo': new MonteCarloAlgorithm(),
        'method-of-moments': new MethodOfMomentsAlgorithm()
    };

    static getAlgorithm(type: AlgorithmType): EstimationAlgorithm {
        return this.algorithms[type];
    }

    static getAvailableAlgorithms(): { type: AlgorithmType; name: string }[] {
        return Object.entries(this.algorithms).map(([type, algo]) => ({
            type: type as AlgorithmType,
            name: algo.name
        }));
    }
}
