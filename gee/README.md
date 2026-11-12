# Google Earth Engine implementation

## Main script

`main.js` is the current standalone script. It is designed to be copied into the Google Earth Engine Code Editor.

## Run

1. Open https://code.earthengine.google.com/
2. Draw a polygon and ensure the imported variable is named `geometry`.
3. Copy all of `main.js` into the Code Editor.
4. Click Run.
5. Inspect Console, map layers and Tasks.
6. Run export tasks to Google Drive.

## New region

Redraw the geometry and rerun. The forest classifier samples WorldCover labels in that region and trains a regional classifier.

## Uploaded assets

At the bottom of `main.js`, set one of:
- `uploadedSingleAssetId` for one prepared feature image.
- `uploadedOldAssetId` and `uploadedNewAssetId` for two prepared dates.

The image must contain the 13 feature bands listed in the root README. Raw RGB images are not compatible without preprocessing.

## Modules directory

`modules/` is reserved for a future refactor. The Code Editor does not automatically resolve local repository imports. If modularizing, publish modules as Earth Engine scripts/assets or use a local Earth Engine Python workflow.
