/***********************************************************************
 WESTERN GHATS FOREST MONITORING
 Sentinel-1 + Sentinel-2 + Random Forest
 Google Earth Engine Code Editor (JavaScript)

 FEATURES
 1) Train a forest/non-forest RF model using ESA WorldCover 2021 labels.
 2) Classify 2018, 2021 and 2024 composites.
 3) Detect forest -> non-forest transitions.
 4) Train a deforestation susceptibility RF model using Hansen loss:
      train: 2018 predictors -> loss in 2019-2021
      validate: 2021 predictors -> loss in 2022-2024
 5) Predict susceptibility for 2026-2028 using 2026 predictors.
 6) Export maps to Google Drive.

 IMPORTANT
 - Before running, draw/import a polygon and name it `geometry`.
 - This is a regional, automatically re-trained model: when you change
   geometry, it samples WorldCover labels in that new area and trains again.
 - It is not a pretrained zero-shot model for every ecosystem.
 - Forest definition is tree cover (WorldCover class 10) plus mangroves (95).
 - Hansen loss is stand-replacement tree-cover loss, not every type of
   degradation/selective logging.
 - Risk is susceptibility, not a guaranteed prediction of future clearing.
***********************************************************************/

// ======================== USER SETTINGS ==============================
var roi = geometry;                 // Draw a polygon; imported name: geometry
var exportFolder = 'Western_Ghats_Deforestation';
var exportScale = 30;               // Common working scale for S1/S2 fusion
var samplePerClass = 1500;          // Reduce to 500 if region is small
var randomSeed = 42;
var runExports = true;

// Composite window: same seasonal window for all years.
// Change only if the selected region has too few clear observations.
var startMonth = 1;
var startDay = 1;
var endMonth = 5;
var endDay = 1;

Map.centerObject(roi, 9);
Map.addLayer(roi, {color: 'yellow'}, 'Study area', true);

// ======================== DATASETS ===================================
var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD');
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var worldCover = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');

// Current Hansen release available in Earth Engine: loss years 2001-2025.
// lossyear values 1..25 correspond to 2001..2025.
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var treeCover2000 = hansen.select('treecover2000');
var lossYear = hansen.select('lossyear');
var dataMask = hansen.select('datamask');

var dem = ee.Image('USGS/SRTMGL1_003').select('elevation');
var slope = ee.Terrain.slope(dem).rename('slope');

// ======================== SENTINEL-1 =================================
function getS1(year) {
  var start = ee.Date.fromYMD(year, startMonth, startDay);
  var end = ee.Date.fromYMD(year, endMonth, endDay);

  var col = s1Collection
    .filterBounds(roi)
    .filterDate(start, end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains(
      'transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains(
      'transmitterReceiverPolarisation', 'VH'))
    .select(['VV', 'VH']);

  print('Sentinel-1 scene count ' + year, col.size());

  var med = col.median();
  var diff = med.select('VV').subtract(med.select('VH'))
    .rename('VV_minus_VH');

  return med.addBands(diff).clip(roi);
}

// ======================== SENTINEL-2 =================================
function maskS2(image) {
  var scl = image.select('SCL');
  // Remove saturated/defective, cloud shadow, cloud, cirrus and snow.
  var mask = scl.neq(1)
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));
  return image.updateMask(mask);
}

function getS2(year) {
  var start = ee.Date.fromYMD(year, startMonth, startDay);
  var end = ee.Date.fromYMD(year, endMonth, endDay);

  var col = s2Collection
    .filterBounds(roi)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 85))
    .map(maskS2);

  print('Sentinel-2 scene count ' + year, col.size());

  var med = col.median().multiply(0.0001);
  var ndvi = med.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var nbr = med.normalizedDifference(['B8', 'B12']).rename('NBR');

  return med.select(['B2','B3','B4','B8','B11','B12'])
    .addBands(ndvi)
    .addBands(nbr)
    .clip(roi);
}

// ======================== FUSED FEATURES ==============================
var featureBands = [
  'VV', 'VH', 'VV_minus_VH',
  'B2', 'B3', 'B4', 'B8', 'B11', 'B12',
  'NDVI', 'NBR', 'elevation', 'slope'
];

function getFeatures(year) {
  return getS1(year)
    .addBands(getS2(year))
    .addBands(dem.rename('elevation'))
    .addBands(slope)
    .select(featureBands)
    .clip(roi);
}

var f2018 = getFeatures(2018);
var f2021 = getFeatures(2021);
var f2024 = getFeatures(2024);
var f2026 = getFeatures(2026);

// Display input composites
Map.addLayer(f2026, {
  bands: ['B8','B4','B3'], min: 0.02, max: 0.40
}, 'Sentinel-2 false colour 2026', false);
Map.addLayer(f2026.select('VV'), {
  min: -25, max: 0
}, 'Sentinel-1 VV 2026', false);
Map.addLayer(f2026.select('VH'), {
  min: -32, max: -5
}, 'Sentinel-1 VH 2026', false);

