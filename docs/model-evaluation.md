# Model evaluation and reporting

## Forest classifier

Report:
- Confusion matrix
- Overall accuracy
- Kappa (optional)
- Producer's accuracy per class
- Consumer's/user's accuracy per class
- Precision, recall and F1 per class

The reference is ESA WorldCover 2021, so describe this as agreement with WorldCover-derived labels. The same 2021-trained model is applied retrospectively to 1990, 2000, 2010, 2020 and 2025; historical maps are not independently validated ground truth.

## Risk classifier

Report separately:
- Internal holdout metrics from the training period (2011–2013 loss target)
- Temporal validation metrics (2016–2018 loss target)
- Positive and negative sample counts
- Confusion matrix
- Precision, recall, F1 and class-specific accuracies

The temporal test is stronger than a random split, but spatial autocorrelation and the limitations of Hansen labels remain. The risk model only represents the eligible circa-2000 forest cohort and does not fully include post-2000 regrowth.

## Area statistics

Report ML-derived forest-to-nonforest transitions separately for 1990–2000, 2000–2010, 2010–2020 and 2020–2025. Hansen reference loss is available only from 2001 onward; it cannot validate the 1990–2000 interval. Explain differences between the classification-based transition and Hansen's stand-replacement loss definition.

## Do not fabricate results

Use placeholders until the Earth Engine script has run:
- Forest classifier accuracy: pending
- Temporal validation accuracy (2016–2018): pending
- 1990–2000 ML forest transition: pending ha
- 2000–2010 ML forest transition: pending ha
- 2010–2020 ML forest transition: pending ha
- 2020–2025 ML forest transition: pending ha
- Very-high susceptibility area: pending ha

## Recommended stronger validation

If time permits:
1. Divide the study area into spatial blocks.
2. Assign entire blocks to training or testing.
3. Avoid placing neighboring pixels from the same forest patch in both sets.
4. Validate on a separate forest region not used for training.
