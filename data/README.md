# Data directory

This repository intentionally does not include raw satellite imagery or large generated rasters.

- `raw/`: optional local source files supplied by the user.
- `processed/`: optional preprocessed GeoTIFFs or intermediate files.
- `outputs/`: generated maps and statistics.
- Earth Engine source collections are queried directly by `gee/main.js`.

Do not commit large imagery, credentials, private Earth Engine asset IDs, or sensitive location data. Keep dataset IDs, acquisition dates, processing parameters and licenses documented.
