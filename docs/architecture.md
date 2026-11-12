# System architecture

## End-to-end flow

```text
User polygon / prepared Earth Engine imagery
                  |
                  v
       Sentinel-1 and Sentinel-2
                  |
                  v
        Seasonal composites
                  |
                  v
       Feature stack construction
   VV, VH, ratio, optical bands, NDVI,
       NBR, elevation, slope
                  |
          +-------+--------+
          |                |
          v                v
 Forest/non-forest RF   Historical loss labels
          |                |
          v                v
 Multi-date maps       Susceptibility RF
          |                |
          v                v
 Change detection     Temporal validation
          |                |
          +-------+--------+
                  |
                  v
   GeoTIFFs, area statistics, risk map
```

## Model separation

**Forest classification** answers: which pixels resemble the selected forest reference class?

**Change detection** answers: which pixels changed from forest to non-forest between two classified dates?

**Risk prediction** answers: which eligible currently forested pixels have feature patterns associated with historical loss?

These are different tasks and their metrics must not be mixed.

## Generalization

The initial script retrains using reference samples within the selected area. This is convenient for a fast demonstration but is not proof of cross-region transfer. To demonstrate generalization, train on multiple regions and hold out an entire region for testing.