// ======================== FOREST CLASSIFIER ===========================
// WorldCover 2021: 10=tree cover, 95=mangroves.
// Non-forest reference classes used: 20 shrubland, 30 grassland,
// 40 cropland, 50 built-up, 60 bare/sparse vegetation.
// Wetlands/water are excluded to avoid ambiguous labels.
var wc = worldCover.clip(roi);
var forestRef = wc.eq(10).or(wc.eq(95));
var nonForestRef = wc.eq(20)
  .or(wc.eq(30))
  .or(wc.eq(40))
  .or(wc.eq(50))
  .or(wc.eq(60));

var forestLabel = ee.Image(0)
  .where(forestRef, 1)
  .rename('class')
  .updateMask(forestRef.or(nonForestRef));

// Train using 2021 predictors to match WorldCover 2021 reference year.
var forestSamples = f2021.addBands(forestLabel).stratifiedSample({
  numPoints: samplePerClass,
  classBand: 'class',
  region: roi,
  scale: exportScale,
  classValues: [0, 1],
  classPoints: [samplePerClass, samplePerClass],
  seed: randomSeed,
  geometries: true,
  tileScale: 4
});

print('Forest training samples', forestSamples.size());

var forestSplit = forestSamples.randomColumn('rand', randomSeed);
var forestTrain = forestSplit.filter(ee.Filter.lt('rand', 0.7));
var forestTest = forestSplit.filter(ee.Filter.gte('rand', 0.7));

var forestRF = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  minLeafPopulation: 2,
  bagFraction: 0.7,
  seed: randomSeed
}).train({
  features: forestTrain,
  classProperty: 'class',
  inputProperties: featureBands
});

var forestTestPred = forestTest.classify(forestRF);
var forestMatrix = forestTestPred.errorMatrix('class', 'classification');

print('FOREST CLASSIFIER confusion matrix', forestMatrix);
print('FOREST CLASSIFIER overall accuracy', forestMatrix.accuracy());
print('FOREST CLASSIFIER kappa', forestMatrix.kappa());
print('FOREST CLASSIFIER producer accuracy', forestMatrix.producersAccuracy());
print('FOREST CLASSIFIER consumer accuracy', forestMatrix.consumersAccuracy());

// Apply the same 2021-trained classifier to all historical/current dates.
var forest2018 = f2018.classify(forestRF).rename('forest_class');
var forest2021 = f2021.classify(forestRF).rename('forest_class');
var forest2024 = f2024.classify(forestRF).rename('forest_class');
var forest2026 = f2026.classify(forestRF).rename('forest_class');

var forestVis = {min: 0, max: 1, palette: ['#d95f02','#238b45']};
Map.addLayer(forest2018, forestVis, 'Forest / non-forest 2018', false);
Map.addLayer(forest2021, forestVis, 'Forest / non-forest 2021', false);
Map.addLayer(forest2024, forestVis, 'Forest / non-forest 2024', true);
Map.addLayer(forest2026, forestVis, 'Forest / non-forest 2026', false);

// ======================== CHANGE DETECTION ============================
// Pixel class 1 = forest; 0 = non-forest.
// Only forest -> non-forest is counted as loss.
var loss18_21 = forest2018.eq(1).and(forest2021.eq(0)).selfMask()
  .rename('loss_2018_2021');
var loss21_24 = forest2021.eq(1).and(forest2024.eq(0)).selfMask()
  .rename('loss_2021_2024');
var loss24_26 = forest2024.eq(1).and(forest2026.eq(0)).selfMask()
  .rename('loss_2024_2026');

Map.addLayer(loss18_21, {palette:['red']}, 'ML forest loss 2018-2021');
Map.addLayer(loss21_24, {palette:['orange']}, 'ML forest loss 2021-2024');
Map.addLayer(loss24_26, {palette:['magenta']}, 'ML forest loss 2024-2026');

// Hansen historical loss layers for independent reference/comparison.
// Hansen is stand-replacement loss, not all degradation.
var hansenLoss18_21 = lossYear.gte(18).and(lossYear.lte(21))
  .and(treeCover2000.gte(30)).selfMask().clip(roi);
var hansenLoss22_24 = lossYear.gte(22).and(lossYear.lte(24))
  .and(treeCover2000.gte(30)).selfMask().clip(roi);
Map.addLayer(hansenLoss18_21, {palette:['#ffff00']},
  'Hansen reference loss 2018-2021', false);
Map.addLayer(hansenLoss22_24, {palette:['#00ffff']},
  'Hansen reference loss 2022-2024', false);

