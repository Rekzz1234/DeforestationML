# Google Earth Engine implementation

`main.js` is a standalone Landsat 1990–2025 script.

## Run

1. Open https://code.earthengine.google.com/.
2. Draw a polygon and ensure the imported variable is named `geometry`.
3. Copy all of `main.js` into the Code Editor.
4. Click Run.
5. Check the Console for per-year scene counts, training sample counts, confusion matrices and area statistics.
6. Inspect each historical map and transition layer for cloud gaps or missing pixels.
7. Run the Drive exports in the Tasks panel.

## Important

- Main comparison years: 1990, 2000, 2010, 2020 and 2025.
- Support years: 2015 (risk validation) and 2021 (WorldCover training).
- All composites use Jan–Apr.
- The classifier is trained from WorldCover 2021 labels and applied retrospectively.
- Hansen loss begins in 2001; it cannot validate 1990–2000.
- Reduce `samplePerClass` to 500 if the AOI is small or sampling fails.
- If a collection has no scenes, inspect the AOI, year, season and collection availability before changing the model.
