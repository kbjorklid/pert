import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { calculateStoryEstimate, generateMonteCarloData } from '../utils/pert';
import { StoryHeader } from '../components/StoryHeader';
import { CategoryTabs } from '../components/CategoryTabs';
import { EstimateForm } from '../components/EstimateForm';
import { EstimatesList } from '../components/EstimatesList';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { StatsPanel } from '../components/StatsPanel';

export const StoryView: React.FC = () => {
    const { iterationId, storyId } = useParams<{ iterationId: string; storyId: string }>();
    const { iterations, addEstimate, removeEstimate, updateStory } = useAppStore();

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

    const { expectedValue, standardDeviation, estimatesForCategory } = useMemo(() => {
        if (!story || !selectedCategoryId) {
            return { expectedValue: 0, standardDeviation: 0, estimatesForCategory: [] };
        }

        const filteredEstimates = story.estimates.filter(e => e.categoryId === selectedCategoryId);

        if (filteredEstimates.length === 0) {
            return { expectedValue: 0, standardDeviation: 0, estimatesForCategory: [] };
        }

        const stats = calculateStoryEstimate(filteredEstimates);

        return {
            ...stats,
            estimatesForCategory: filteredEstimates
        };
    }, [story, selectedCategoryId]);

    const { chartData, percentiles } = useMemo(() => {
        if (estimatesForCategory.length === 0) return { chartData: [], percentiles: { p50: 0, p70: 0, p80: 0, p95: 0 } };
        const result = generateMonteCarloData([estimatesForCategory]);
        return { chartData: result.data, percentiles: result.percentiles };
    }, [estimatesForCategory]);

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

    const handleUpdateStory = (title: string, description: string) => {
        if (iterationId && storyId) {
            updateStory(iterationId, storyId, { title, description });
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
                            expectedValue={expectedValue}
                            standardDeviation={standardDeviation}
                            estimateCount={estimatesForCategory.length}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
