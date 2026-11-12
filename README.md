# Western Ghats Deforestation Monitoring

An Earth Engine project for forest-cover classification, historical deforestation detection, and future deforestation susceptibility mapping using Sentinel-1 SAR, Sentinel-2 optical imagery, and Random Forest.

> **Project status:** Initial executable Google Earth Engine implementation. The workflow requires execution and validation in the user's Earth Engine account before results can be reported.

## Objectives

1. Classify forest and non-forest cover in a user-selected study area.
2. Compare historical observations and map forest-to-non-forest transitions.
3. Estimate forest-loss susceptibility for a future planning horizon.
4. Export GeoTIFF maps and area statistics.
5. Support analysis of new user-drawn regions and, with correctly prepared assets, uploaded imagery.

## Study area and periods

- Initial study region: Western Ghats, Tamil Nadu (user-drawn polygon).
- Historical comparison: 2018, 2021, 2024.
- Current observation/risk input: 2026 composite.
- Prospective susceptibility horizon: 2026–2028.

The default composite window is January–April for comparable seasonal observations.

## Repository layout

```text
.
├── README.md
├── LICENSE
├── .gitignore
├── CONTRIBUTING.md
├── docs/
├── gee/
│   ├── main.js
│   ├── README.md
│   └── modules/                 # reserved for future modular refactor
├── data/
│   ├── raw/                     # local inputs; do not commit large imagery
│   ├── processed/               # local derived data; do not commit large rasters
│   └── README.md
├── outputs/
│   ├── maps/
│   ├── statistics/
│   └── exports/
├── reports/
│   ├── figures/
│   └── final-report.md
└── notebooks/
```

## Quick start

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Activate/register Earth Engine access if required.
3. Draw a polygon around the selected Western Ghats study area. The imported geometry must be named `geometry`.
4. Open `gee/main.js`, copy its contents into a new Code Editor script, and click **Run**.
5. Inspect the Console for image collection scene counts, sample counts, confusion matrices, accuracy values, and area statistics.
6. Inspect map layers.
7. Open **Tasks** and run the desired Google Drive GeoTIFF exports.

Detailed setup is in [`gee/README.md`](gee/README.md). Dataset details are in [`docs/dataset-workflow.md`](docs/dataset-workflow.md).

## Models

### Model A — forest / non-forest classification

- Inputs: Sentinel-1 VV, VH and VV−VH; Sentinel-2 bands B2, B3, B4, B8, B11, B12; NDVI and NBR; elevation and slope.
- Reference: ESA WorldCover 2021 classes.
- Algorithm: Random Forest.
- Output: binary forest/non-forest raster for each date.

### Model B — deforestation susceptibility

- Historical training target: Hansen tree-cover loss during 2019–2021 among the eligible baseline forest cohort.
- Training predictors: 2018 feature composite.
- Temporal holdout: 2021 predictors and loss during 2022–2024.
- Prediction predictors: 2026 feature composite.
- Output: relative susceptibility score and four illustrative risk classes.

## Important scientific limitations

- WorldCover is a reference map, not perfect ground truth. Report agreement with the reference, not absolute real-world accuracy.
- The current forest classifier samples labels in the selected AOI and retrains for that AOI. It is not a universal pretrained model.
- Random pixel train/test splits can inflate accuracy because nearby pixels are spatially correlated. For a stronger study, hold out spatial blocks or an entire geographic region.
- Hansen Global Forest Change measures stand-replacement tree-cover loss and does not capture every form of degradation or selective logging.
- The risk model uses a Hansen historical forest cohort and does not fully represent post-2000 regrowth.
- Risk scores are susceptibility estimates, not calibrated guarantees of future deforestation.
- The 2026–2028 horizon should be described as a susceptibility outlook. The 2026 input composite is a seasonal snapshot, not a full-year observation.
- Inspect scene counts, valid-pixel coverage, cloud masking and geographic boundaries before interpreting results.

## Reproducibility

Record the following for every run:

- Study-area polygon or asset ID
- Run date
- Composite date window
- Earth Engine dataset IDs / versions
- Sampling parameters and random seed
- Model parameters
- Confusion matrices and metrics
- Export scale and projection
- Any manual corrections

Use `docs/model-evaluation.md` as the reporting checklist.

## Data and licensing

Satellite and reference datasets retain their respective provider terms and attribution requirements. Do not commit large raw satellite imagery or private Earth Engine asset identifiers to this repository. See [`data/README.md`](data/README.md).

## Roadmap

- [x] Initial end-to-end Earth Engine script
- [x] Sentinel-1 and Sentinel-2 feature fusion
- [x] Forest classification and historical change mapping
- [x] Temporal risk-model validation workflow
- [ ] Run and debug on selected Western Ghats AOI
- [ ] Spatial-block validation
- [ ] Add roads / settlement accessibility predictors
- [ ] Add post-2000 regrowth handling
- [ ] Refactor Earth Engine code into reusable modules
- [ ] Add Python GeoTIFF upload/preprocessing workflow
- [ ] Build a user-facing interface and downloadable report
