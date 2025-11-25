import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { AlgorithmRegistry } from '../utils/algorithms/AlgorithmRegistry';

import { StoryHeader } from '../components/StoryHeader';
import { CategoryTabs } from '../components/CategoryTabs';
import { EstimateForm } from '../components/EstimateForm';
import { EstimatesList } from '../components/EstimatesList';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { StatsPanel } from '../components/StatsPanel';

export const StoryView: React.FC = () => {
    const { iterationId, storyId } = useParams<{ iterationId: string; storyId: string }>();
    const { iterations, addEstimate, removeEstimate, updateStory, algorithm: algorithmType } = useAppStore();

    const algorithm = useMemo(() => AlgorithmRegistry.getAlgorithm(algorithmType), [algorithmType]);


    const iteration = iterations.find((it) => it.id === iterationId);
    const story = iteration?.stories.find((s) => s.id === storyId);

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // Set default category when iteration loads
    React.useEffect(() => {
        if (iteration && iteration.categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(iteration.categories[0].id);
        }
    }, [iteration, selectedCategoryId]);

    const activeCategory = iteration?.categories.find(c => c.id === selectedCategoryId);

    const estimatesForCategory = useMemo(() => {
        if (!story || !selectedCategoryId) {
            return [];
        }

        return story.estimates.filter(e => e.categoryId === selectedCategoryId);
    }, [story, selectedCategoryId]);

    const { chartData, percentiles, mean } = useMemo(() => {
        if (estimatesForCategory.length === 0) return { chartData: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 }, mean: 0 };
        const result = algorithm.calculate([estimatesForCategory]);
        return { chartData: result.data, percentiles: result.percentiles, mean: result.mean };
    }, [estimatesForCategory, algorithm]);

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

    const handleAddEstimate = (estimate: { categoryId: string; userName: string; optimistic: number; mostLikely: number; pessimistic: number }) => {
        addEstimate(iteration.id, story.id, estimate);
    };

    const handleUpdateStory = (title: string, description: string, ticketLink: string) => {
        if (iterationId && storyId) {
            updateStory(iterationId, storyId, { title, description, ticketLink });
        }
    };

    const handleRemoveEstimate = (estimateId: string) => {
        removeEstimate(iteration.id, story.id, estimateId);
    };

    return (
        <div className="space-y-8 pb-12">
            <StoryHeader
                iteration={iteration}
                story={story}
                onUpdate={handleUpdateStory}
            />

            <CategoryTabs
                categories={iteration.categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Estimates List & Form */}
                <div className="lg:col-span-1 space-y-8">
                    {activeCategory && (
                        <EstimateForm
                            iteration={iteration}
                            category={activeCategory}
                            onSubmit={handleAddEstimate}
                        />
                    )}

                    {activeCategory && (
                        <EstimatesList
                            estimates={estimatesForCategory}
                            category={activeCategory}
                            onRemove={handleRemoveEstimate}
                        />
                    )}
                </div>

                {/* Right Column: Visualization & Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {activeCategory && (
                        <ProbabilityChart
                            chartData={chartData}
                            percentiles={percentiles}
                            category={activeCategory}
                            hasEstimates={estimatesForCategory.length > 0}
                        />
                    )}

                    {estimatesForCategory.length > 0 && (
                        <StatsPanel
                            average={mean}
                            percentiles={percentiles}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
