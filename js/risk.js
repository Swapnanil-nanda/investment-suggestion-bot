/* ============================================================
   RISK.JS — 4-Step Risk Assessment Wizard + Sentiment Scoring
   ============================================================ */

const Risk = (() => {
    let currentStep = 1;
    const totalSteps = 4;

    // Slider configuration: id suffix, label, default value
    const sliderConfig = [
        { id: 'equity', label: 'Equity', defaultVal: 30 },
        { id: 'metals', label: 'Precious Metals (Gold, Silver)', defaultVal: 15 },
        { id: 'crypto', label: 'Cryptocurrency', defaultVal: 10 },
        { id: 'fd', label: 'FD (Fixed Deposits)', defaultVal: 15 },
        { id: 'ppf', label: 'PPF (Public Provident Fund)', defaultVal: 10 },
        { id: 'nps', label: 'NPS (National Pension System)', defaultVal: 10 },
        { id: 'misc', label: 'Miscellaneous (Bonds, ULIP, etc.)', defaultVal: 10 }
    ];

    let isAdjusting = false; // Prevent recursive adjustments

    function init() {
        currentStep = 1;
        showStep(1);
        updateProgress();

        // Reset all slider and input values to defaults
        sliderConfig.forEach(cfg => {
            const slider = document.getElementById(`slider-${cfg.id}`);
            const input = document.getElementById(`input-${cfg.id}`);
            if (slider) {
                slider.value = cfg.defaultVal;
                updateSliderBackground(slider);
            }
            if (input) {
                input.value = cfg.defaultVal;
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
                // Total is always 100% due to auto-adjustment
                return true;
            }
        }
        return true;
    }

    function getTotalAllocation() {
        let total = 0;
        sliderConfig.forEach(cfg => {
            total += parseInt(document.getElementById(`slider-${cfg.id}`)?.value || 0);
        });
        return total;
    }

    function updateSliderDisplay() {
        let total = 0;
        sliderConfig.forEach(cfg => {
            const val = parseInt(document.getElementById(`slider-${cfg.id}`)?.value || 0);
            total += val;
            const valEl = document.getElementById(`${cfg.id}-val`);
            if (valEl) valEl.textContent = val + '%';
        });

        const totalEl = document.getElementById('total-allocation');
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

    /**
     * Auto-adjust other sliders when one slider changes.
     * When slider X changes by delta, distribute -delta proportionally among the OTHER sliders.
     * This ensures total always stays at 100%.
     */
    function autoAdjustSliders(changedId, newValue) {
        if (isAdjusting) return;
        isAdjusting = true;

        newValue = Math.max(0, Math.min(100, parseInt(newValue) || 0));

        // Get current values of all sliders
        const others = [];
        let othersTotal = 0;
        sliderConfig.forEach(cfg => {
            if (cfg.id !== changedId) {
                const s = document.getElementById(`slider-${cfg.id}`);
                const v = parseInt(s?.value || 0);
                others.push({ id: cfg.id, value: v });
                othersTotal += v;
            }
        });

        const remaining = 100 - newValue;

        if (remaining < 0) {
            // If user set value > 100, clamp it
            newValue = 100;
            const slider = document.getElementById(`slider-${changedId}`);
            if (slider) slider.value = 100;
            const input = document.getElementById(`input-${changedId}`);
            if (input) input.value = 100;
            // Set all others to 0
            others.forEach(o => {
                const s = document.getElementById(`slider-${o.id}`);
                const inp = document.getElementById(`input-${o.id}`);
                if (s) { s.value = 0; updateSliderBackground(s); }
                if (inp) inp.value = 0;
            });
        } else if (othersTotal === 0) {
            // All others are 0, distribute remaining to first available
            if (remaining > 0 && others.length > 0) {
                // Distribute evenly
                const perSlider = Math.floor(remaining / others.length);
                let leftover = remaining - (perSlider * others.length);
                others.forEach((o, i) => {
                    const v = perSlider + (i < leftover ? 1 : 0);
                    const s = document.getElementById(`slider-${o.id}`);
                    const inp = document.getElementById(`input-${o.id}`);
                    if (s) { s.value = v; updateSliderBackground(s); }
                    if (inp) inp.value = v;
                });
            }
        } else {
            // Distribute remaining proportionally among others
            let distributed = 0;
            const newValues = others.map((o, i) => {
                if (i === others.length - 1) {
                    // Last one gets the remainder to avoid rounding issues
                    return remaining - distributed;
                }
                const proportional = Math.round((o.value / othersTotal) * remaining);
                distributed += proportional;
                return proportional;
            });

            others.forEach((o, i) => {
                const v = Math.max(0, newValues[i]);
                const s = document.getElementById(`slider-${o.id}`);
                const inp = document.getElementById(`input-${o.id}`);
                if (s) { s.value = v; updateSliderBackground(s); }
                if (inp) inp.value = v;
            });
        }

        // Update the changed slider display
        const changedSlider = document.getElementById(`slider-${changedId}`);
        if (changedSlider) updateSliderBackground(changedSlider);

        updateSliderDisplay();
        isAdjusting = false;
    }

    function collectData() {
        const budget = parseFloat(document.getElementById('risk-budget')?.value || 0);
        const tolerance = document.querySelector('input[name="risk-tolerance"]:checked')?.value || 'balanced';
        const goal = document.querySelector('input[name="invest-goal"]:checked')?.value || 'wealth';
        const horizon = document.querySelector('input[name="time-horizon"]:checked')?.value || 'medium';

        const data = { budget, tolerance, goal, horizon };
        sliderConfig.forEach(cfg => {
            data[cfg.id] = parseInt(document.getElementById(`slider-${cfg.id}`)?.value || 0);
        });

        return data;
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
        if (data.equity > 50) score += 0.5;
        if (data.metals > 50) score -= 0.5;

        // Clamp between 1 and 10
        score = Math.max(1, Math.min(10, score));

        // FIX: Strategy category is ALWAYS the user's explicit risk tolerance choice
        // The sentiment score is informational only, it does NOT override the user's selection
        const category = data.tolerance;

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

        // Sliders — auto-adjust on change
        sliderConfig.forEach(cfg => {
            const slider = document.getElementById(`slider-${cfg.id}`);
            const input = document.getElementById(`input-${cfg.id}`);

            if (slider) {
                slider.addEventListener('input', () => {
                    const val = parseInt(slider.value) || 0;
                    if (input) input.value = val;
                    autoAdjustSliders(cfg.id, val);
                });
                // Initialize background
                updateSliderBackground(slider);
            }

            if (input) {
                input.addEventListener('change', () => {
                    let val = parseInt(input.value) || 0;
                    val = Math.max(0, Math.min(100, val));
                    input.value = val;
                    if (slider) slider.value = val;
                    autoAdjustSliders(cfg.id, val);
                });
                // Also handle live typing
                input.addEventListener('input', () => {
                    let val = parseInt(input.value) || 0;
                    val = Math.max(0, Math.min(100, val));
                    if (slider) slider.value = val;
                    autoAdjustSliders(cfg.id, val);
                });
            }
        });
    }

    return { init, initListeners };
})();
