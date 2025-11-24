import React from 'react';
import { Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Category } from '../types';

interface ChartDataPoint {
    value: number;
    probability: number;
}

interface Percentiles {
    p50: number;
    p70: number;
    p80: number;
    p95: number;
}

interface ProbabilityChartProps {
    chartData: ChartDataPoint[];
    percentiles: Percentiles;
    category: Category;
    hasEstimates: boolean;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ chartData, percentiles, category, hasEstimates }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Probability Distribution ({category.name})
            </h3>

            {hasEstimates ? (
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={category.color || '#4f46e5'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={category.color || '#4f46e5'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="value"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(val) => val.toFixed(1)}
                                stroke="#64748b"
                                fontSize={12}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [value.toFixed(4), 'Probability Density']}
                                labelFormatter={(label) => `Estimate: ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="probability"
                                stroke={category.color || '#4f46e5'}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorProb)"
                            />
                            {/* Percentile Lines from Monte Carlo Simulation */}
                            <ReferenceLine
                                x={percentiles.p50}
                                stroke="#4f46e5"
                                strokeDasharray="3 3"
                                label={{ value: 'Avg', position: 'top', fill: '#4f46e5', fontSize: 11 }}
                            />
                            <ReferenceLine
                                x={percentiles.p70}
                                stroke="#f59e0b"
                                strokeDasharray="3 3"
                                label={{ value: '70%', position: 'top', fill: '#f59e0b', fontSize: 11 }}
                            />
                            <ReferenceLine
                                x={percentiles.p80}
                                stroke="#f97316"
                                strokeDasharray="3 3"
                                label={{ value: '80%', position: 'top', fill: '#f97316', fontSize: 11 }}
                            />
                            <ReferenceLine
                                x={percentiles.p95}
                                stroke="#ef4444"
                                strokeDasharray="3 3"
                                label={{ value: '95%', position: 'top', fill: '#ef4444', fontSize: 11 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Add estimates to see the probability distribution
                </div>
            )}
        </div>
    );
};
