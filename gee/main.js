/***********************************************************************
 WESTERN GHATS DEFORESTATION MONITORING — LANDSAT 1990–2025
 Google Earth Engine Code Editor (JavaScript)

 HISTORICAL CLASSIFICATION YEARS: 1990, 2000, 2010, 2020, 2025
 SUPPORT YEARS: 2015 (risk validation), 2021 (WorldCover training)

 Landsat Collection 2 Level-2 SR, 30 m. Common spectral band names are
 created across Landsat 5/7 and Landsat 8/9. All years use the same
 January–April seasonal window.

 IMPORTANT SCIENTIFIC NOTES
 - WorldCover 2021 trains the regional forest classifier; that classifier
   is applied retrospectively to earlier Landsat composites. This is not
   equivalent to independently validated historical ground truth.
 - Cross-sensor differences remain despite common band names and SR
   scaling. Inspect maps and use caution interpreting small differences.
 - Hansen GFC loss starts in 2001; it cannot validate 1990–2000 loss.
 - Hansen loss is stand-replacement tree-cover loss, not all degradation.
 - Risk scores are relative susceptibility, not calibrated probabilities.
 - Draw/import a polygon named `geometry` before running.
***********************************************************************/

// ======================== USER SETTINGS ==============================
var roi = geometry;
var exportFolder = 'Western_Ghats_Deforestation_Landsat1990_2025';
var exportScale = 30;
var samplePerClass = 1500; // reduce to 500 for a small AOI
var randomSeed = 42;
var runExports = true;

var startMonth = 1;
var startDay = 1;
var endMonth = 5;
var endDay = 1; // exclusive: Jan 1 through Apr 30

var historicalYears = [1990, 2000, 2010, 2020, 2025];
var supportYears = [2015, 2021];
var allYears = [1990, 2000, 2010, 2015, 2020, 2021, 2025];

Map.centerObject(roi, 9);
Map.addLayer(roi, {color: 'yellow'}, 'Study area', true);

// ======================== DATASETS ===================================
var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
var l7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');
var worldCover = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var treeCover2000 = hansen.select('treecover2000');
var lossYear = hansen.select('lossyear');
var dataMask = hansen.select('datamask');
var dem = ee.Image('USGS/SRTMGL1_003').select('elevation');
var slope = ee.Terrain.slope(dem).rename('slope');

// ======================== LANDSAT PREPROCESSING ======================
// QA_PIXEL bits: fill=0, dilated cloud=1, cirrus=2, cloud=3,
// cloud shadow=4, snow=5. QA_RADSAT removes saturated pixels.
function maskAndScale(image, sourceBands, commonNames) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 0).eq(0)
    .and(qa.bitwiseAnd(1 << 1).eq(0))
    .and(qa.bitwiseAnd(1 << 2).eq(0))
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0))
    .and(image.select('QA_RADSAT').eq(0));

  var sr = image.select(sourceBands, commonNames)
    .multiply(0.0000275).add(-0.2);
  var ndvi = sr.normalizedDifference(['nir', 'red']).rename('NDVI');
  var nbr = sr.normalizedDifference(['nir', 'swir2']).rename('NBR');
  return sr.addBands(ndvi).addBands(nbr)
    .updateMask(mask)
    .copyProperties(image, ['system:time_start']);
}

var l57Bands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'];
var commonBands = ['blue','green','red','nir','swir1','swir2'];
var l89Bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

var l57Prepared = l5.merge(l7).map(function(img) {
  return maskAndScale(img, l57Bands, commonBands);
});
var l89Prepared = l8.merge(l9).map(function(img) {
  return maskAndScale(img, l89Bands, commonBands);
});

var featureBands = [
  'blue','green','red','nir','swir1','swir2','NDVI','NBR',
  'elevation','slope'
];

function getLandsatFeatures(year) {
  var start = ee.Date.fromYMD(year, startMonth, startDay);
  var end = ee.Date.fromYMD(year, endMonth, endDay);
  // Landsat 5/7 before 2013; Landsat 8/9 from 2013 onward.
  var collection = ee.ImageCollection(ee.Algorithms.If(
    ee.Number(year).lt(2013), l57Prepared, l89Prepared));
  var filtered = collection.filterBounds(roi).filterDate(start, end);
  print('Landsat scenes ' + year, filtered.size());
  var composite = filtered.median();
  return composite.addBands(dem.rename('elevation'))
    .addBands(slope)
    .select(featureBands)
    .clip(roi);
}

