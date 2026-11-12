# Model evaluation and reporting

## Forest classifier

Report:
- Confusion matrix
- Overall accuracy
- Kappa (optional)
- Producer's accuracy per class
- Consumer's/user's accuracy per class
- Precision, recall and F1 per class

The reference is ESA WorldCover 2021, so describe this as agreement with WorldCover-derived labels.

## Risk classifier

Report separately:
- Internal holdout metrics from the training period
- Temporal validation metrics for 2022–2024
- Positive and negative sample counts
- Confusion matrix
- Precision, recall, F1 and class-specific accuracies

A temporal test is stronger than a random split, but spatial autocorrelation and the limitations of Hansen labels remain.

## Area statistics

Report ML-derived transitions and Hansen reference loss in separate rows. Explain their differences.

## Do not fabricate results

Use placeholders until the Earth Engine script has run:
- Forest classifier accuracy: pending
- Temporal validation accuracy: pending
- 2018–2021 ML loss: pending ha
- 2021–2024 ML loss: pending ha
- High-risk area: pending ha

## Recommended stronger validation

If time permits:
1. Divide the study area into spatial blocks.
2. Assign entire blocks to training or testing.
3. Avoid placing neighboring pixels from the same forest patch in both sets.
4. Validate on a separate forest region not used for training.
