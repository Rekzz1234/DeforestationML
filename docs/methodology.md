# Methodology

## 1. Study area

The initial study area is a user-drawn polygon in the Tamil Nadu section of the Western Ghats. Record its coordinates, area, and rationale in the final report.

## 2. Satellite observations

Use same-season January–April composites for 2018, 2021, 2024 and 2026.

### Sentinel-1
- Dataset: `COPERNICUS/S1_GRD`
- Instrument mode: IW
- Polarizations: VV and VH
- Composite: median
- Derived feature: VV minus VH in dB

### Sentinel-2
- Dataset: `COPERNICUS/S2_SR_HARMONIZED`
- Cloud/shadow masking using SCL
- Bands: B2, B3, B4, B8, B11, B12
- Derived features: NDVI and NBR

### Terrain
- SRTM elevation
- Derived slope

## 3. Forest classification

ESA WorldCover 2021 is used as a reference label source. The current implementation treats tree cover (class 10) and mangroves (class 95) as forest. Selected shrubland, grassland, cropland, built-up and bare/sparse vegetation classes are sampled as non-forest. Other classes are excluded.

A Random Forest classifier is trained on the 2021 feature stack. The same classifier is applied to the other year composites. This supports a consistent map comparison, but seasonal and sensor differences can still affect classification.

## 4. Historical change detection

For each pair of dates, define loss as:

`forest at earlier date AND non-forest at later date`

Calculate area using pixel area and report hectares. Do not call this definitive deforestation without reference validation; it is an ML-derived forest-to-non-forest transition.

## 5. Susceptibility model

The risk model uses Hansen Global Forest Change loss-year labels to create historical positive and negative examples. It trains on 2018 features and 2019–2021 outcomes, then evaluates on 2021 features and 2022–2024 outcomes.

The final risk map applies the trained model to 2026 features. The output is a relative susceptibility score. It is not a calibrated probability of future clearing unless calibration is separately performed.

## 6. Validation

Report confusion matrix, overall accuracy, producer's accuracy, user's/consumer's accuracy, precision, recall and F1 where appropriate. Add spatially independent validation if possible.

## 7. Area estimation

At a 30 m grid, nominal pixel area is 900 m², or 0.09 ha. For robust area calculation, use `ee.Image.pixelArea()` and a consistent projection/scale rather than simply multiplying a count when pixels may vary in area.