var features = {};
allYears.forEach(function(year) {
  features[year] = getLandsatFeatures(year);
});

// Display latest and baseline composites.
Map.addLayer(features[1990], {
  bands: ['nir','red','green'], min: 0.02, max: 0.45
}, 'Landsat false colour 1990', false);
Map.addLayer(features[2025], {
  bands: ['nir','red','green'], min: 0.02, max: 0.45
}, 'Landsat false colour 2025', false);

// ======================== FOREST CLASSIFIER ===========================
// ESA WorldCover 2021: 10=tree cover, 95=mangroves.
// Selected non-forest classes: 20 shrubland, 30 grassland, 40 cropland,
// 50 built-up, 60 bare/sparse vegetation. Other classes are excluded.
var wc = worldCover.clip(roi);
var forestRef = wc.eq(10).or(wc.eq(95));
var nonForestRef = wc.eq(20).or(wc.eq(30)).or(wc.eq(40))
  .or(wc.eq(50)).or(wc.eq(60));
var forestLabel = ee.Image(0).where(forestRef, 1)
  .rename('class').updateMask(forestRef.or(nonForestRef));

// Train using Landsat 2021 features to align with WorldCover 2021 labels.
var forestSamples = features[2021].addBands(forestLabel).stratifiedSample({
  numPoints: samplePerClass,
  classBand: 'class',
  region: roi,
  scale: exportScale,
  classValues: [0,1],
  classPoints: [samplePerClass,samplePerClass],
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
var forestMatrix = forestTestPred.errorMatrix('class','classification');
print('FOREST confusion matrix', forestMatrix);
print('FOREST overall accuracy', forestMatrix.accuracy());
print('FOREST kappa', forestMatrix.kappa());
print('FOREST producer accuracy', forestMatrix.producersAccuracy());
print('FOREST consumer accuracy', forestMatrix.consumersAccuracy());

var forestMaps = {};
var forestVis = {min: 0, max: 1, palette: ['#d95f02','#238b45']};
historicalYears.forEach(function(year) {
  forestMaps[year] = features[year].classify(forestRF).rename('forest_class');
  Map.addLayer(forestMaps[year], forestVis,
    'Forest / non-forest ' + year, year === 2025);
});

// ======================== CHANGE DETECTION ============================
function transitionLoss(oldYear, newYear) {
  return forestMaps[oldYear].eq(1)
    .and(forestMaps[newYear].eq(0))
    .selfMask()
    .rename('loss_' + oldYear + '_' + newYear);
}
var intervals = [[1990,2000],[2000,2010],[2010,2020],[2020,2025]];
var lossMaps = {};
intervals.forEach(function(pair) {
  var key = pair[0] + '_' + pair[1];
  lossMaps[key] = transitionLoss(pair[0], pair[1]);
  Map.addLayer(lossMaps[key], {palette:['red']},
    'ML forest-to-nonforest transition ' + key, true);
});

// Hansen comparison is available only from 2001 onward.
// lossyear 1=2001, 10=2010, 20=2020, 25=2025.
var hansenLoss2001_2010 = lossYear.gte(1).and(lossYear.lte(10))
  .and(treeCover2000.gte(30)).selfMask().clip(roi);
var hansenLoss2011_2020 = lossYear.gte(11).and(lossYear.lte(20))
  .and(treeCover2000.gte(30)).selfMask().clip(roi);
var hansenLoss2021_2025 = lossYear.gte(21).and(lossYear.lte(25))
  .and(treeCover2000.gte(30)).selfMask().clip(roi);
Map.addLayer(hansenLoss2001_2010, {palette:['#ffff00']},
  'Hansen reference loss 2001-2010', false);
Map.addLayer(hansenLoss2011_2020, {palette:['#00ffff']},
  'Hansen reference loss 2011-2020', false);
Map.addLayer(hansenLoss2021_2025, {palette:['#ff00ff']},
  'Hansen reference loss 2021-2025', false);

// ======================== AREA STATISTICS =============================
function areaHa(mask, label) {
  var result = ee.Image.pixelArea().rename('area').updateMask(mask)
    .reduceRegion({
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
historicalYears.forEach(function(year) {
  areaHa(forestMaps[year].eq(1), 'Classified forest area ' + year);
});
intervals.forEach(function(pair) {
  var key = pair[0] + '_' + pair[1];
  areaHa(lossMaps[key], 'ML forest loss ' + key);
});

// ======================== SUSCEPTIBILITY MODEL ========================
// Hansen is only available from 2001. Train on the 2000 forest cohort
// still present at start-2011; predict loss in 2011-2013 using 2010
// Landsat features. Temporal validation: start-2016 forest cohort and
// loss during 2016-2018 using 2015 features. Predict remaining mapped
// 2000 forest cohort with 2025 features for the 2026-2028 outlook.
var validLand = dataMask.eq(1);
var baselineForest2010 = treeCover2000.gte(30)
  .and(lossYear.eq(0).or(lossYear.gte(11)))
  .and(validLand);
var targetTrain = ee.Image(0)
  .where(lossYear.gte(11).and(lossYear.lte(13)), 1)
  .rename('risk').updateMask(baselineForest2010);
var riskSamples = features[2010].addBands(targetTrain).stratifiedSample({
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
print('Risk training samples (2011-2013 target)', riskSamples.size());
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

// Temporal validation: forest at start-2016, subsequent loss 2016-2018.
var baselineForest2015 = treeCover2000.gte(30)
  .and(lossYear.eq(0).or(lossYear.gte(16)))
  .and(validLand);
var targetValidation = ee.Image(0)
  .where(lossYear.gte(16).and(lossYear.lte(18)), 1)
  .rename('risk').updateMask(baselineForest2015);
var validationSamples = features[2015].addBands(targetValidation)
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
print('TEMPORAL validation confusion matrix (2016-2018)', temporalMatrix);
print('TEMPORAL validation accuracy', temporalMatrix.accuracy());
print('TEMPORAL validation producer accuracy', temporalMatrix.producersAccuracy());
print('TEMPORAL validation consumer accuracy', temporalMatrix.consumersAccuracy());

// Probability output for relative susceptibility. Class order assumes
// labels 0 and 1 are both present; inspect sample counts / errors.
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
var forestRemaining2025 = treeCover2000.gte(30)
  .and(lossYear.eq(0)).and(validLand);
var riskScore = features[2025].classify(riskProbabilityClassifier)
  .arrayGet([1]).rename('relative_susceptibility')
  .updateMask(forestRemaining2025);
var riskClass = ee.Image(0)
  .where(riskScore.gte(0.25), 1)
  .where(riskScore.gte(0.50), 2)
  .where(riskScore.gte(0.75), 3)
  .rename('risk_class').updateMask(forestRemaining2025);
Map.addLayer(riskScore, {
  min: 0, max: 1,
  palette: ['#1a9850','#fee08b','#f46d43','#a50026']
}, 'Relative deforestation susceptibility 2026-2028', true);
Map.addLayer(riskClass, {
  min: 0, max: 3,
  palette: ['#1a9850','#fee08b','#f46d43','#a50026']
}, 'Risk classes: low to very high', false);
areaHa(riskClass.eq(3), 'Very-high susceptibility forest area');

// ======================== EXPORTS ====================================
function exportImage(image, description) {
  Export.image.toDrive({
    image: image,
    description: description,
    folder: exportFolder,
    region: roi,
    scale: exportScale,
    maxPixels: 1e13,
    fileFormat: 'GeoTIFF'
  });
}
if (runExports) {
  historicalYears.forEach(function(year) {
    exportImage(forestMaps[year], 'Forest_classification_' + year);
  });
  intervals.forEach(function(pair) {
    var key = pair[0] + '_' + pair[1];
    exportImage(lossMaps[key].unmask(0), 'ML_forest_transition_' + key);
  });
  exportImage(riskScore, 'Relative_deforestation_susceptibility_2026_2028');
  exportImage(riskClass, 'Deforestation_risk_classes_2026_2028');
}

print('SCRIPT INITIALIZED. Inspect scene counts, sample counts, Console, map and Tasks.');
print('If a year has zero scenes or missing pixels, check AOI/date window and cloud coverage.');
