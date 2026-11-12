# System architecture

```text
User-drawn AOI (geometry)
          |
          v
Landsat 5/7 (1990–2010) + Landsat 8/9 (2015–2025)
          |
          v
QA masking + SR scaling + Jan–Apr median composites
          |
          v
10-band feature stack (6 SR bands, NDVI, NBR, elevation, slope)
          |
          +-------------------------------+
          |                               |
          v                               v
WorldCover 2021 labels             Hansen loss-year labels
          |                               |
          v                               v
Forest / non-forest RF             Susceptibility RF
          |                         train 2010 / validate 2015
          v                               |
Classify 1990, 2000, 2010,               v
2020 and 2025                         2025 risk outlook
          |                               |
          v                               v
Forest transitions + hectares     Relative susceptibility map
          |                               |
          +---------------+---------------+
                          |
                          v
                GeoTIFFs / report figures
```

## Model separation

**Forest classification** estimates which pixels match the selected reference forest class.

**Change detection** identifies pixels classified as forest at an earlier date and non-forest at a later date.

**Susceptibility prediction** estimates relative similarity to historical loss examples within the eligible Hansen circa-2000 forest cohort.

These tasks and their evaluation metrics must be reported separately.

## Generalization and temporal caveats

The forest classifier is trained within the selected AOI using 2021 labels, then applied retrospectively. Landsat sensor and processing differences remain, and the 2021 reference is not ground truth for 1990. The Hansen loss product begins in 2001 and cannot validate the 1990–2000 interval. The initial risk model does not include post-2000 regrowth.
