# Two-day execution plan

## Day 1 — Historical pipeline

| Time | Task | Deliverable |
|---|---|---|
| 0:00–1:00 | Earth Engine setup and AOI polygon | Study area |
| 1:00–2:30 | Run Landsat composites (1990, 2000, 2010, 2015, 2020, 2021, 2025) | Scene counts and valid composites |
| 2:30–4:30 | Train 2021 WorldCover forest RF | Accuracy summary and forest maps |
| 4:30–6:00 | Compare 1990–2000–2010–2020–2025 | Change maps and hectares |
| 6:00–8:00 | Hansen susceptibility training and temporal validation | Risk map and validation metrics |

## Day 2 — Validate and submit

| Time | Task | Deliverable |
|---|---|---|
| 0:00–1:30 | Inspect cloud gaps, sensor differences and class balance | QA notes |
| 1:30–3:00 | Export GeoTIFFs and area statistics | Output files |
| 3:00–5:00 | Write methods, results and limitations | Final report |
| 5:00–6:30 | Prepare figures and slides | Presentation |
| 6:30–8:00 | Rehearse and verify reproducibility | Final submission |

## Priority order

1. Get valid Landsat composites and the forest classification working.
2. Produce the four historical transition maps.
3. Run the risk model only after confirming both training classes contain enough samples.
4. Export outputs and document limitations.

If time is short, prioritize the historical maps and do not report risk metrics until temporal validation has actually run.
