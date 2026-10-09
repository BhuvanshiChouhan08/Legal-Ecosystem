const model = require('./priority_model.json');

function predictPrioritySignal(caseType) {
  const evaluation = model.evaluation;
  if (
    evaluation.balanced_accuracy <= 0.5 ||
    evaluation.accuracy <= evaluation.majority_baseline_accuracy ||
    evaluation.positive_class_recall === 0
  ) {
    return {
      available: false,
      reason: 'The current model did not beat a majority-class baseline and missed every positive case in evaluation.',
      evaluation,
      humanReviewRequired: true,
    };
  }

  const normalizedType = String(caseType || '').trim().toLowerCase();
  if (!model.case_types.includes(normalizedType)) {
    const error = new Error(`Model supports only: ${model.case_types.join(', ')}`);
    error.status = 422;
    throw error;
  }

  const features = [1, Number(normalizedType === 'criminal'), Number(normalizedType === 'family')];
  const logit = model.weights.reduce((sum, weight, index) => sum + weight * features[index], 0);
  const probability = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, logit))));
  return {
    available: true,
    label: probability >= 0.5 ? 1 : 0,
    probability: Number(probability.toFixed(4)),
    labelMeaning: 'Dataset binary label only; it is not Low, Medium, or High legal priority.',
    model: model.model_type,
    evaluation,
    humanReviewRequired: true,
  };
}

module.exports = { predictPrioritySignal };
