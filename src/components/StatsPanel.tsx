import React from 'react';
import { calculateConfidenceIntervals } from '../utils/pert';

interface StatsPanelProps {
    expectedValue: number;
    standardDeviation: number;
    estimateCount: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ expectedValue, standardDeviation, estimateCount }) => {
    const intervals = calculateConfidenceIntervals(expectedValue, standardDeviation);

    return (
        <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <div className="text-sm text-indigo-600 font-medium uppercase mb-1">Final PERT Estimate</div>
                    <div className="text-4xl font-bold text-indigo-900">{expectedValue.toFixed(2)}</div>
                    <p className="text-sm text-indigo-700 mt-2">
                        Based on {estimateCount} estimates.
                    </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500 font-medium uppercase mb-1">Uncertainty (Std Dev)</div>
                    <div className="text-4xl font-bold text-slate-700">{standardDeviation.toFixed(2)}</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Confidence Intervals</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">50% Probability</div>
                        <div className="font-semibold text-slate-900">
                            {intervals.ci50.min.toFixed(1)} - {intervals.ci50.max.toFixed(1)}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">80% Probability</div>
                        <div className="font-semibold text-slate-900">
                            {intervals.ci80.min.toFixed(1)} - {intervals.ci80.max.toFixed(1)}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">95% Probability</div>
                        <div className="font-semibold text-slate-900">
                            {intervals.ci95.min.toFixed(1)} - {intervals.ci95.max.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
