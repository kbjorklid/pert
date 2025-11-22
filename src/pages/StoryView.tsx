import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Plus, Trash2, Users, Calculator } from 'lucide-react';
import { calculateStoryEstimate, calculatePERT, generateProbabilityData, calculateConfidenceIntervals } from '../utils/pert';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const StoryView: React.FC = () => {
    const { iterationId, storyId } = useParams<{ iterationId: string; storyId: string }>();
    const { iterations, addEstimate, removeEstimate } = useAppStore();

    const iteration = iterations.find((it) => it.id === iterationId);
    const story = iteration?.stories.find((s) => s.id === storyId);

    const [userName, setUserName] = useState('');
    const [optimistic, setOptimistic] = useState('');
    const [mostLikely, setMostLikely] = useState('');
    const [pessimistic, setPessimistic] = useState('');

    const { expectedValue, standardDeviation, avgOptimistic, avgMostLikely, avgPessimistic } = useMemo(() => {
        if (!story || story.estimates.length === 0) {
            return { expectedValue: 0, standardDeviation: 0, avgOptimistic: 0, avgMostLikely: 0, avgPessimistic: 0 };
        }

        const stats = calculateStoryEstimate(story.estimates);

        // Calculate average O, M, P for visualization
        const total = story.estimates.reduce((acc, est) => ({
            o: acc.o + est.optimistic,
            m: acc.m + est.mostLikely,
            p: acc.p + est.pessimistic
        }), { o: 0, m: 0, p: 0 });

        return {
            ...stats,
            avgOptimistic: total.o / story.estimates.length,
            avgMostLikely: total.m / story.estimates.length,
            avgPessimistic: total.p / story.estimates.length
        };
    }, [story]);

    const chartData = useMemo(() =>
        generateProbabilityData(avgOptimistic, avgMostLikely, avgPessimistic),
        [avgOptimistic, avgMostLikely, avgPessimistic]
    );

    if (!iteration || !story) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900">Story not found</h2>
                <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const handleAddEstimate = (e: React.FormEvent) => {
        e.preventDefault();
        if (userName && optimistic && mostLikely && pessimistic) {
            addEstimate(iteration.id, story.id, {
                userName,
                optimistic: Number(optimistic),
                mostLikely: Number(mostLikely),
                pessimistic: Number(pessimistic),
            });
            setUserName('');
            setOptimistic('');
            setMostLikely('');
            setPessimistic('');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link to={`/iteration/${iteration.id}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <div className="text-sm text-slate-500 mb-1">Story in {iteration.name}</div>
                    <h1 className="text-3xl font-bold text-slate-900">{story.title}</h1>
                </div>
            </div>

            {story.description && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700">
                    {story.description}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Estimates List & Form */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600" />
                            Add Estimate
                        </h3>
                        <form onSubmit={handleAddEstimate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">User Name</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-green-600 uppercase mb-1" title="Optimistic">Opt (O)</label>
                                    <input
                                        type="number"
                                        value={optimistic}
                                        onChange={(e) => setOptimistic(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 uppercase mb-1" title="Most Likely">Likely (M)</label>
                                    <input
                                        type="number"
                                        value={mostLikely}
                                        onChange={(e) => setMostLikely(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-red-600 uppercase mb-1" title="Pessimistic">Pess (P)</label>
                                    <input
                                        type="number"
                                        value={pessimistic}
                                        onChange={(e) => setPessimistic(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Submit Estimate
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-500" />
                            Estimates ({story.estimates.length})
                        </h3>
                        {story.estimates.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No estimates yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {story.estimates.map((est) => {
                                    const pert = calculatePERT(est.optimistic, est.mostLikely, est.pessimistic);
                                    return (
                                        <div key={est.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-slate-900">{est.userName}</span>
                                                <button
                                                    onClick={() => removeEstimate(iteration.id, story.id, est.id)}
                                                    className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-green-600 font-medium" title="Optimistic">O: {est.optimistic}</span>
                                                <span className="text-blue-600 font-medium" title="Most Likely">M: {est.mostLikely}</span>
                                                <span className="text-red-600 font-medium" title="Pessimistic">P: {est.pessimistic}</span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-xs text-slate-500 uppercase font-medium">PERT Estimate</span>
                                                <span className="font-bold text-indigo-600">{pert.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Visualization & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                            Probability Distribution (Beta)
                        </h3>

                        {story.estimates.length > 0 ? (
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="value"
                                            type="number"
                                            domain={[avgOptimistic, avgPessimistic]}
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
                                            stroke="#4f46e5"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorProb)"
                                        />
                                        <ReferenceLine x={expectedValue} stroke="#4f46e5" strokeDasharray="3 3" label={{ value: 'Expected', position: 'top', fill: '#4f46e5', fontSize: 12 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                Add estimates to see the probability distribution
                            </div>
                        )}
                    </div>

                    {story.estimates.length > 0 && (
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                    <div className="text-sm text-indigo-600 font-medium uppercase mb-1">Final PERT Estimate</div>
                                    <div className="text-4xl font-bold text-indigo-900">{expectedValue.toFixed(2)}</div>
                                    <p className="text-sm text-indigo-700 mt-2">
                                        Based on {story.estimates.length} estimates. This is the weighted average of all inputs.
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <div className="text-sm text-slate-500 font-medium uppercase mb-1">Uncertainty (Std Dev)</div>
                                    <div className="text-4xl font-bold text-slate-700">{standardDeviation.toFixed(2)}</div>
                                    <p className="text-sm text-slate-500 mt-2">
                                        A higher value indicates more disagreement or uncertainty among estimators.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Confidence Intervals</h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">50% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci50.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci50.max.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">80% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci80.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci80.max.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1">95% Probability</div>
                                        <div className="font-semibold text-slate-900">
                                            {calculateConfidenceIntervals(expectedValue, standardDeviation).ci95.min.toFixed(1)} - {calculateConfidenceIntervals(expectedValue, standardDeviation).ci95.max.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3 text-center">
                                    Ranges based on Normal Approximation ($E \pm Z\sigma$)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