// ======================== AREA STATISTICS =============================
function areaHa(mask, label) {
  var result = ee.Image.pixelArea().updateMask(mask).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: roi,
    scale: exportScale,
    maxPixels: 1e13,
    tileScale: 4
  });
  var ha = ee.Number(result.get('area')).divide(10000);
  print(label + ' (ha)', ha);
  return ha;
}

areaHa(forest2018.eq(1), 'Classified forest area 2018');
areaHa(forest2021.eq(1), 'Classified forest area 2021');
areaHa(forest2024.eq(1), 'Classified forest area 2024');
areaHa(forest2026.eq(1), 'Classified forest area 2026');
areaHa(loss18_21, 'ML forest loss 2018-2021');
areaHa(loss21_24, 'ML forest loss 2021-2024');
areaHa(loss24_26, 'ML forest loss 2024-2026');

// ======================== FUTURE RISK MODEL ============================
// Use Hansen tree cover >=30% in 2000 as the historical forest cohort.
// lossYear: 18=2018, 19=2019, ... 21=2021, 24=2024, 25=2025.
// Train labels: forest present at start of 2018; loss 2019-2021=1;
// no loss through 2021=0. Use 2018 predictors.
var validLand = dataMask.eq(1);
var baselineForest2018 = treeCover2000.gte(30)
  .and(lossYear.eq(0).or(lossYear.gte(19)))
  .and(validLand);

var targetTrain = ee.Image(0)
  .where(lossYear.gte(19).and(lossYear.lte(21)), 1)
  .rename('risk')
  .updateMask(baselineForest2018);

var riskTrainingImage = f2018.addBands(targetTrain);

var riskSamples = riskTrainingImage.stratifiedSample({
  numPoints: samplePerClass,
  classBand: 'risk',
  region: roi,
  scale: exportScale,
  classValues: [0,1],
  classPoints: [samplePerClass,samplePerClass],
  seed: randomSeed + 10,
  geometries: true,
  tileScale: 4
});

print('Risk training samples', riskSamples.size());

var riskSplit = riskSamples.randomColumn('rand', randomSeed + 10);
var riskTrain = riskSplit.filter(ee.Filter.lt('rand', 0.8));
var riskInternalTest = riskSplit.filter(ee.Filter.gte('rand', 0.8));

var riskRF = ee.Classifier.smileRandomForest({
  numberOfTrees: 250,
  minLeafPopulation: 2,
  bagFraction: 0.7,
  seed: randomSeed + 10
}).train({
  features: riskTrain,
  classProperty: 'risk',
  inputProperties: featureBands
});

var internalPred = riskInternalTest.classify(riskRF);
var internalMatrix = internalPred.errorMatrix('risk','classification');
print('RISK internal confusion matrix', internalMatrix);
print('RISK internal accuracy', internalMatrix.accuracy());
print('RISK internal producer accuracy', internalMatrix.producersAccuracy());
print('RISK internal consumer accuracy', internalMatrix.consumersAccuracy());

// Temporal holdout: forest at start of 2021; loss during 2022-2024.
// Evaluate model trained on 2018 samples using 2021 features.
var baselineForest2021 = treeCover2000.gte(30)
  .and(lossYear.eq(0).or(lossYear.gte(22)))
  .and(validLand);

var targetValidation = ee.Image(0)
  .where(lossYear.gte(22).and(lossYear.lte(24)), 1)
  .rename('risk')
  .updateMask(baselineForest2021);

var validationSamples = f2021.addBands(targetValidation)
  .stratifiedSample({
    numPoints: samplePerClass,
    classBand: 'risk',
    region: roi,
    scale: exportScale,
    classValues: [0,1],
    classPoints: [samplePerClass,samplePerClass],
    seed: randomSeed + 20,
    geometries: true,
    tileScale: 4
  });

var temporalPred = validationSamples.classify(riskRF);
var temporalMatrix = temporalPred.errorMatrix('risk','classification');
print('TEMPORAL validation confusion matrix (2022-2024)', temporalMatrix);
print('TEMPORAL validation accuracy', temporalMatrix.accuracy());
print('TEMPORAL validation producer accuracy', temporalMatrix.producersAccuracy());
print('TEMPORAL validation consumer accuracy', temporalMatrix.consumersAccuracy());

// Refit on the full 2018 training sample after evaluation.
var finalRiskRF = ee.Classifier.smileRandomForest({
  numberOfTrees: 250,
  minLeafPopulation: 2,
  bagFraction: 0.7,
  seed: randomSeed + 10
}).train({
  features: riskSamples,
  classProperty: 'risk',
  inputProperties: featureBands
});

// Predict susceptibility for 2026-2028 using 2026 sensor features.
// Limit to the 2000 forest cohort with no Hansen loss through 2025.
// This deliberately excludes post-2000 regrowth from the risk denominator.
var forestRemainingAt2026 = treeCover2000.gte(30)
  .and(lossYear.eq(0))
  .and(validLand);

var riskProbabilityClassifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 250,
  minLeafPopulation: 2,
  bagFraction: 0.7,
  seed: randomSeed + 10
}).setOutputMode('MULTIPROBABILITY').train({
  features: riskSamples,
  classProperty: 'risk',
  inputProperties: featureBands
});

var riskProb = f2026.classify(riskProbabilityClassifier)
  .arrayGet([1])
  .rename('risk_probability')
  .updateMask(forestRemainingAt2026);

var riskClass = ee.Image(0)
  .where(riskProb.gte(0.25), 1)
  .where(riskProb.gte(0.50), 2)
  .where(riskProb.gte(0.75), 3)
  .rename('risk_class')
  .updateMask(forestRemainingAt2026);

Map.addLayer(riskProb, {
  min: 0, max: 1,
  palette: ['#1a9850','#fee08b','#f46d43','#a50026']
}, 'Predicted deforestation susceptibility 2026-2028', true);

Map.addLayer(riskClass, {
  min: 0, max: 3,
  palette: ['#1a9850','#fee08b','#f46d43','#a50026']
}, 'Risk classes: low to very high', false);

areaHa(riskClass.eq(3), 'Very-high susceptibility forest area');

// ======================== EXPORTS ====================================
function exportImage(image, description, scale) {
  Export.image.toDrive({
    image: image,
    description: description,
    folder: exportFolder,
    region: roi,
    scale: scale || exportScale,
    maxPixels: 1e13,
    fileFormat: 'GeoTIFF'
  });
}

if (runExports) {
  exportImage(forest2018, 'Forest_classification_2018');
  exportImage(forest2021, 'Forest_classification_2021');
  exportImage(forest2024, 'Forest_classification_2024');
  exportImage(forest2026, 'Forest_classification_2026');
  exportImage(loss18_21.unmask(0), 'ML_forest_loss_2018_2021');
  exportImage(loss21_24.unmask(0), 'ML_forest_loss_2021_2024');
  exportImage(loss24_26.unmask(0), 'ML_forest_loss_2024_2026');
  exportImage(riskProb, 'Deforestation_susceptibility_2026_2028');
  exportImage(riskClass, 'Deforestation_risk_classes_2026_2028');
}



// ======================== OPTIONAL USER-UPLOADED FEATURE ASSETS =======
// Upload preprocessed multiband GeoTIFFs to Earth Engine Assets.
// Required bands and units must match `featureBands` exactly.
// Leave IDs empty to use the automatic polygon/Sentinel workflow.
//
// For a single new-date feature image, set uploadedNewAssetId.
// For historical change, provide BOTH old and new feature-image assets.
// This is not for raw RGB images: inputs must already contain all
// Sentinel-1/Sentinel-2/terrain features listed in featureBands.

var uploadedOldAssetId = '';
var uploadedNewAssetId = '';
var uploadedSingleAssetId = '';

if (uploadedSingleAssetId !== '') {
  var uploadedSingle = ee.Image(uploadedSingleAssetId)
    .select(featureBands)
    .clip(roi);

  var uploadedForest = uploadedSingle.classify(forestRF)
    .rename('forest_class');

  var uploadedRisk = uploadedSingle
    .classify(riskProbabilityClassifier)
    .arrayGet([1])
    .rename('risk_probability');

  Map.addLayer(uploadedForest, forestVis,
    'Uploaded image: forest classification');
  Map.addLayer(uploadedRisk, {
    min: 0, max: 1,
    palette: ['#1a9850','#fee08b','#f46d43','#a50026']
  }, 'Uploaded image: risk susceptibility');
}

if (uploadedOldAssetId !== '' && uploadedNewAssetId !== '') {
  var uploadedOld = ee.Image(uploadedOldAssetId)
    .select(featureBands)
    .clip(roi);
  var uploadedNew = ee.Image(uploadedNewAssetId)
    .select(featureBands)
    .clip(roi);

  var uploadedOldForest = uploadedOld.classify(forestRF);
  var uploadedNewForest = uploadedNew.classify(forestRF);

  var uploadedLoss = uploadedOldForest.eq(1)
    .and(uploadedNewForest.eq(0))
    .selfMask();

  Map.addLayer(uploadedOldForest, forestVis,
    'Uploaded older image classification', false);
  Map.addLayer(uploadedNewForest, forestVis,
    'Uploaded newer image classification', false);
  Map.addLayer(uploadedLoss, {palette:['red']},
    'Uploaded-image deforestation change');
}

print('SCRIPT INITIALIZED. Inspect Console, map layers and Tasks.');
print('If a collection has zero scenes, adjust the date window or AOI.');
