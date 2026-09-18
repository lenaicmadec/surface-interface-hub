# Surface & Interface Hub

Surface & Interface Hub is a static scientific website bringing together learning resources, a curated XPS reference database and browser-based tools for surface and interface analysis.

The project focuses mainly on X-ray photoelectron spectroscopy (XPS), solid electrolyte interphases (SEI), battery materials and related surface-analysis workflows.

## Contents

### Resources

- Battery courses and seminars
- SEI and surface-analysis teaching material
- External XPS learning and reference resources

### Interactive XPS Database

- **Search by Element** displays reference XPS and Auger lines.
- **Search by Core Level** compares reported binding energies by chemical state and displays the reference spin–orbit separation when available.
- **Search by Chemical Species** searches compounds, aliases and chemical classes, with reported peak assignments, uncertainties, references and DOI links. Source-specific calibration details are available from the chevron in each Reference cell.

The database currently contains 178 compounds and 60 literature references. The complete bibliography is provided as `database/Database-literature-references.pdf`.

### XPS Tools

- **XPS VAMAS Dataset Builder** organizes iterative acquisitions, validates compatible sums and exports clean VAMAS datasets.
- **XPS Spectrum Identification** explores survey and core-level spectra using elemental lines and curated compound references.
- **XPS Figure Builder** creates multi-panel figures from CSV data and exports PNG or SVG images.

The public tool-suite label is **XPS Tools · v0.4**.

## Running the site locally

The site loads CSV, JSON and demonstration files through HTTP requests. Do not open `index.html` directly with a `file://` address.

The simplest option on Windows is Visual Studio Code with the **Live Server** extension:

1. Open the extracted project folder in Visual Studio Code.
2. Right-click `index.html`.
3. Choose **Open with Live Server**.

Alternatively, start a basic local server from the project root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Project structure

```text
assets/       Shared navigation, themes, parsers, styles and images
data/         Curated CSV data used by the Database and Spectrum Identification
database/     Database landing page and the three interactive searches
resources/    Batteries, SEI, surface-analysis and XPS resources
tools/        Tool landing pages and browser applications
about/        Project information and contact details
```

Each tool is organized as a presentation page followed by its application in an `app/` directory.

## Reference data

The deployed database uses:

- `data/element-lines-master.csv`
- `data/compounds-core-levels-final.csv`
- `data/chemical-classes-final.csv`
- `database/Database-literature-references.pdf`

Compatible values reported for the same compound, core level and peak assignment are consolidated into a representative binding energy and uncertainty. Reference numbers, DOI values and calibration entries remain positionally aligned when several sources contribute to one consolidated value.

Published binding energies are preserved on the energy scale reported by each source and are not renormalized to a single calibration. Only reported core levels are listed; the absence of a core level does not imply its absence from a spectrum.

In Search by Chemical Species, DOI links remain visible in the main table while calibration information is disclosed on demand. In Search by Core Level, calibration is retained in copied reference data but is not added to the graph.

More information about the deployed CSV files is available in [`data/README.md`](data/README.md).

## Local processing and privacy

The included scientific tools are designed to process imported files locally in the browser. The project contains no service for uploading imported VAMAS, CSV or project data to a remote server.

The Batteries resource page contains embedded YouTube players, so opening that page may establish a connection to YouTube. Following an external DOI or resource link likewise leaves the Hub and is then subject to the destination website's own policies. Imported scientific files are not passed to these external services.

## Scientific scope and limitations

The database and tools support scientific interpretation but do not provide an automated or definitive analysis. Results depend on sample chemistry, spectrum quality, charge correction, energy referencing, instrumental conditions and the available literature.

Users should critically assess all proposed assignments and exported results. The database may remain incomplete and may contain errors despite curation and validation.

## Browser testing

- Firefox: complete site and tool testing
- Chrome: complete site and tool testing
- Safari 14.5: navigation and principal tool interactions

The site should be served through HTTP during local testing because browser restrictions on `file://` prevent some external project and data files from loading.

## Maintenance

The site uses plain HTML, CSS and JavaScript and can be deployed on any static web host. Shared navigation is generated by `assets/xps-nav.js`; common visual rules are kept under `assets/`, while each interactive module retains its specific styles and scripts.

When updating the compound database, regenerate the consolidated CSV rather than editing displayed values independently. Verify the site through a local server after replacing data files.

## Contact

**Lénaïc Madec**  
CNRS researcher, Institut des Matériaux Jean Rouxel (IMN), Nantes  
[lenaic.madec@cnrs.fr](mailto:lenaic.madec@cnrs.fr)
