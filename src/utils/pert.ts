

export const calculatePERT = (optimistic: number, mostLikely: number, pessimistic: number) => {
    return (optimistic + 4 * mostLikely + pessimistic) / 6;
};




