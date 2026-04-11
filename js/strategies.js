/* ============================================================
   STRATEGIES.JS — Strategy Generation + Projected Returns
   ============================================================ */

const Strategies = (() => {

    // Strategy definitions based on sentiment category
    const strategyMap = {
        conservative: {
            name: 'Conservative Shield Strategy',
            desc: 'Capital preservation focus with stable returns and minimal volatility',
            returnRange: [6, 9],
            riskLabel: 'Low Risk',
            allocation: {
                'Large-cap Stocks': 20,
                'Government Bonds': 25,
                'Gold': 30,
                'Silver': 10,
                'Fixed Deposits': 15
            },
            benefits: [
                'Lower volatility and stable returns',
                'Capital preservation in market downturns',
                'Regular income through bonds and FDs'
            ],
            risks: [
                'Lower growth potential',
                'May not beat inflation in high-inflation periods',
                'Limited exposure to high-growth sectors'
            ]
        },
        balanced: {
            name: 'Balanced Growth Strategy',
            desc: 'Optimal mix of growth and stability for moderate returns',
            returnRange: [10, 15],
            riskLabel: 'Balanced Risk',
            allocation: {
                'Large-cap Stocks': 35,
                'Mid-cap Stocks': 15,
                'Gold': 25,
                'Silver': 5,
                'Bitcoin': 15,
                'Ethereum': 5
            },
            benefits: [
                'Diversified risk across asset classes',
                'Moderate growth with acceptable volatility',
                'Exposure to both traditional and digital assets'
            ],
            risks: [
                'Moderate market fluctuations expected',
                'Crypto allocation adds some volatility',
                'Returns may vary significantly year to year'
            ]
        },
        aggressive: {
            name: 'Aggressive Alpha Strategy',
            desc: 'High-growth focus with maximum returns potential and higher volatility',
            returnRange: [15, 25],
            riskLabel: 'High Risk',
            allocation: {
                'Large-cap Stocks': 25,
                'Mid-cap Stocks': 20,
                'Small-cap Stocks': 10,
                'Bitcoin': 25,
                'Ethereum': 15,
                'Altcoins': 5
            },
            benefits: [
                'Maximum growth potential',
                'Heavy exposure to high-performing crypto assets',
                'Potential for outsized returns in bull markets'
            ],
            risks: [
                'High volatility — portfolio can swing ±30% in months',
                'Crypto assets are highly speculative',
                'Not suitable for short-term financial needs'
            ]
        }
    };

    // Color map for asset classes
    const assetColors = {
        'Large-cap Stocks': '#3B82F6',
        'Mid-cap Stocks': '#22C55E',
        'Small-cap Stocks': '#14B8A6',
        'Gold': '#F59E0B',
        'Silver': '#EF4444',
        'Bitcoin': '#A855F7',
        'Ethereum': '#EC4899',
        'Altcoins': '#F97316',
        'Government Bonds': '#6366F1',
        'Fixed Deposits': '#8B5CF6'
    };

    function getStrategy(sentimentCategory) {
        return strategyMap[sentimentCategory] || strategyMap.balanced;
    }

    function getAssetColor(assetName) {
        return assetColors[assetName] || '#64748B';
    }

    function calculateProjectedReturns(budget, strategy) {
        const minRate = strategy.returnRange[0] / 100;
        const maxRate = strategy.returnRange[1] / 100;
        const avgRate = (minRate + maxRate) / 2;

        const projections = {};
        const years = [1, 3, 5, 10];

        years.forEach(year => {
            projections[year] = {
                best: Math.round(budget * Math.pow(1 + maxRate, year)),
                expected: Math.round(budget * Math.pow(1 + avgRate, year)),
                worst: Math.round(budget * Math.pow(1 + minRate * 0.5, year)) // Conservative worst case
            };
        });

        return projections;
    }

    function getAllocationBreakdown(budget, strategy) {
        const breakdown = [];
        for (const [name, percent] of Object.entries(strategy.allocation)) {
            breakdown.push({
                name,
                percent,
                amount: Math.round(budget * (percent / 100)),
                color: getAssetColor(name)
            });
        }
        return breakdown;
    }

    // Customize strategy based on user allocation preferences
    function customizeStrategy(profile) {
        const base = getStrategy(profile.sentiment.category);
        
        // Create a custom allocation merging user preferences with strategy template
        const customAllocation = {};
        const stockPercent = profile.stocks;
        const metalPercent = profile.metals;
        const cryptoPercent = profile.crypto;

        // Distribute stocks
        if (profile.sentiment.category === 'aggressive') {
            customAllocation['Large-cap Stocks'] = Math.round(stockPercent * 0.45);
            customAllocation['Mid-cap Stocks'] = Math.round(stockPercent * 0.35);
            customAllocation['Small-cap Stocks'] = Math.round(stockPercent * 0.20);
        } else if (profile.sentiment.category === 'balanced') {
            customAllocation['Large-cap Stocks'] = Math.round(stockPercent * 0.70);
            customAllocation['Mid-cap Stocks'] = Math.round(stockPercent * 0.30);
        } else {
            customAllocation['Large-cap Stocks'] = stockPercent;
        }

        // Distribute metals
        customAllocation['Gold'] = Math.round(metalPercent * 0.75);
        customAllocation['Silver'] = Math.round(metalPercent * 0.25);

        // Distribute crypto
        if (cryptoPercent > 0) {
            customAllocation['Bitcoin'] = Math.round(cryptoPercent * 0.65);
            customAllocation['Ethereum'] = Math.round(cryptoPercent * 0.35);
        }

        // Normalize to 100%
        const total = Object.values(customAllocation).reduce((a, b) => a + b, 0);
        if (total !== 100) {
            const diff = 100 - total;
            const firstKey = Object.keys(customAllocation)[0];
            customAllocation[firstKey] += diff;
        }

        return {
            ...base,
            allocation: customAllocation
        };
    }

    return { getStrategy, getAssetColor, calculateProjectedReturns, getAllocationBreakdown, customizeStrategy };
})();
