/* ============================================================
   RISK.JS — 4-Step Risk Assessment Wizard + Sentiment Scoring
   ============================================================ */

const Risk = (() => {
    let currentStep = 1;
    const totalSteps = 4;

    function init() {
        currentStep = 1;
        showStep(1);
        updateProgress();
        // Reset slider values
        const sliders = ['stocks', 'metals', 'crypto'];
        const defaults = [40, 30, 30];
        sliders.forEach((s, i) => {
            const slider = document.getElementById(`slider-${s}`);
            if (slider) {
                slider.value = defaults[i];
                updateSliderBackground(slider);
            }
        });
        updateSliderDisplay();
    }

    function showStep(step) {
        for (let i = 1; i <= totalSteps; i++) {
            const el = document.getElementById(`risk-step-${i}`);
            if (el) el.style.display = i === step ? 'block' : 'none';
        }

        // Update back button visibility
        const backBtn = document.getElementById('risk-back');
        if (backBtn) backBtn.style.display = step > 1 ? 'inline-flex' : 'none';

        // Update next button text
        const nextBtn = document.getElementById('risk-next');
        if (nextBtn) {
            if (step === totalSteps) {
                nextBtn.innerHTML = 'Complete Assessment';
            } else {
                nextBtn.innerHTML = 'Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            }
        }
    }

    function updateProgress() {
        const percent = (currentStep / totalSteps) * 100;
        const progressBar = document.getElementById('risk-progress');
        const percentLabel = document.getElementById('risk-percent');
        const stepLabel = document.getElementById('risk-step-num');

        if (progressBar) progressBar.style.width = percent + '%';
        if (percentLabel) percentLabel.textContent = Math.round(percent) + '%';
        if (stepLabel) stepLabel.textContent = currentStep;
    }

    function validateStep(step) {
        switch (step) {
            case 1: {
                const budget = document.getElementById('risk-budget');
                if (!budget || !budget.value || parseFloat(budget.value) < 1000) {
                    alert('Please enter a valid investment budget (minimum ₹1,000)');
                    return false;
                }
                return true;
            }
            case 2: {
                const tolerance = document.querySelector('input[name="risk-tolerance"]:checked');
                if (!tolerance) {
                    alert('Please select your risk tolerance level.');
                    return false;
                }
                return true;
            }
            case 3: {
                const goal = document.querySelector('input[name="invest-goal"]:checked');
                const horizon = document.querySelector('input[name="time-horizon"]:checked');
                if (!goal) {
                    alert('Please select your investment goal.');
                    return false;
                }
                if (!horizon) {
                    alert('Please select your investment time horizon.');
                    return false;
                }
                return true;
            }
            case 4: {
                const total = getTotalAllocation();
                if (total !== 100) {
                    alert('Total allocation must equal 100%. Currently at ' + total + '%.');
                    return false;
                }
                return true;
            }
        }
        return true;
    }

    function getTotalAllocation() {
        const stocks = parseInt(document.getElementById('slider-stocks')?.value || 0);
        const metals = parseInt(document.getElementById('slider-metals')?.value || 0);
        const crypto = parseInt(document.getElementById('slider-crypto')?.value || 0);
        return stocks + metals + crypto;
    }

    function updateSliderDisplay() {
        const stocks = parseInt(document.getElementById('slider-stocks')?.value || 0);
        const metals = parseInt(document.getElementById('slider-metals')?.value || 0);
        const crypto = parseInt(document.getElementById('slider-crypto')?.value || 0);
        const total = stocks + metals + crypto;

        const stocksVal = document.getElementById('stocks-val');
        const metalsVal = document.getElementById('metals-val');
        const cryptoVal = document.getElementById('crypto-val');
        const totalEl = document.getElementById('total-allocation');

        if (stocksVal) stocksVal.textContent = stocks + '%';
        if (metalsVal) metalsVal.textContent = metals + '%';
        if (cryptoVal) cryptoVal.textContent = crypto + '%';

        if (totalEl) {
            totalEl.textContent = total + '%';
            totalEl.classList.remove('valid', 'invalid');
            totalEl.classList.add(total === 100 ? 'valid' : 'invalid');
        }
    }

    function updateSliderBackground(slider) {
        const val = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #0F172A 0%, #0F172A ${val}%, #E2E8F0 ${val}%, #E2E8F0 100%)`;
    }

    function collectData() {
        const budget = parseFloat(document.getElementById('risk-budget')?.value || 0);
        const tolerance = document.querySelector('input[name="risk-tolerance"]:checked')?.value || 'balanced';
        const goal = document.querySelector('input[name="invest-goal"]:checked')?.value || 'wealth';
        const horizon = document.querySelector('input[name="time-horizon"]:checked')?.value || 'medium';
        const stocks = parseInt(document.getElementById('slider-stocks')?.value || 40);
        const metals = parseInt(document.getElementById('slider-metals')?.value || 30);
        const crypto = parseInt(document.getElementById('slider-crypto')?.value || 30);

        return { budget, tolerance, goal, horizon, stocks, metals, crypto };
    }

    function calculateSentimentScore(data) {
        // Sentiment score: 1 (very conservative) to 10 (very aggressive)
        let score = 5; // Base score

        // Risk tolerance contribution (heaviest weight)
        switch (data.tolerance) {
            case 'conservative': score -= 2; break;
            case 'balanced': score += 0; break;
            case 'aggressive': score += 2; break;
        }

        // Goal contribution
        switch (data.goal) {
            case 'preservation': score -= 1.5; break;
            case 'income': score -= 0.5; break;
            case 'wealth': score += 0.5; break;
            case 'retirement': score += 0; break;
        }

        // Time horizon contribution
        switch (data.horizon) {
            case 'short': score -= 1; break;
            case 'medium': score += 0; break;
            case 'long': score += 1; break;
        }

        // Allocation contribution
        if (data.crypto > 30) score += 1;
        if (data.stocks > 50) score += 0.5;
        if (data.metals > 50) score -= 0.5;

        // Clamp between 1 and 10
        score = Math.max(1, Math.min(10, score));

        // Determine sentiment category
        let category;
        if (score <= 3.5) category = 'conservative';
        else if (score <= 6.5) category = 'balanced';
        else category = 'aggressive';

        return { score: Math.round(score * 10) / 10, category };
    }

    function complete() {
        const data = collectData();
        const sentiment = calculateSentimentScore(data);

        const profile = {
            ...data,
            sentiment,
            completedAt: new Date().toISOString()
        };

        Auth.saveRiskProfile(profile);
        App.navigate('dashboard');
    }

    function initListeners() {
        // Next button
        const nextBtn = document.getElementById('risk-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!validateStep(currentStep)) return;

                if (currentStep === totalSteps) {
                    complete();
                } else {
                    currentStep++;
                    showStep(currentStep);
                    updateProgress();
                }
            });
        }

        // Back button
        const backBtn = document.getElementById('risk-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    showStep(currentStep);
                    updateProgress();
                }
            });
        }

        // Sliders
        ['stocks', 'metals', 'crypto'].forEach(name => {
            const slider = document.getElementById(`slider-${name}`);
            if (slider) {
                slider.addEventListener('input', () => {
                    updateSliderDisplay();
                    updateSliderBackground(slider);
                });
                // Initialize background
                updateSliderBackground(slider);
            }
        });
    }

    return { init, initListeners };
})();
