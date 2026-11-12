# Dataset workflow

All datasets are accessed through Google Earth Engine in the initial implementation.

| Dataset | Earth Engine ID | Use |
|---|---|---|
| Sentinel-1 GRD | `COPERNICUS/S1_GRD` | VV/VH radar features |
| Sentinel-2 SR Harmonized | `COPERNICUS/S2_SR_HARMONIZED` | Optical features and indices |
| ESA WorldCover 2021 | `ESA/WorldCover/v200` | Forest/non-forest reference labels |
| Hansen Global Forest Change | `UMD/hansen/global_forest_change_2025_v1_13` | Historical loss reference |
| SRTM | `USGS/SRTMGL1_003` | Elevation and slope |

## Processing workflow

1. User draws a study polygon in Earth Engine.
2. Filter each collection by the polygon and date window.
3. Build median seasonal composites.
4. Mask Sentinel-2 cloud/shadow classes.
5. Derive NDVI and NBR.
6. Add SRTM elevation and slope.
7. Stack the 13 predictor bands.
8. Sample reference labels and train classifiers.
9. Export map rasters to Google Drive.

## External references

- [Sentinel-1 GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)
- [Sentinel-2 SR Harmonized](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [ESA WorldCover v200](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200)
- [Hansen Global Forest Change](https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2025_v1_13)
- [SRTM](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003)

## Uploaded imagery

The current upload hook expects a prepared multiband feature image, not arbitrary RGB imagery. Required bands:

`VV, VH, VV_minus_VH, B2, B3, B4, B8, B11, B12, NDVI, NBR, elevation, slope`

Units, masking, band meanings, resolution and compositing should match the training workflow. A single image supports classification and susceptibility scoring; two dates are needed for image-to-image change detection.

Large images should remain in Earth Engine Assets or local storage and should not be committed to Git.
