# Final project report (working template)

## Title
Long-term Landsat-based forest-cover change detection and deforestation susceptibility mapping in the Tamil Nadu Western Ghats (1990–2025)

## Abstract
[Insert after running the Earth Engine workflow. Do not invent area estimates or accuracy values.]

## Study area
[Insert selected polygon, coordinates, area and rationale.]

## Data and methods
Landsat Collection 2 Level-2 surface reflectance composites for 1990, 2000, 2010, 2015, 2020, 2021 and 2025 were prepared using a consistent January–April seasonal window. A Random Forest classifier was trained with 2021 Landsat features and ESA WorldCover 2021 reference labels, then applied to the five comparison years. Forest-to-nonforest transitions were mapped for 1990–2000, 2000–2010, 2010–2020 and 2020–2025. Hansen Global Forest Change loss-year labels were used for reference comparison from 2001 onward and for a separate susceptibility model.

## Results
[Insert measured forest area, transition area, confusion matrix and temporal validation metrics from the Earth Engine Console.]

## Limitations
The classifier uses 2021 reference labels retrospectively; Landsat sensor/processing differences remain. Hansen loss begins in 2001 and does not validate 1990–2000. Hansen represents stand-replacement tree-cover loss and the risk cohort excludes post-2000 regrowth. Risk outputs are relative susceptibility, not calibrated probabilities.

## Conclusion
[Write after inspecting the exported maps and measured results.]
