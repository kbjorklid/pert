// Reproduction script for PERT calculation anomaly

const calculatePERT = (o: number, m: number, p: number) => (o + 4 * m + p) / 6;
const calculateSD = (o: number, p: number) => (p - o) / 6;

const story1 = { o: 2, m: 10, p: 20 };
const story2 = { o: 3, m: 5, p: 15 };

const e1 = calculatePERT(story1.o, story1.m, story1.p);
const sd1 = calculateSD(story1.o, story1.p);
const var1 = sd1 * sd1;

const e2 = calculatePERT(story2.o, story2.m, story2.p);
const sd2 = calculateSD(story2.o, story2.p);
const var2 = sd2 * sd2;

const totalEV = e1 + e2;
const totalVar = var1 + var2;
const totalSD = Math.sqrt(totalVar);

const z70 = 1.036;
const required70 = totalEV + (z70 * totalSD);

console.log('Story 1:', { e: e1, sd: sd1 });
console.log('Story 2:', { e: e2, sd: sd2 });
console.log('Total:', { ev: totalEV, sd: totalSD });
console.log('Required Capacity (Avg):', totalEV);
console.log('Required Capacity (70%):', required70);

if (totalEV > required70) {
    console.log('Anomaly CONFIRMED: Avg > 70%');
} else {
    console.log('Anomaly DISPROVED: Avg < 70%');
}
