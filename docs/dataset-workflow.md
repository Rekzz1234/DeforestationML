# Dataset workflow

All datasets are accessed directly through Google Earth Engine in the initial implementation.

| Dataset | Earth Engine ID | Period / role |
|---|---|---|
| Landsat 5 Collection 2 Tier 1 Level 2 | `LANDSAT/LT05/C02/T1_L2` | 1984–2012; 1990, 2000, 2010 composites |
| Landsat 7 Collection 2 Tier 1 Level 2 | `LANDSAT/LE07/C02/T1_L2` | 1999–2024; supports 2000 and 2010 composites |
| Landsat 8 Collection 2 Tier 1 Level 2 | `LANDSAT/LC08/C02/T1_L2` | 2013 onward; 2015, 2020, 2021, 2025 composites |
| Landsat 9 Collection 2 Tier 1 Level 2 | `LANDSAT/LC09/C02/T1_L2` | 2021 onward; supports 2025 composite |
| ESA WorldCover 2021 | `ESA/WorldCover/v200` | Forest/non-forest training labels |
| Hansen Global Forest Change v1.13 | `UMD/hansen/global_forest_change_2025_v1_13` | Annual forest loss reference, 2001–2025 |
| SRTM | `USGS/SRTMGL1_003` | Elevation and derived slope |

## Year-to-sensor mapping

| Composite year | Sensor collection(s) |
|---|---|
| 1990 | Landsat 5 |
| 2000 | Landsat 5 + Landsat 7 |
| 2010 | Landsat 5 + Landsat 7 |
| 2015 | Landsat 8 |
| 2020 | Landsat 8 |
| 2021 | Landsat 8 |
| 2025 | Landsat 8 + Landsat 9 |

All composites use January 1 to May 1 (exclusive), i.e. January–April. The script masks fill, dilated cloud, cirrus, cloud, cloud-shadow and snow QA bits, removes saturated pixels, applies the Collection 2 SR scale and offset, then computes NDVI and NBR. Landsat 5/7 and Landsat 8/9 have different source band names; the script maps them to common blue, green, red, nir, swir1 and swir2 names.

## Processing workflow

1. Draw a study polygon in Earth Engine and name the imported geometry `geometry`.
2. Filter the appropriate Landsat collections by AOI and January–April dates.
3. Apply QA masking and Collection 2 surface-reflectance scale/offset.
4. Create median composites and derive NDVI/NBR.
5. Add SRTM elevation and slope, forming a 10-band feature stack.
6. Train the forest classifier using 2021 Landsat predictors and WorldCover 2021 labels.
7. Classify the five historical comparison years.
8. Calculate forest-to-nonforest transitions and area in hectares.
9. Train/validate the separate Hansen-based susceptibility model and predict relative susceptibility from 2025 features.
10. Export maps to Google Drive.

## Important limitations

- Landsat 5/7 surface reflectance is generated using LEDAPS; Landsat 8/9 uses LaSRC. Cross-sensor differences remain.
- Landsat 7 scan-line-corrector gaps affect imagery after May 2003; median composites may reduce gaps but inspect coverage.
- Hansen loss starts in 2001, so it cannot be used to validate the 1990–2000 interval.
- Hansen treecover2000 cohort does not include all post-2000 regrowth.

## External references

- [Earth Engine Landsat guide and Collection 2 IDs](https://developers.google.com/earth-engine/guides/landsat)
- [Landsat 5 catalog](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LT05_C02_T1_L2)
- [Landsat 7 catalog](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LE07_C02_T1_L2)
- [Landsat 8 catalog](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2)
- [Landsat 9 catalog](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC09_C02_T1_L2)
- [ESA WorldCover v200](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200)
- [Hansen GFC 2025 v1.13](https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2025_v1_13)
- [SRTM](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003)
