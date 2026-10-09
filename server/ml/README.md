# Priority model status

The current model is a small binary logistic-regression prototype trained from the supplied `indian_judiciary_cases_updated_with_features.csv`. It uses only `case_type`; it does not use age, income, or other personal details. The dataset is not included in this repository.

Rebuild the model and its holdout report from the project root:

```powershell
python server/ml/train_priority.py "C:\path\to\indian_judiciary_cases_updated_with_features.csv"
```

The evaluation uses a deterministic stratified 80/20 split. The supplied data produced 53.54% holdout accuracy, equal to the majority-class baseline, 50% balanced accuracy, and 0% recall for label 1. Therefore the API intentionally reports the model as unavailable instead of returning a misleading case estimate. The saved metrics are in `priority_model.json`.

The dataset's `priority_label` is a binary label with no documented mapping to the website's Low/Medium/High options. Do not treat it as a legal urgency rating. A larger, representative, reviewed dataset with a clear label definition is needed before this signal can help clerks.
