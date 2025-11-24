import React from 'react';
import { Calculator } from 'lucide-react';

interface StatsPanelProps {
    average: number;
    percentiles: {
        p70: number;
        p80: number;
        p95: number;
    };
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ average, percentiles }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Estimates & Confidence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                    <div className="text-xs font-medium text-slate-500 uppercase mb-1">Average</div>
                    <div className="text-2xl font-bold text-slate-900">{average.toFixed(1)}</div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                    <div className="text-xs font-medium text-indigo-600 uppercase mb-1">70% Confidence</div>
                    <div className="text-2xl font-bold text-indigo-900">{percentiles.p70.toFixed(1)}</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
                    <div className="text-xs font-medium text-orange-600 uppercase mb-1">80% Confidence</div>
                    <div className="text-2xl font-bold text-orange-900">{percentiles.p80.toFixed(1)}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                    <div className="text-xs font-medium text-red-600 uppercase mb-1">95% Confidence</div>
                    <div className="text-2xl font-bold text-red-900">{percentiles.p95.toFixed(1)}</div>
                </div>
            </div>
        </div>
    );
};
