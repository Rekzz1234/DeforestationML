# Contributing

## Before changing the workflow

- Keep the main Earth Engine script runnable as a standalone Code Editor script.
- Do not commit raw satellite imagery, exported rasters, credentials, or private asset IDs.
- Document dataset IDs, date windows, scales, masks, and model parameters.
- Do not report invented model metrics. Include only values produced by an actual run.
- Preserve separate reporting for ML-detected change and external reference loss.

## Suggested workflow

1. Create a branch for a focused change.
2. Update documentation when inputs, outputs, or assumptions change.
3. Run the script in Earth Engine on a small AOI first.
4. Record scene counts, valid sample counts, and errors.
5. Add screenshots or exported sample maps only when they are real outputs.
