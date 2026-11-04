const STORAGE_KEY = 'procurio_supplier_wizard_progress';
const TOTAL_STEPS = 6;

export function completionFromHighestStep(highestStep, submitted = false, currentStep = null) {
  if (submitted) return 100;
  let step = Math.max(1, Math.min(TOTAL_STEPS, Number(highestStep) || 1));
  const onReview = currentStep === TOTAL_STEPS || step >= TOTAL_STEPS;
  if (onReview && !submitted) {
    step = TOTAL_STEPS - 1;
  }
  return Math.round((step / TOTAL_STEPS) * 100);
}

export function readSupplierWizardProgress() {
  if (typeof window === 'undefined') {
    return { currentStep: 1, highestStep: 5, submitted: false, completion: 83 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { currentStep: 1, highestStep: 1, submitted: false, completion: completionFromHighestStep(1) };
    }
    const data = JSON.parse(raw);
    const highestStep = data.highestStep ?? data.currentStep ?? 1;
    const submitted = Boolean(data.submitted);
    return {
      currentStep: data.currentStep ?? 1,
      highestStep,
      submitted,
      completion: completionFromHighestStep(highestStep, submitted, data.currentStep),
    };
  } catch {
    return { currentStep: 1, highestStep: 1, submitted: false, completion: completionFromHighestStep(1, false, 1) };
  }
}

export function writeSupplierWizardProgress(partial) {
  if (typeof window === 'undefined') return readSupplierWizardProgress();
  const prev = readSupplierWizardProgress();
  const next = {
    currentStep: partial.currentStep ?? prev.currentStep,
    highestStep: partial.highestStep ?? prev.highestStep,
    submitted: partial.submitted ?? prev.submitted,
  };
  next.highestStep = Math.max(next.highestStep, next.currentStep);
  const completion = completionFromHighestStep(next.highestStep, next.submitted, next.currentStep);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentStep: next.currentStep,
      highestStep: next.highestStep,
      submitted: next.submitted,
      updatedAt: new Date().toISOString(),
    })
  );
  window.dispatchEvent(new CustomEvent('procurio-wizard-progress'));
  return { ...next, completion };
}

export { TOTAL_STEPS };
