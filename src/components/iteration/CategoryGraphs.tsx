import React from 'react';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type ConfidenceLevel = 'Avg' | '70%' | '80%' | '95%';

interface CategoryGraphData {
    id: string;
    name: string;
    color: string;
    requiredCapacity: number;
    availableCapacity: number;
    expectedValue: number;
    hasEstimates: boolean;
    chartData: any[];
    minVal: number;
    maxVal: number;
}

interface CategoryGraphsProps {
    categoryGraphData: CategoryGraphData[];
    confidenceLevel: ConfidenceLevel;
    showGraphs: boolean;
    setShowGraphs: (value: boolean) => void;
}

export const CategoryGraphs: React.FC<CategoryGraphsProps> = ({
    categoryGraphData,
    confidenceLevel,
    showGraphs,
    setShowGraphs
}) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setShowGraphs(!showGraphs)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    Category Probability Distributions
                </div>
                {showGraphs ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>

            {showGraphs && (
                <div className="p-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryGraphData.map(catData => (
                            <div key={catData.id} className="space-y-2">
                                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catData.color }}></span>
                                    {catData.name}
                                </h4>
                                <div className="h-[200px] w-full bg-slate-50 rounded-lg border border-slate-100 relative">
                                    {catData.hasEstimates && catData.chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={catData.chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id={`colorProb-${catData.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={catData.color} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={catData.color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="value"
                                                    type="number"
                                                    domain={[catData.minVal, catData.maxVal]}
                                                    tickFormatter={(val) => val.toFixed(0)}
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    tickCount={5}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                    formatter={(value: number) => [value.toFixed(4), 'Prob']}
                                                    labelFormatter={(label) => `Est: ${label}`}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="probability"
                                                    stroke={catData.color}
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill={`url(#colorProb-${catData.id})`}
                                                />
                                                {/* Cutoff Line (Required Capacity) */}
                                                <ReferenceLine
                                                    x={catData.requiredCapacity}
                                                    stroke="#ef4444"
                                                    strokeDasharray="3 3"
                                                    label={{
                                                        value: `${confidenceLevel}`,
                                                        position: 'top',
                                                        fill: '#ef4444',
                                                        fontSize: 10
                                                    }}
                                                />
                                                {/* Available Capacity Line */}
                                                {catData.availableCapacity > 0 && (
                                                    <ReferenceLine
                                                        x={catData.availableCapacity}
                                                        stroke="#10b981"
                                                        label={{
                                                            value: 'Cap',
                                                            position: 'top',
                                                            fill: '#10b981',
                                                            fontSize: 10
                                                        }}
                                                    />
                                                )}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                                            No data
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 px-1">
                                    <span>Req: {catData.requiredCapacity.toFixed(1)}</span>
                                    <span>Cap: {catData.availableCapacity.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
