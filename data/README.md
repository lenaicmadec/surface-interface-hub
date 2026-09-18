# Shared XPS data

This directory contains the curated data loaded by the Interactive XPS Database and XPS Spectrum Identification.

## Deployed files

### `element-lines-master.csv`

Reference elemental XPS and Auger lines used by Search by Element and survey-spectrum identification.

### `compounds-core-levels-final.csv`

Consolidated literature values used by Search by Core Level, Search by Chemical Species and core-level spectrum identification.

Columns:

1. `Compound`
2. `Compound name`
3. `Compound aliases`
4. `Chemical class`
5. `Core level`
6. `Binding energy (eV)`
7. `Uncertainty (eV)`
8. `Peak assignment`
9. `Reference`
10. `DOI`
11. `Calibration`

When several compatible measurements are consolidated, `Reference`, `DOI` and `Calibration` contain semicolon-separated values in the same order. Empty calibration positions must be preserved so that each entry remains associated with the correct reference.

Published binding energies are not renormalized. `Calibration` records the energy reference stated by the corresponding source when it is available.

### `chemical-classes-final.csv`

Controlled chemical-class names, aliases and associated elements used by Search by Chemical Species.

### `element-lines-master.js`

Browser-ready element-line data retained for the element search implementation.

## Bibliography

The human-readable bibliography is stored at:

```text
database/Database-literature-references.pdf
```

## Update workflow

The public compound CSV is generated from curated individual measurements maintained outside the deployed site. Compatible entries may be consolidated, but reference, DOI and calibration provenance must remain recoverable.

After replacing a data file, test the site through HTTP, for example with Visual Studio Code Live Server. Direct `file://` access cannot reliably load these files.

