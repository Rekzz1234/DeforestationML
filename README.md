# Western Ghats Deforestation Monitoring (1990–2025)

An Earth Engine project for long-term forest-cover classification, historical forest-to-nonforest change detection, and a separate relative deforestation-susceptibility outlook. The main historical workflow uses Landsat Collection 2 Level-2 surface reflectance at 30 m, with Random Forest classification.

> **Project status:** Updated implementation. It still must be run, checked and validated in the user's Earth Engine account before any results or accuracy values can be reported.

## Study period and imagery

Historical comparison years: **1990, 2000, 2010, 2020 and 2025**.

Additional support composites:
- **2015:** temporal validation inputs for the susceptibility model.
- **2021:** classifier training inputs aligned to ESA WorldCover 2021 reference labels.

All composites use January 1–April 30 for seasonal comparability. Landsat 5/7 are used before 2013; Landsat 8/9 are used from 2013 onward. The script harmonizes band names and applies Collection 2 surface-reflectance scaling and QA masking. Cross-sensor spectral response differences are not fully removed and must be acknowledged.

## Repository layout

```text
.
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── docs/
│   ├── architecture.md
│   ├── dataset-workflow.md
│   ├── methodology.md
│   ├── model-evaluation.md
│   └── two-day-plan.md
├── gee/
│   ├── main.js
│   └── README.md
├── data/
├── outputs/
├── reports/
└── notebooks/
```

## Quick start

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Draw the study-area polygon and ensure the imported variable is named `geometry`.
3. Copy all of `gee/main.js` into a new Code Editor script.
4. Click **Run**. Check the Console for Landsat scene counts, sample counts, confusion matrices and area statistics.
5. Inspect all map layers. Confirm the composites are not empty and cloud gaps are acceptable.
6. Open **Tasks** and run the GeoTIFF exports to Google Drive.

## Models and outputs

### Model A — forest / non-forest classification

- Predictors: Landsat blue, green, red, NIR, SWIR1, SWIR2, NDVI, NBR, elevation and slope.
- Reference: ESA WorldCover 2021 (tree cover and mangroves as forest; selected land-cover classes as non-forest).
- Training: Landsat 2021 predictors with WorldCover 2021 labels.
- Application: 1990, 2000, 2010, 2020 and 2025 composites.
- Output: binary forest/non-forest maps and area estimates.

### Historical change detection

Forest-to-nonforest transitions are mapped for 1990–2000, 2000–2010, 2010–2020 and 2020–2025. The 1990–2000 interval has no Hansen Global Forest Change validation because Hansen's annual loss record begins in 2001.

### Model B — relative susceptibility outlook

- Training predictors: 2010 Landsat composite.
- Positive target: Hansen loss during 2011–2013 among the eligible circa-2000 forest cohort.
- Temporal validation: 2015 predictors and Hansen loss during 2016–2018.
- Prediction input: 2025 Landsat composite.
- Outlook: relative susceptibility for 2026–2028, masked to the remaining mapped circa-2000 forest cohort.

The score is not a calibrated probability or a guarantee of future clearing. This initial Hansen-based risk workflow excludes post-2000 regrowth from its eligible forest cohort.

## Scientific limitations

- WorldCover is a reference map, not perfect ground truth. Report agreement with reference labels rather than absolute real-world accuracy.
- The classifier is trained in the selected AOI and then applied retrospectively. It is not a universal pretrained model.
- A 2021-trained model applied to 1990 imagery can be affected by sensor differences, historical land-cover spectral differences and landscape changes.
- Landsat 5/7 use LEDAPS surface reflectance processing, while Landsat 8/9 use LaSRC; common band naming and scaling do not eliminate all sensor differences.
- Landsat 7 has scan-line-corrector gaps after 2003. Median composites may reduce but not necessarily eliminate missing pixels.
- Random pixel train/test splits can overstate accuracy due to spatial autocorrelation. Spatial-block validation is preferable.
- Hansen measures stand-replacement tree-cover loss and does not capture every form of degradation or selective logging. Its loss record begins in 2001.
- Hansen's 2000 tree-cover cohort does not fully represent post-2000 regrowth.
- Risk scores are relative susceptibility estimates, not calibrated probabilities.
- Inspect scene counts, valid-pixel coverage, cloud masking and boundaries before interpreting results.

## Reproducibility checklist

Record the AOI, run date, seasonal window, dataset IDs, sampling settings, random seed, classifier parameters, confusion matrices, area estimates, export scale and any manual corrections. See `docs/model-evaluation.md`.

## Data sources

- Landsat Collection 2 Level-2: USGS / Google Earth Engine.
- ESA WorldCover 2021: European Space Agency.
- Hansen Global Forest Change v1.13 (2000–2025): Hansen/UMD/Google/USGS/NASA.
- SRTM elevation: USGS.

See `docs/dataset-workflow.md` for Earth Engine IDs and links. Follow dataset attribution and license requirements.
