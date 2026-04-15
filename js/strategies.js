/* ============================================================
   STRATEGIES.JS — Strategy Generation + Projected Returns
   ============================================================ */

const Strategies = (() => {

    // Strategy definitions — names are simple and clear
    const strategyMap = {
        conservative: {
            name: 'Conservative Strategy',
            desc: 'Capital preservation focus with stable returns and minimal volatility',
            returnRange: [6, 9],
            riskLabel: 'Low Risk',
            allocation: {
                'Large-cap Equity': 15,
                'Gold': 20,
                'Silver': 5,
                'FD': 25,
                'PPF': 15,
                'NPS': 10,
                'Miscellaneous': 10
            },
            benefits: [
                'Lower volatility and stable returns',
                'Capital preservation in market downturns',
                'Regular income through FDs, PPF and bonds',
                'Tax benefits through PPF and NPS'
            ],
            risks: [
                'Lower growth potential',
                'May not beat inflation in high-inflation periods',
                'Limited exposure to high-growth sectors'
            ]
        },
        balanced: {
            name: 'Balanced Strategy',
            desc: 'Optimal mix of growth and stability for moderate returns',
            returnRange: [10, 15],
            riskLabel: 'Balanced Risk',
            allocation: {
                'Large-cap Equity': 25,
                'Mid-cap Equity': 10,
                'Gold': 15,
                'Silver': 5,
                'Bitcoin': 5,
                'Ethereum': 5,
                'FD': 10,
                'PPF': 10,
                'NPS': 5,
                'Miscellaneous': 10
            },
            benefits: [
                'Diversified risk across asset classes',
                'Moderate growth with acceptable volatility',
                'Exposure to both traditional and digital assets',
                'Tax-saving instruments included (PPF, NPS)'
            ],
            risks: [
                'Moderate market fluctuations expected',
                'Crypto allocation adds some volatility',
                'Returns may vary significantly year to year'
            ]
        },
        aggressive: {
            name: 'Aggressive Strategy',
            desc: 'High-growth focus with maximum returns potential and higher volatility',
            returnRange: [15, 25],
            riskLabel: 'High Risk',
            allocation: {
                'Large-cap Equity': 20,
                'Mid-cap Equity': 15,
                'Small-cap Equity': 10,
                'Bitcoin': 15,
                'Ethereum': 10,
                'Altcoins': 5,
                'Gold': 5,
                'NPS': 5,
                'Miscellaneous': 15
            },
            benefits: [
                'Maximum growth potential',
                'Heavy exposure to high-performing crypto and equity assets',
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
        'Large-cap Equity': '#3B82F6',
        'Mid-cap Equity': '#22C55E',
        'Small-cap Equity': '#14B8A6',
        'Gold': '#F59E0B',
        'Silver': '#EF4444',
        'Bitcoin': '#A855F7',
        'Ethereum': '#EC4899',
        'Altcoins': '#F97316',
        'FD': '#6366F1',
        'PPF': '#8B5CF6',
        'NPS': '#06B6D4',
        'Miscellaneous': '#64748B'
    };

    function getStrategy(sentimentCategory) {
        return strategyMap[sentimentCategory] || strategyMap.balanced;
    }

    function getAssetColor(assetName) {
        return assetColors[assetName] || '#64748B';
    }

    function calculateProjectedReturns(budget, strategy, horizon) {
        const minRate = strategy.returnRange[0] / 100;
        const maxRate = strategy.returnRange[1] / 100;
        const avgRate = (minRate + maxRate) / 2;

        const projections = {};
        // Always include 1 year and use dynamic years based on horizon
        const horizonYears = { short: 3, medium: 7, long: 10 };
        const maxYear = horizonYears[horizon] || 7;
        const years = [1, 3, 5, 7, 10].filter(y => y <= Math.max(maxYear, 10));
        if (!years.includes(1)) years.unshift(1);
        // Ensure we cover up to max year
        if (!years.includes(maxYear) && maxYear > 1) {
            years.push(maxYear);
            years.sort((a, b) => a - b);
        }

        years.forEach(year => {
            const best = Math.round(budget * Math.pow(1 + maxRate, year));
            const expected = Math.round(budget * Math.pow(1 + avgRate, year));
            const worst = Math.round(budget * Math.pow(1 + minRate * 0.5, year));
            projections[year] = {
                best,
                expected,
                worst,
                gain_best: best - budget,
                gain_expected: expected - budget,
                gain_worst: worst - budget
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
        // FIX: Use risk tolerance DIRECTLY as strategy category
        // The user's explicit risk tolerance choice should be the primary determinant
        const category = profile.tolerance || profile.sentiment.category;
        const base = getStrategy(category);

        // Create a custom allocation merging user preferences with strategy template
        const customAllocation = {};
        const equityPercent = profile.equity || profile.stocks || 0;
        const metalPercent = profile.metals || 0;
        const cryptoPercent = profile.crypto || 0;
        const fdPercent = profile.fd || 0;
        const ppfPercent = profile.ppf || 0;
        const npsPercent = profile.nps || 0;
        const miscPercent = profile.misc || 0;

        // Distribute equity
        if (category === 'aggressive') {
            customAllocation['Large-cap Equity'] = Math.round(equityPercent * 0.45);
            customAllocation['Mid-cap Equity'] = Math.round(equityPercent * 0.35);
            customAllocation['Small-cap Equity'] = Math.round(equityPercent * 0.20);
        } else if (category === 'balanced') {
            customAllocation['Large-cap Equity'] = Math.round(equityPercent * 0.70);
            customAllocation['Mid-cap Equity'] = Math.round(equityPercent * 0.30);
        } else {
            customAllocation['Large-cap Equity'] = equityPercent;
        }

        // Distribute metals
        if (metalPercent > 0) {
            customAllocation['Gold'] = Math.round(metalPercent * 0.75);
            customAllocation['Silver'] = Math.round(metalPercent * 0.25);
        }

        // Distribute crypto
        if (cryptoPercent > 0) {
            if (category === 'aggressive') {
                customAllocation['Bitcoin'] = Math.round(cryptoPercent * 0.50);
                customAllocation['Ethereum'] = Math.round(cryptoPercent * 0.35);
                customAllocation['Altcoins'] = Math.round(cryptoPercent * 0.15);
            } else {
                customAllocation['Bitcoin'] = Math.round(cryptoPercent * 0.65);
                customAllocation['Ethereum'] = Math.round(cryptoPercent * 0.35);
            }
        }

        // Direct allocations
        if (fdPercent > 0) customAllocation['FD'] = fdPercent;
        if (ppfPercent > 0) customAllocation['PPF'] = ppfPercent;
        if (npsPercent > 0) customAllocation['NPS'] = npsPercent;
        if (miscPercent > 0) customAllocation['Miscellaneous'] = miscPercent;

        // Remove zero entries
        for (const key of Object.keys(customAllocation)) {
            if (customAllocation[key] <= 0) delete customAllocation[key];
        }

        // Normalize to 100%
        const total = Object.values(customAllocation).reduce((a, b) => a + b, 0);
        if (total !== 100 && total > 0) {
            const diff = 100 - total;
            const firstKey = Object.keys(customAllocation)[0];
            customAllocation[firstKey] += diff;
        }

        return {
            ...base,
            name: base.name,
            desc: base.desc,
            riskLabel: base.riskLabel,
            allocation: customAllocation
        };
    }

    return { getStrategy, getAssetColor, calculateProjectedReturns, getAllocationBreakdown, customizeStrategy };
})();
