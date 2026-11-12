# Methodology

## 1. Study area

Use a user-drawn polygon in the Tamil Nadu Western Ghats. Record its coordinates, area and selection rationale. The same polygon must be used for all years.

## 2. Satellite observations

Use Landsat Collection 2 Tier 1 Level 2 surface reflectance at 30 m. Build median composites for January–April in 1990, 2000, 2010, 2015, 2020, 2021 and 2025. Landsat 5/7 are used before 2013 and Landsat 8/9 from 2013 onward. 2015 and 2021 are support years for risk validation and reference-label training, respectively; the principal comparison years are 1990, 2000, 2010, 2020 and 2025.

### Preprocessing

- Mask fill, dilated cloud, cirrus, cloud, cloud shadow and snow using `QA_PIXEL`.
- Remove radiometrically saturated pixels using `QA_RADSAT`.
- Apply Collection 2 SR scaling: `DN * 0.0000275 - 0.2`.
- Harmonize source band names to blue, green, red, NIR, SWIR1 and SWIR2.
- Calculate NDVI and NBR.
- Add SRTM elevation and slope.

The feature stack contains 10 bands: six reflectance bands, NDVI, NBR, elevation and slope. Cross-sensor spectral response and atmospheric-processing differences remain; the preprocessing does not make all years perfectly radiometrically equivalent.

## 3. Forest classification

ESA WorldCover 2021 is used as a reference label source. Tree cover (class 10) and mangroves (95) are treated as forest. Selected shrubland, grassland, cropland, built-up and bare/sparse vegetation classes are sampled as non-forest; other classes are excluded.

Train a Random Forest using 2021 Landsat features and WorldCover labels. Apply that same classifier to the 1990, 2000, 2010, 2020 and 2025 feature composites. This provides a consistent classifier but is not independent historical ground truth. Historical results should be interpreted cautiously, particularly across Landsat sensor generations.

## 4. Historical change detection

For each interval (1990–2000, 2000–2010, 2010–2020 and 2020–2025), define a mapped transition as:

`forest at earlier date AND non-forest at later date`

Calculate area using `ee.Image.pixelArea()` and report hectares. Describe this as an ML-derived forest-to-nonforest transition unless independently validated. Hansen annual loss can be used as a reference only from 2001 onward; it cannot validate 1990–2000.

## 5. Susceptibility model

Hansen Global Forest Change v1.13 provides loss-year labels from 2001 through 2025. Train a separate Random Forest on 2010 Landsat features to identify the circa-2000 forest cohort that experienced Hansen loss in 2011–2013. Use 2015 Landsat features and loss during 2016–2018 as a temporal holdout. Apply the trained model to 2025 features for a 2026–2028 relative susceptibility outlook.

The risk model is restricted to the mapped circa-2000 forest cohort and excludes post-2000 regrowth. The output is a relative susceptibility score, not a calibrated probability or certainty of future clearing.

## 6. Validation

Report confusion matrix, overall accuracy, producer's accuracy and consumer's accuracy. Random pixel splits may overstate accuracy because neighboring pixels are spatially correlated. A spatial-block holdout is preferable. Inspect the number of samples in both classes and the valid-pixel coverage for every composite.

## 7. Area estimation

Use `ee.Image.pixelArea()` and a consistent scale/projection to estimate hectares. Nominal 30 m pixels represent about 0.09 ha, but calculate from pixel area rather than assuming every pixel is exactly 900 m².
