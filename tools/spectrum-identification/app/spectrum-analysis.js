const spectrumAnalysisScriptUrl = document.currentScript
  ? new URL(document.currentScript.src, document.baseURI)
  : new URL("./spectrum-analysis.js", document.baseURI);
const root = document.getElementById("spectrum-analysis");
if (root) {

  const fileInput = root.querySelector(".xv-file-input");
  const statusBox = root.querySelector(".xv-status");
  const workspace = root.querySelector(".xv-workspace");
  const navigation = root.querySelector(".xv-navigation");
  const sampleSelect = root.querySelector(".xv-sample-select");
  const samplePicker = root.querySelector(".xv-sample-picker");
  const samplePickerButton = root.querySelector(".xv-sample-picker-button");
  const samplePickerLabel = root.querySelector(".xv-sample-picker-label");
  const sampleMenu = root.querySelector(".xv-sample-menu");
  const samplePrevButton = root.querySelector(".xv-sample-prev");
  const sampleNextButton = root.querySelector(".xv-sample-next");
  const regionPrevButton = root.querySelector(".xv-region-prev");
  const regionNextButton = root.querySelector(".xv-region-next");
  const analysisModeBar = root.querySelector(".xv-analysis-mode-bar");
  const analysisModeButtons = Array.from(root.querySelectorAll(".xv-analysis-mode-button"));
  const fileMeta = root.querySelector(".xv-file-meta");
  const fileMetaRow = root.querySelector(".xv-file-meta-row");
  const fileMetaName = root.querySelector(".xv-file-meta-name");
  const fileMetaInfo = root.querySelector(".xv-file-meta-info");
  const fileSubtitle = root.querySelector(".xv-subtitle");
  const blockList = root.querySelector(".xv-block-list");
  const blockTitle = root.querySelector(".xv-graph-block-title");
  const graphSampleTitle = root.querySelector(".xv-graph-sample-title");
  const graphCalibrationBadge = root.querySelector(".xv-graph-calibration-badge");
  const blockMeta = root.querySelector(".xv-graph-block-meta");
  const sourceReadout = root.querySelector(".xv-source-readout");
  const surveyTools = root.querySelector(".xv-survey-tools");
  const corePlaceholder = root.querySelector(".xv-core-placeholder");
  const surveyCommandCard = root.querySelector(".xv-survey-command-card");
  const periodicTable = root.querySelector(".xv-periodic-table");
  const lanthanidesRow = root.querySelector(".xv-lanthanides");
  const actinidesRow = root.querySelector(".xv-actinides");
  const lineFilterButtons = Array.from(root.querySelectorAll(".xv-line-filter [data-line-filter]"));
  const clearElementsButton = root.querySelector(".xv-clear-elements");
  const chart = root.querySelector(".xv-chart");
  const legend = root.querySelector(".xv-legend");
  const lineInfo = root.querySelector(".xv-line-info");
  const energyAxisToggle = root.querySelector(".xv-energy-axis-toggle");
  const countsToggle = root.querySelector(".xv-counts-toggle");
  const resetViewButton = root.querySelector(".xv-reset-view");
  const modeButtons = Array.from(root.querySelectorAll(".xv-mode-button[data-mode]"));
  const autoSummary = root.querySelector(".xv-auto-summary");
  const graphLineFilter = root.querySelector(".xv-graph-line-filter");
  const calibrationStrip = root.querySelector(".xv-calibration-strip");
  const calibrationStatus = root.querySelector(".xv-calibration-status");
  const calibrationObserved = root.querySelector(".xv-cal-observed");
  const calibrationReference = root.querySelector(".xv-cal-reference");
  const calibrationScope = root.querySelector(".xv-cal-scope");
  const calibrationPickButton = root.querySelector(".xv-cal-pick");
  const setCalibrationButton = root.querySelector(".xv-set-calibration");
  const resetCalibrationButton = root.querySelector(".xv-reset-calibration");
  const graphCalibrationButton = root.querySelector(".xv-graph-calibration");
  const exportImageButton = root.querySelector(".xv-export-image");
  const coreClassFilter = root.querySelector(".xv-core-class-filter");
  const coreClassToggle = root.querySelector(".xv-core-class-toggle");
  const coreClassMenu = root.querySelector(".xv-core-class-menu");
  const coreClassSearch = root.querySelector(".xv-core-class-search");
  const coreClassOptions = root.querySelector(".xv-core-class-options");
  const coreClassClear = root.querySelector(".xv-core-class-clear");
  const coreSearchInput = root.querySelector(".xv-core-search");
  const pinnedList = root.querySelector(".xv-pinned-list");
  const databaseSummary = root.querySelector(".xv-database-summary");
  const databaseHint = root.querySelector(".xv-database-hint");
  const databaseContext = root.querySelector(".xv-database-context");
  const databaseClickHint = root.querySelector(".xv-database-click-hint");
  const databaseList = root.querySelector(".xv-database-list");
  const leftPanel = root.querySelector(".xv-left-panel");
  const rightPanel = root.querySelector(".xv-right-panel");
  const energyWindowToggles = Array.from(root.querySelectorAll(".xv-energy-window-toggle"));
  const coreClearButton = root.querySelector(".xv-core-clear");
  const energyModeNote = root.querySelector(".xv-energy-mode-note");
  const surveyEnergyCard = root.querySelector(".xv-survey-energy-results");
  const energySummary = root.querySelector(".xv-energy-summary");
  const energyResults = root.querySelector(".xv-energy-results");
  const multiregionToggle = root.querySelector(".xv-multiregion-toggle");
  const pinnedSingleViewButton = root.querySelector(".xv-pinned-single-view");
  const workflowResetButton = root.querySelector(".xv-workflow-reset");
  const topMultiViewButton = root.querySelector(".xv-top-multiview");
  const singleViewButton = root.querySelector(".xv-single-view");
  const multiregionView = root.querySelector(".xv-multiregion-view");
  const chartHead = root.querySelector(".xv-chart-head");
  const chartCard = root.querySelector(".xv-chart-card");

  const svgNS = "http://www.w3.org/2000/svg";
  const createSVG = tag => document.createElementNS(svgNS, tag);

  function photonEnergyForCurrentBlock() {
    if (!currentBlock) return null;
    const direct = Number(currentBlock.photonEnergy);
    if (Number.isFinite(direct)) return direct;
    const src = sourceForBlock(currentBlock);
    return src && Number.isFinite(src.photonEnergy) ? src.photonEnergy : null;
  }
  function displayEnergyValue(bindingEnergy) {
    if (energyDisplayMode !== 'KE') return bindingEnergy;
    const photon = photonEnergyForCurrentBlock();
    return Number.isFinite(photon) ? photon - bindingEnergy : bindingEnergy;
  }
  function displayEnergyUnit() { return energyDisplayMode === 'KE' ? 'KE' : 'BE'; }

  const palette = ["#14b8a6", "#f59e0b", "#60a5fa", "#6d28d9", "#ec4899", "#dc2626"];
  const maxSelected = palette.length;
  const selectedElements = [];
  const colourAssignments = new Map();
  let lineFilter = "both";
  let parsedFile = null;
  let currentSample = null;
  let sampleOrder = [];
  let currentBlock = null;
  let fileName = "";
  let showCounts = false;
  let energyDisplayMode = "BE";
  let viewRange = null; // { min, max } in binding-energy coordinates
  let dragState = null;
  let identificationMode = null;
  let detectedPeaks = [];
  let autoCandidates = [];
  let compoundData = [];
  let selectedDatabaseAssignment = null;
  const pinnedCompounds = new Set();
  const expandedPinnedCompounds = new Set();
  let selectedClasses = new Set();
  let calibrationPickMode = false;
  let calibrationPanelOpen = false;
  let chartGeometry = null;
  let energyWindow = { active: false, center: null, halfWidth: 2.0 };
  let energyWindowDrag = null;
  let multiRegionMode = false;
  let multiRegionSource = 'manual';
  let analysisMode = null;
  const manualMultiRegionKeys = new Set();
  const manualMultiRegionLabels = new Map();
  const multiSampleIds = new Set();
  let activeMultiTileKey = null;
  const multiTileViews = new Map();
  const multiTileDragStates = new Map();
  const blockCalibrations = new Map();
  const sampleCalibrations = new Map();
  let lastSingleState = null;
  let multiMasterTouched = false;
  // Auto-identification uses relative line spacings and a common energy shift.
  // These tolerances are internal matching parameters, not an absolute BE window.
  const autoMatchToleranceEV = 2.2;
  const autoAugerToleranceEV = 2.8;
  const autoMaxShiftEV = 20.0;
  // Spin-orbit components closer than this are treated as one unresolved
  // survey feature for automatic identification (e.g. P 2p or K 2p).
  const autoUnresolvedGroupEV = 5.0;
  // Principal lines from one element should imply one common calibration/charge shift.
  // Keep this deliberately broad for survey spectra: we mainly reject internally
  // contradictory shifts, not elements whose whole spectrum is globally displaced.
  const autoOppositeShiftEV = 2.0;
  const autoShiftSpanRejectEV = 4.0;


  function isManualMultiView() { return multiRegionMode && multiRegionSource === 'manual'; }
  function isMultiSampleView() { return isManualMultiView() && multiSampleIds.size > 1; }
  function isMultiRegionView() { return isManualMultiView() && manualMultiRegionKeys.size > 1; }

  function syncSamplePickerLabel() {
    if (!samplePickerLabel) return;
    if (isMultiSampleView()) samplePickerLabel.textContent = `${multiSampleIds.size} samples`;
    else samplePickerLabel.textContent = currentSample || 'Sample';
  }

  function closeSampleMenu() {
    if (!sampleMenu || !samplePickerButton) return;
    sampleMenu.hidden = true;
    samplePickerButton.setAttribute('aria-expanded','false');
  }

  function setCurrentSampleDirect(sampleId, options={}) {
    if (!sampleId || !sampleOrder.includes(sampleId)) return;
    if (!isMultiSampleView()) { multiSampleIds.clear(); multiSampleIds.add(sampleId); }
    selectSample(sampleId, options);
    syncSamplePickerLabel();
  }

  function renderSampleMenu() {
    if (!sampleMenu) return;
    sampleMenu.innerHTML = '';
    const allowMultiSelect = isManualMultiView() && !isMultiRegionView();
    sampleOrder.forEach(sampleId => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'xv-sample-menu-row';
      row.setAttribute('role','option');
      const selected = allowMultiSelect ? multiSampleIds.has(sampleId) : sampleId === currentSample;
      row.classList.toggle('is-selected', selected);
      row.setAttribute('aria-selected', String(selected));
      if (allowMultiSelect) {
        const box = document.createElement('span');
        box.className = 'xv-sample-menu-check';
        box.textContent = selected ? '✓' : '';
        row.appendChild(box);
      }
      const label = document.createElement('span');
      label.className = 'xv-sample-menu-name';
      label.textContent = sampleId;
      row.appendChild(label);
      row.addEventListener('click', event => {
        event.preventDefault();
        if (!multiRegionMode || !allowMultiSelect) {
          setCurrentSampleDirect(sampleId, { preserveRegion:true, preserveMulti:multiRegionMode, preserveAnalysisMode:multiRegionMode });
          closeSampleMenu();
          return;
        }
        if (multiSampleIds.has(sampleId)) {
          if (multiSampleIds.size > 1) multiSampleIds.delete(sampleId);
        } else {
          // Selecting a second sample switches Multi-view to the multi-sample axis.
          // Keep only the active region so regions remain single-selection.
          if (manualMultiRegionKeys.size !== 1 && currentBlock) {
            manualMultiRegionKeys.clear();
            manualMultiRegionLabels.clear();
            const key = regionKey(currentBlock);
            manualMultiRegionKeys.add(key);
            manualMultiRegionLabels.set(key, normalizedBlockName(currentBlock));
          }
          multiSampleIds.add(sampleId);
        }
        if (multiSampleIds.size > 1) {
          analysisMode = null;
          resetAnalysisStateForNavigation();
        }
        if (!multiSampleIds.has(currentSample)) {
          currentSample = Array.from(multiSampleIds)[0] || sampleId;
          if (sampleSelect) sampleSelect.value = currentSample;
          const key = Array.from(manualMultiRegionKeys)[0] || (currentBlock ? regionKey(currentBlock) : '');
          currentBlock = key ? findBlockByRegionKey(currentSample,key) : null;
          if (!currentBlock) currentBlock = orderedBlocksForSample(currentSample)[0] || null;
        }
        activeMultiTileKey = currentBlock ? `${currentSample}|${regionKey(currentBlock)}` : null;
        renderSampleMenu();
        syncSamplePickerLabel();
        renderBlockList();
        updateStepperAvailability();
        updateAnalysisModeUI();
        if (currentBlock && currentBlock.type === 'core') renderCoreExplorer();
        renderSpectrum();
      });
      sampleMenu.appendChild(row);
    });
    if (isMultiRegionView()) {
      const note=document.createElement('div');
      note.className='xv-sample-menu-note';
      note.textContent='Multi-sample selection is disabled while several regions are selected.';
      sampleMenu.appendChild(note);
    }
  }

  function setActiveMultiTile(sampleId, block) {
    if (!block || !sampleId) return;
    multiMasterTouched = true;
    currentSample = sampleId;
    if (sampleSelect) sampleSelect.value = sampleId;
    currentBlock = block;
    activeMultiTileKey = `${sampleId}|${regionKey(block)}`;
    if (block.type === 'survey') analysisMode = 'survey';
    else if (block.type === 'core') analysisMode = 'core';
    updateAnalysisModeUI();
    renderBlockList();
    syncSamplePickerLabel();
    if (block.type === 'core') renderCoreExplorer();
    updateStepperAvailability();
    renderSpectrum();
  }

  const sourceDefinitions = {
    al: { label: "Al Kα", photonEnergy: 1486.6, scofieldLibrary: "ALSCOF", xraySource: "Al Kα" },
    mg: { label: "Mg Kα", photonEnergy: 1253.6, scofieldLibrary: "MGSCOF", xraySource: "Mg Kα" }
  };

  function parseCsvLine(line) {
    const out = [];
    let value = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
        else if (ch === '"') quoted = false;
        else value += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { out.push(value); value = ""; }
      else value += ch;
    }
    out.push(value);
    return out;
  }

  async function loadElementLines() {
    // Keep the JS mirror for element lines so this independent reference set can
    // still be inspected when the page is opened without a local web server.
    let text = typeof window.XPSElementLinesCSV === "string"
      ? window.XPSElementLinesCSV
      : null;
    if (!text) {
      const url = new URL('../../../data/element-lines-master.csv', spectrumAnalysisScriptUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Element reference database could not be loaded (${response.status}).`);
      text = await response.text();
    }
    text = text.replace(/^\uFEFF/, '');
    const rows = text.split(/\r?\n/).filter(Boolean).map(parseCsvLine);
    if (rows.length < 2) throw new Error('Element reference database is empty.');
    const header = rows[0].map(value => value.trim());
    const col = name => header.indexOf(name);
    const indexes = {
      element: col('element'), transition: col('transition'), augerGroup: col('auger_group'),
      lineType: col('line_type'), energyType: col('energy_type'), energy: col('energy_eV'),
      library: col('library'), source: col('xray_source'), sensitivity: col('sensitivity')
    };
    if (Object.values(indexes).some(index => index < 0)) throw new Error('Element reference database has an unexpected column layout.');
    return rows.slice(1).map((row, index) => ({
      id: index,
      element: row[indexes.element] || '',
      transition: row[indexes.transition] || '',
      augerGroup: row[indexes.augerGroup] || '',
      lineType: row[indexes.lineType] || '',
      energyType: row[indexes.energyType] || '',
      energy: Number.parseFloat(row[indexes.energy]),
      library: row[indexes.library] || '',
      source: row[indexes.source] || '',
      sensitivity: Number.parseFloat(row[indexes.sensitivity])
    })).filter(item => item.element && Number.isFinite(item.energy));
  }


  async function loadCompoundDatabase() {
    const url = new URL('../../../data/compounds-core-levels-final.csv', spectrumAnalysisScriptUrl);
    const records = await window.XPSData.loadRecords(url);
    const mapped = records.map((row, index) => ({
      id: index,
      compound: row['Compound'] || '',
      name: row['Compound name'] || '',
      aliases: row['Compound aliases'] || '',
      chemicalClass: row['Chemical class'] || '',
      coreLevel: row['Core level'] || '',
      be: Number.parseFloat(row['Binding energy (eV)']),
      uncertainty: Number.parseFloat(row['Uncertainty (eV)']),
      assignment: row['Peak assignment'] || '',
      reference: row['Reference'] || '',
      doi: row['DOI'] || ''
    })).filter(item => item.compound && item.coreLevel && Number.isFinite(item.be));
    if (!mapped.length) throw new Error('Compound reference database is empty or has unexpected columns.');
    return mapped;
  }

  let rawData = [];
  const availableElements = new Set();

  const periodicLayout = [
    ["H", null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"He"],
    ["Li","Be",null,null,null,null,null,null,null,null,null,null,"B","C","N","O","F","Ne"],
    ["Na","Mg",null,null,null,null,null,null,null,null,null,null,"Al","Si","P","S","Cl","Ar"],
    ["K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr"],
    ["Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe"],
    ["Cs","Ba","L","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn"],
    ["Fr","Ra","A","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"]
  ];
  const lanthanides = ["La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu"];
  const actinides = ["Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"];
  const atomicNumbers = {};
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ").forEach((el, i) => atomicNumbers[el] = i + 1);

  function makeElementButton(element) {
    if (element === null) {
      const gap = document.createElement("span");
      gap.className = "xv-periodic-gap";
      return gap;
    }
    if (element === "L" || element === "A") {
      const marker = document.createElement("div");
      marker.className = "xv-series-marker";
      marker.textContent = element;
      return marker;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.element = element;
    button.innerHTML = `<span class="xv-z">${atomicNumbers[element] || ""}</span><span class="xv-symbol">${element}</span>`;
    button.disabled = !availableElements.has(element);
    button.addEventListener("click", () => toggleElement(element));
    return button;
  }

  periodicLayout.flat().forEach(element => periodicTable.appendChild(makeElementButton(element)));
  [lanthanidesRow, actinidesRow].forEach((row, idx) => {
    const label = document.createElement("div");
    label.className = "xv-series-label";
    label.textContent = idx === 0 ? "L" : "A";
    row.appendChild(label);
    (idx === 0 ? lanthanides : actinides).forEach(el => row.appendChild(makeElementButton(el)));
  });

  function refreshElementAvailability() {
    root.querySelectorAll("[data-element]").forEach(button => {
      button.disabled = !availableElements.has(button.dataset.element);
    });
  }

  // Load the reference database in the background. File opening and VAMAS parsing
  // remain available even if the CSV is temporarily unavailable.
  loadElementLines().then(data => {
    rawData = data;
    availableElements.clear();
    rawData.forEach(item => availableElements.add(item.element));
    refreshElementAvailability();
    if (currentBlock) renderSpectrum();
  }).catch(error => {
    statusBox.hidden = false;
    statusBox.classList.add('is-error');
    statusBox.textContent = error && error.message ? error.message : String(error);
  });

  loadCompoundDatabase().then(data => {
    compoundData = data;
    populateChemicalClasses();
    if (currentBlock && currentBlock.type === "core") renderCoreExplorer();
  }).catch(error => {
    console.warn('Reference database load failed:', error);
  });

  function showStatus(message, isError = false) {
    statusBox.hidden = false;
    statusBox.textContent = message;
    statusBox.classList.toggle("is-error", isError);
  }
  function clearStatus() { statusBox.hidden = true; statusBox.textContent = ""; statusBox.classList.remove("is-error"); }
  function toInt(value) {
    const n = Number(value);
    return Number.isFinite(n) && Number.isInteger(n) ? n : null;
  }
  function toFloat(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function cleanSensitivity(value) { return Number.isFinite(value) && value >= 0 && value <= 1000 ? value : null; }


  function calibrationOffsetForBlock(block) {
    if (!block) return 0;
    if (blockCalibrations.has(block.index)) return Number(blockCalibrations.get(block.index)) || 0;
    if (sampleCalibrations.has(block.sampleId)) return Number(sampleCalibrations.get(block.sampleId)) || 0;
    return 0;
  }

  function displayPointsForBlock(block) {
    const offset = calibrationOffsetForBlock(block);
    if (!block || !Array.isArray(block.points)) return [];
    if (Math.abs(offset) < 1e-12) return block.points;
    return block.points.map(point => ({ x: point.x + offset, y: point.y }));
  }

  function formatCalibration(offset) {
    if (!Number.isFinite(offset) || Math.abs(offset) < 0.005) return '';
    return `ΔBE ${offset >= 0 ? '+' : ''}${offset.toFixed(2)} eV`;
  }
  function formatCalibrationLabel(offset) {
    const delta = formatCalibration(offset);
    return delta ? `Calibration · ${delta}` : '';
  }

  function setCalibrationPanelOpen(open) {
    calibrationPanelOpen = !!open && !!currentBlock && !multiRegionMode;
    if (calibrationStrip) calibrationStrip.hidden = !calibrationPanelOpen;
    if (!calibrationPanelOpen) setCalibrationPickMode(false);
    updateCalibrationUI();
  }

  function setCalibrationPickMode(enabled) {
    if (enabled && energyWindow.active) { energyWindow.active = false; updateEnergyWindowButtons(); }
    calibrationPickMode = !!enabled && calibrationPanelOpen && !!currentBlock && !multiRegionMode;
    if (calibrationPickButton) calibrationPickButton.classList.toggle('is-active', calibrationPickMode);
    if (graphCalibrationButton) graphCalibrationButton.classList.toggle('is-picking', calibrationPickMode);
    chart.classList.toggle('is-calibrating', calibrationPickMode);
    if (calibrationPickMode) clearStatus();
    updateCalibrationUI();
  }

  function updateCalibrationUI() {
    if (!currentBlock) return;
    const offset = calibrationOffsetForBlock(currentBlock);
    const hasOffset = Math.abs(offset) >= 0.005;
    if (calibrationStatus) {
      calibrationStatus.hidden = !hasOffset;
      calibrationStatus.textContent = hasOffset ? formatCalibrationLabel(offset) : '';
      calibrationStatus.classList.toggle('is-set', hasOffset);
    }
    if (calibrationStrip) calibrationStrip.hidden = !calibrationPanelOpen;
    if (graphCalibrationButton) {
      graphCalibrationButton.hidden = false;
      graphCalibrationButton.disabled = !!multiRegionMode;
      const icon = '<span class="xv-btn-icon xv-svg-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.2"></circle><path d="M10 2.3v3M10 14.7v3M2.3 10h3M14.7 10h3"></path></svg></span>';
      graphCalibrationButton.innerHTML = `${icon}<span>${calibrationPanelOpen ? 'Close calibration' : 'Open calibration'}</span>`;
      // Calibration remains a secondary grey control. The orange graph badge carries the active offset state.
      graphCalibrationButton.classList.remove('is-set');
      graphCalibrationButton.classList.toggle('is-picking', calibrationPickMode);
      graphCalibrationButton.classList.toggle('is-open', calibrationPanelOpen && !multiRegionMode);
    }
    if (graphCalibrationBadge) {
      graphCalibrationBadge.hidden = !hasOffset;
      graphCalibrationBadge.textContent = hasOffset ? `${offset >= 0 ? '+' : ''}${offset.toFixed(2)} eV` : '';
    }
    if (calibrationPickButton) {
      calibrationPickButton.textContent = calibrationPickMode ? 'Picking…' : 'Pick observed BE';
    }
  }

  function pickCalibrationEnergyFromEvent(event) {
    if (!calibrationPickMode || !currentBlock || !chartGeometry) return;
    const rect = chart.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = (event.clientX - rect.left) / rect.width * chartGeometry.width;
    const ratio = (svgX - chartGeometry.left) / Math.max(1, chartGeometry.plotWidth);
    if (ratio < 0 || ratio > 1) return;
    const energy = chartGeometry.xMax - ratio * (chartGeometry.xMax - chartGeometry.xMin);
    if (Number.isFinite(energy)) calibrationObserved.value = energy.toFixed(2);
  }

  function applyCalibration() {
    if (!currentBlock) return;
    const observed = Number.parseFloat(calibrationObserved.value);
    const reference = Number.parseFloat(calibrationReference.value);
    if (!Number.isFinite(observed) || !Number.isFinite(reference)) {
      // Keep calibration validation quiet: the empty/invalid fields already show that nothing was applied.
      clearStatus();
      return;
    }

    const currentOffset = calibrationOffsetForBlock(currentBlock);
    const newOffset = currentOffset + (reference - observed);

    if (calibrationScope.value === 'sample') {
      sampleCalibrations.set(currentBlock.sampleId, newOffset);
      if (parsedFile) {
        parsedFile.blocks
          .filter(block => block.sampleId === currentBlock.sampleId)
          .forEach(block => blockCalibrations.delete(block.index));
      }
    } else {
      blockCalibrations.set(currentBlock.index, newOffset);
    }

    clearStatus();
    setCalibrationPickMode(false);
    calibrationObserved.value = '';
    calibrationReference.value = '';
    viewRange = null;
    resetViewButton.disabled = true;
    updateCalibrationUI();
    renderSpectrum();
  }

  function resetCalibration(mode) {
    if (!currentBlock) return;
    if (mode === 'all') {
      sampleCalibrations.delete(currentBlock.sampleId);
      if (parsedFile) {
        parsedFile.blocks
          .filter(block => block.sampleId === currentBlock.sampleId)
          .forEach(block => blockCalibrations.delete(block.index));
      }
    } else if (mode === 'current') {
      if (sampleCalibrations.has(currentBlock.sampleId)) {
        // Preserve a sample-wide calibration on the other blocks while restoring
        // the current region to its raw energy scale.
        blockCalibrations.set(currentBlock.index, 0);
      } else {
        blockCalibrations.delete(currentBlock.index);
      }
    } else {
      return;
    }
    setCalibrationPickMode(false);
    calibrationObserved.value = '';
    calibrationReference.value = '';
    viewRange = null;
    resetViewButton.disabled = true;
    updateCalibrationUI();
    renderSpectrum();
  }

  function normalizeSearch(value) {
    const subscriptDigits = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return String(value || '')
      .replace(/[₀-₉]/g, digit => subscriptDigits[digit] || digit)
      .toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_\-–—=()\[\],.;:/+]+/g, '');
  }

  function displayAssignment(value) {
    return String(value || '')
      .replace(/C\s*[-–—=]\s*O/gi, 'CO')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function chemicalClassesForRow(row) {
    return String(row.chemicalClass || '').split(';').map(value => value.trim()).filter(Boolean);
  }

  const classKey = value => String(value || '').trim().toLocaleLowerCase();

  function updateClassToggle() {
    if (!coreClassToggle) return;
    const count = selectedClasses.size;
    coreClassToggle.textContent = count
      ? `${count} ${count === 1 ? 'class' : 'classes'} selected`
      : 'Select chemical classes';
  }

  function populateChemicalClasses() {
    if (!coreClassOptions) return;
    const coreLevel = currentCoreLevel();
    const available = new Map();
    compoundData
      .filter(row => !coreLevel || row.coreLevel === coreLevel)
      .forEach(row => chemicalClassesForRow(row).forEach(name => available.set(classKey(name), name)));

    selectedClasses = new Set(Array.from(selectedClasses).filter(key => available.has(key)));
    coreClassOptions.innerHTML = '';
    Array.from(available.entries()).sort((a,b) => a[1].localeCompare(b[1])).forEach(([key, name]) => {
      const label = document.createElement('label');
      label.className = 'xv-core-class-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = key;
      input.checked = selectedClasses.has(key);
      input.addEventListener('change', () => {
        input.checked ? selectedClasses.add(key) : selectedClasses.delete(key);
        selectedDatabaseAssignment = null;
        updateClassToggle();
        renderCoreExplorer();
        renderSpectrum();
      });
      label.append(input, document.createTextNode(name));
      coreClassOptions.appendChild(label);
    });
    if (coreClassSearch) coreClassSearch.value = '';
    if (coreClassMenu) coreClassMenu.hidden = true;
    if (coreClassToggle) coreClassToggle.setAttribute('aria-expanded', 'false');
    updateClassToggle();
  }

  function currentCoreLevel() {
    return currentBlock && currentBlock.type === 'core' ? normalizedBlockName(currentBlock) : '';
  }

  // TODO: a narrow VAMAS region can contain another core level in the same
  // energy window (for example K 2p overlapping a C 1s region). Keep the VAMAS
  // block identity unchanged; a future energy-window search should surface such
  // alternate core levels without renaming the imported region.

  function rowSearchText(row) {
    return [
      displayAssignment(row.assignment), row.assignment, row.compound, row.name,
      row.aliases, row.chemicalClass, row.coreLevel
    ].map(normalizeSearch).filter(Boolean).join('|');
  }

  function rowMatchesCoreFilters(row, query = null) {
    const coreLevel = currentCoreLevel();
    if (!coreLevel || row.coreLevel !== coreLevel) return false;
    if (selectedClasses.size && !chemicalClassesForRow(row).some(name => selectedClasses.has(classKey(name)))) return false;
    const q = query === null ? normalizeSearch(coreSearchInput ? coreSearchInput.value : '') : normalizeSearch(query);
    if (!q) return true;
    return rowSearchText(row).includes(q);
  }

  function compoundMatchesQuery(row, query) {
    const q = normalizeSearch(query);
    if (!q) return false;
    return [row.compound, row.name, row.aliases].map(normalizeSearch).some(value => value.includes(q));
  }

  function uniqueBy(items, keyFn) {
    const seen = new Set();
    return items.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function currentBlockEnergyBounds() {
    if (!currentBlock || !currentBlock.points.length) return null;
    const xs = displayPointsForBlock(currentBlock).map(point => point.x).filter(Number.isFinite);
    return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null;
  }

  function compoundSearchResults() {
    const q = normalizeSearch(coreSearchInput ? coreSearchInput.value : '');
    const bounds = currentBlockEnergyBounds();
    const byCompound = new Map();
    compoundData.forEach(row => {
      if (q && !compoundMatchesQuery(row, q)) return;
      if (!bounds || row.be < bounds.min || row.be > bounds.max) return;
      if (!byCompound.has(row.compound)) byCompound.set(row.compound, []);
      byCompound.get(row.compound).push(row);
    });
    return Array.from(byCompound.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }

  function rowsForSelectedDatabaseOverlay() {
    if (!currentBlock || currentBlock.type !== 'core' || !pinnedCompounds.size) return [];
    // Deliberately energy-based rather than core-name based: a VAMAS region labelled
    // C 1s may also contain K 2p, for example. Pinned compounds therefore expose
    // every reported line that actually falls inside the displayed region.
    const bounds = currentBlockEnergyBounds();
    if (!bounds) return [];
    return uniqueBy(
      compoundData.filter(row => pinnedCompounds.has(row.compound) && row.be >= bounds.min && row.be <= bounds.max),
      row => `${row.compound}|${row.coreLevel}|${row.assignment}|${row.be.toFixed(4)}`
    );
  }

  function blockEnergyBounds(block) {
    if (!block || !block.points || !block.points.length) return null;
    const xs = displayPointsForBlock(block).map(point => point.x).filter(Number.isFinite);
    return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null;
  }

  function findSampleBlockForReportedRows(rows) {
    if (!parsedFile || !currentSample || !rows || !rows.length) return null;
    const energies = rows.map(row => row.be).filter(Number.isFinite);
    if (!energies.length) return null;
    const candidates = parsedFile.blocks
      .filter(block => block.sampleId === currentSample && block.type === 'core')
      .map(block => ({ block, bounds: blockEnergyBounds(block) }))
      .filter(item => item.bounds && energies.some(be => be >= item.bounds.min && be <= item.bounds.max));
    if (!candidates.length) return null;
    candidates.sort((a,b) => {
      const aCurrent = currentBlock && a.block.index === currentBlock.index ? 0 : 1;
      const bCurrent = currentBlock && b.block.index === currentBlock.index ? 0 : 1;
      if (aCurrent !== bCurrent) return aCurrent - bCurrent;
      const aspan = a.bounds.max - a.bounds.min, bspan = b.bounds.max - b.bounds.min;
      return aspan - bspan;
    });
    return candidates[0].block;
  }

  function updateMultiRegionButton() {
    const hasFile = !!(parsedFile && currentSample);
    const canUsePinned = !!pinnedCompounds.size;
    if (multiregionToggle) {
      multiregionToggle.hidden = !canUsePinned;
      multiregionToggle.disabled = !canUsePinned;
      multiregionToggle.classList.toggle('is-active', multiRegionMode && multiRegionSource === 'manual' && canUsePinned);
      multiregionToggle.setAttribute('aria-pressed', String(multiRegionMode && canUsePinned));
    }
    if (pinnedSingleViewButton) {
      pinnedSingleViewButton.hidden = !canUsePinned;
      pinnedSingleViewButton.disabled = !canUsePinned;
      pinnedSingleViewButton.classList.toggle('is-active', !multiRegionMode && canUsePinned);
      pinnedSingleViewButton.setAttribute('aria-pressed', String(!multiRegionMode && canUsePinned));
    }
    if (topMultiViewButton) {
      topMultiViewButton.disabled = !hasFile;
      topMultiViewButton.classList.toggle('is-active', multiRegionMode);
      topMultiViewButton.setAttribute('aria-pressed', String(multiRegionMode));
      topMultiViewButton.title = multiRegionMode
        ? 'Select several regions above, or return to Single view'
        : 'Select several Survey, core-level, valence or other regions';
    }
    if (singleViewButton) {
      singleViewButton.classList.toggle('is-active', !multiRegionMode);
      singleViewButton.setAttribute('aria-pressed', String(!multiRegionMode));
    }
    if (workflowResetButton) {
      workflowResetButton.disabled = !multiRegionMode;
      workflowResetButton.title = multiRegionMode ? 'Reset Multi-view selection' : 'Reset is available in Multi-view';
    }
    if (exportImageButton) {
      exportImageButton.hidden = !hasFile;
      exportImageButton.disabled = multiRegionMode ? selectedMultiBlocks().length === 0 : !currentBlock;
    }
  }

  function pinnedRowsForBlock(block) {
    if (!block || block.type !== 'core') return [];
    const bounds = blockEnergyBounds(block);
    if (!bounds || !pinnedCompounds.size) return [];
    return uniqueBy(
      compoundData.filter(row => pinnedCompounds.has(row.compound) && row.be >= bounds.min && row.be <= bounds.max),
      row => `${row.compound}|${row.coreLevel}|${normalizeSearch(row.assignment)}|${row.be.toFixed(3)}`
    ).sort((a,b) => b.be-a.be || a.compound.localeCompare(b.compound));
  }

  function multiRegionBlocks() {
    if (!parsedFile || !currentSample || !pinnedCompounds.size) return [];
    const blocks = parsedFile.blocks
      .filter(block => block.sampleId === currentSample && block.type === 'core')
      .map(block => ({ block, rows: pinnedRowsForBlock(block), bounds: blockEnergyBounds(block) }))
      .filter(item => item.rows.length && item.bounds);
    blocks.sort((a,b) => a.block.index - b.block.index);
    return blocks;
  }

  function manualMultiRegionBlocks() {
    if (!parsedFile || !currentSample) return [];
    const regionKeys = Array.from(manualMultiRegionKeys);
    if (isMultiSampleView()) {
      const key = regionKeys[0] || (currentBlock ? regionKey(currentBlock) : '');
      if (!key) return [];
      return sampleOrder.filter(sampleId => multiSampleIds.has(sampleId)).map(sampleId => {
        const block = findBlockByRegionKey(sampleId, key);
        return {
          key,
          sampleId,
          label: manualMultiRegionLabels.get(key) || key,
          block,
          rows: block && !isMultiSampleView() ? pinnedRowsForBlock(block) : [],
          bounds: block ? blockEnergyBounds(block) : null
        };
      });
    }
    return regionKeys.map(key => {
      const block = findBlockByRegionKey(currentSample, key);
      return {
        key,
        sampleId: currentSample,
        label: manualMultiRegionLabels.get(key) || key,
        block,
        rows: block ? pinnedRowsForBlock(block) : [],
        bounds: block ? blockEnergyBounds(block) : null
      };
    });
  }

  function displayedMultiRegionBlocks() {
    return multiRegionSource === 'pinned' ? multiRegionBlocks() : manualMultiRegionBlocks();
  }

  function renderMiniRegionChart(svg, block, rows, tileKey) {
    svg.innerHTML = '';
    const pointsAll = displayPointsForBlock(block);
    if (pointsAll.length < 2) return;
    const fullXs = pointsAll.map(p=>p.x);
    const fullMin = Math.min(...fullXs), fullMax = Math.max(...fullXs);
    const key = tileKey || `${block.sampleId || currentSample}|${regionKey(block)}`;
    const state = multiTileViews.get(key) || { xMin: fullMin, xMax: fullMax, counts: false, energyMode: 'BE' };
    state.xMin = Math.max(fullMin, Math.min(state.xMin, fullMax));
    state.xMax = Math.max(fullMin, Math.min(state.xMax, fullMax));
    if (state.xMax - state.xMin < Math.max(0.02, (fullMax-fullMin)*0.002)) { state.xMin=fullMin; state.xMax=fullMax; }
    multiTileViews.set(key, state);
    const points = pointsAll.filter(p=>p.x >= state.xMin && p.x <= state.xMax);
    if (points.length < 2) return;
    const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
    const xMin=state.xMin, xMax=state.xMax;
    const yMinRaw=Math.min(...ys), yMaxRaw=Math.max(...ys);
    const yr=Math.max(1e-12,yMaxRaw-yMinRaw);
    const yMin=Math.max(0,yMinRaw-.02*yr), yMax=yMaxRaw+.06*yr;
    const rect=svg.getBoundingClientRect();
    const W=520;
    const aspect=(rect.width>20 && rect.height>20) ? rect.height/rect.width : (320/520);
    const H=Math.max(220,Math.min(480,Math.round(W*aspect)));
    const m={l:state.counts?46:20,r:12,t:6,b:34};
    const pw=W-m.l-m.r, ph=H-m.t-m.b;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio','none');
    const sx=v=>m.l+((xMax-v)/Math.max(1e-12,xMax-xMin))*pw;
    const sy=v=>m.t+((yMax-v)/Math.max(1e-12,yMax-yMin))*ph;
    for(let i=0;i<=4;i++){
      const x=m.l+i*pw/4;
      const g=createSVG('line'); g.setAttribute('x1',x);g.setAttribute('x2',x);g.setAttribute('y1',m.t);g.setAttribute('y2',m.t+ph);g.setAttribute('class','xv-grid');svg.appendChild(g);
      const be=xMax-i*(xMax-xMin)/4;
      let shown=be;
      if (block.type==='survey' && state.energyMode==='KE') { const photon=Number(block.photonEnergy); if(Number.isFinite(photon)) shown=photon-be; }
      const t=createSVG('text');t.setAttribute('x',x);t.setAttribute('y',H-12);t.setAttribute('text-anchor','middle');t.setAttribute('class','xv-multi-tick');t.textContent=(xMax-xMin<15?shown.toFixed(1):Math.round(shown));svg.appendChild(t);
    }
    for(let i=0;i<=3;i++){
      const y=m.t+i*ph/3; const g=createSVG('line');g.setAttribute('x1',m.l);g.setAttribute('x2',m.l+pw);g.setAttribute('y1',y);g.setAttribute('y2',y);g.setAttribute('class','xv-grid');svg.appendChild(g);
      if(state.counts){
        const tv=createSVG('text');tv.setAttribute('x',m.l-5);tv.setAttribute('y',y+4);tv.setAttribute('text-anchor','end');tv.setAttribute('class','xv-multi-tick');{const value=yMax-i*(yMax-yMin)/3;tv.textContent=value>=10000?value.toExponential(1):Math.round(value).toString();}svg.appendChild(tv);
      }
    }
    let d=''; points.forEach((p,i)=>{d+=`${i?'L':'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)} `});
    if (energyWindow.active && activeMultiTileKey===key && currentBlock && currentBlock.index===block.index && Number.isFinite(energyWindow.center)) {
      const bounds=energyWindowBounds();
      [{key:'left',value:bounds.max,edge:true},{key:'center',value:energyWindow.center,edge:false},{key:'right',value:bounds.min,edge:true}].forEach(pos=>{
        if(pos.value<xMin||pos.value>xMax)return; const x=sx(pos.value);
        const line=createSVG('line');line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',m.t);line.setAttribute('y2',m.t+ph);line.setAttribute('class',pos.edge?'xv-energy-window-edge':'xv-energy-window-center');svg.appendChild(line);
        const hit=createSVG('line');hit.setAttribute('x1',x);hit.setAttribute('x2',x);hit.setAttribute('y1',m.t);hit.setAttribute('y2',m.t+ph);hit.setAttribute('class','xv-energy-window-hit');hit.dataset.energyHandle=pos.key;svg.appendChild(hit);
      });
    }
    const path=createSVG('path');path.setAttribute('d',d.trim());path.setAttribute('class','xv-spectrum-path');svg.appendChild(path);
    const placed=[];
    rows.filter(row=>row.be>=xMin && row.be<=xMax).forEach(row=>{
      const x=sx(row.be);
      const line=createSVG('line');line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',m.t);line.setAttribute('y2',m.t+ph);line.setAttribute('class','xv-db-reference-line is-pinned-ref');svg.appendChild(line);
      let level=0; while(placed.some(p=>Math.abs(p.x-x)<58 && p.level===level)&&level<3) level++; placed.push({x,level});
      const label=createSVG('text');label.setAttribute('x',x);label.setAttribute('y',m.t+11+level*19);label.setAttribute('text-anchor','middle');label.setAttribute('class','xv-multi-ref-label');
      const showInfo = event => { event.stopPropagation(); showCoreReferenceInfo(row); };
      line.style.cursor='pointer';
      line.addEventListener('pointerdown',event=>event.stopPropagation());
      line.addEventListener('click',showInfo);
      label.style.cursor='pointer'; label.setAttribute('title',`${row.compound} · ${row.coreLevel} · ${formatReferenceValue(row)}`);
      const a=createSVG('tspan');a.setAttribute('x',x);a.textContent=displayAssignment(row.assignment)||row.coreLevel;label.appendChild(a);
      const c=createSVG('tspan');c.setAttribute('x',x);c.setAttribute('dy','10');c.setAttribute('class','xv-multi-ref-sub');c.textContent=row.compound;label.appendChild(c);
      label.addEventListener('pointerdown',event=>event.stopPropagation());
      label.addEventListener('click',showInfo);
      svg.appendChild(label);
    });
    const axis=createSVG('text');axis.setAttribute('x',m.l+pw/2);axis.setAttribute('y',H-1);axis.setAttribute('text-anchor','middle');axis.setAttribute('class','xv-multi-axis');axis.textContent=(block.type==='survey' && state.energyMode==='KE')?'Kinetic energy (eV)':'Binding energy (eV)';svg.appendChild(axis);

    // Local interaction: wheel zoom around cursor, drag to pan. Each tile owns its view.
    svg.onwheel = event => {
      event.preventDefault();
      const r=svg.getBoundingClientRect(); if(!r.width) return;
      const frac=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));
      const center=xMax-frac*(xMax-xMin);
      const factor=event.deltaY<0?0.82:1.22;
      let span=(xMax-xMin)*factor; span=Math.min(fullMax-fullMin,Math.max(span,(fullMax-fullMin)*0.02));
      let nMax=center+frac*span, nMin=nMax-span;
      if(nMin<fullMin){nMax+=fullMin-nMin;nMin=fullMin;} if(nMax>fullMax){nMin-=nMax-fullMax;nMax=fullMax;}
      state.xMin=Math.max(fullMin,nMin); state.xMax=Math.min(fullMax,nMax); multiTileViews.set(key,state);
      renderMiniRegionChart(svg,block,rows,key);
    };
    svg.onpointerdown = event => {
      if(event.button!==0 || event.target.closest?.('.xv-multi-ref-label')) return;
      if (energyWindow.active && activeMultiTileKey===key && currentBlock && currentBlock.index===block.index) {
        const handle=event.target && event.target.dataset ? event.target.dataset.energyHandle : null;
        const r=svg.getBoundingClientRect(); if(!r.width) return;
        const frac=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));
        const e=state.xMax-frac*(state.xMax-state.xMin);
        if(handle){
          energyWindowDrag={handle,startEnergy:e,center:energyWindow.center,halfWidth:energyWindow.halfWidth};
          svg.setPointerCapture?.(event.pointerId); event.preventDefault(); return;
        }
        energyWindow.center=e; normalizeEnergyWindowForCurrentBlock(false); renderMiniRegionChart(svg,block,rows,key); if (analysisMode==='core') renderCoreExplorer(); event.preventDefault(); return;
      }
      multiTileDragStates.set(key,{x:event.clientX,min:state.xMin,max:state.xMax,pointerId:event.pointerId});
      svg.setPointerCapture?.(event.pointerId);
      svg.classList.add('is-panning');
    };
    svg.onpointermove = event => {
      if (energyWindowDrag && activeMultiTileKey===key && currentBlock && currentBlock.index===block.index) {
        const r=svg.getBoundingClientRect(); if(!r.width) return;
        const frac=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));
        const now=state.xMax-frac*(state.xMax-state.xMin);
        if(energyWindowDrag.handle==='center') energyWindow.center=energyWindowDrag.center+(now-energyWindowDrag.startEnergy);
        else energyWindow.halfWidth=Math.max(0.05,Math.abs(now-energyWindow.center));
        renderMiniRegionChart(svg,block,rows,key); if (analysisMode==='core') renderCoreExplorer(); return;
      }
      const drag=multiTileDragStates.get(key); if(!drag) return;
      const r=svg.getBoundingClientRect(); if(!r.width) return;
      const delta=(event.clientX-drag.x)/r.width*(drag.max-drag.min);
      let nMin=drag.min+delta,nMax=drag.max+delta;
      if(nMin<fullMin){nMax+=fullMin-nMin;nMin=fullMin;}
      if(nMax>fullMax){nMin-=nMax-fullMax;nMax=fullMax;}
      state.xMin=nMin;state.xMax=nMax;multiTileViews.set(key,state);
      renderMiniRegionChart(svg,block,rows,key);
    };
    const endPan = event => { energyWindowDrag=null; multiTileDragStates.delete(key); svg.classList.remove('is-panning'); try{svg.releasePointerCapture?.(event.pointerId);}catch(_){} };
    svg.onpointerup = endPan; svg.onpointercancel = endPan;
  }

  function renderMultiRegionView() {
    if (!multiregionView) return;
    multiregionView.innerHTML='';
    const all=displayedMultiRegionBlocks();
    const visible=all.slice(0,6);
    multiregionView.dataset.count=String(visible.length);
    if (!visible.length) {
      const empty=document.createElement('div');empty.className='xv-multiregion-empty';empty.textContent=multiRegionSource === 'manual' ? 'Select regions above to build the multi-view.' : 'No available spectrum contains a reported line from the pinned compounds.';multiregionView.appendChild(empty);return;
    }
    visible.forEach(({block,rows,label,sampleId})=>{
      const tileSample = sampleId || (block && block.sampleId) || currentSample;
      const tileKey = block ? `${tileSample}|${regionKey(block)}` : `${tileSample}|${label || 'missing'}`;
      const tile=document.createElement('div');tile.className='xv-multiregion-tile';
      tile.classList.toggle('is-search-master',!!block && activeMultiTileKey===tileKey);
      const head=document.createElement('div');head.className='xv-multiregion-head';
      const titleWrap=document.createElement('div');titleWrap.className='xv-multiregion-title-wrap';
      const title=document.createElement('button');title.type='button';title.className='xv-multiregion-open';title.textContent=block ? normalizedBlockName(block) : (label || 'Region');title.title=block ? 'Use this spectrum for Survey / Core-level search' : 'Region not available for this sample';
      const sampleBadge=document.createElement('span');sampleBadge.className='xv-multiregion-sample-badge';sampleBadge.textContent=tileSample || '';
      if (block) title.addEventListener('click',event=>{event.stopPropagation();setActiveMultiTile(tileSample,block);});
      titleWrap.append(sampleBadge,title);
      if (block) {
        const tileOffset = calibrationOffsetForBlock(block);
        if (Math.abs(tileOffset) >= 0.005) {
          const calBadge=document.createElement('span');
          calBadge.className='xv-multiregion-calibration-badge';
          calBadge.textContent=`${tileOffset >= 0 ? '+' : ''}${tileOffset.toFixed(2)} eV`;
          calBadge.title='Active binding-energy calibration';
          titleWrap.append(calBadge);
        }
      }
      const controls=document.createElement('div');controls.className='xv-multiregion-controls';
      const meta=document.createElement('span');meta.className='xv-multiregion-meta';meta.textContent=block ? `${rows.length} pinned ${rows.length===1?'line':'lines'}` : '';
      if(block){
        const countBtn=document.createElement('button');countBtn.type='button';countBtn.className='xv-multi-counts';countBtn.textContent='Counts';
        let axisBtn=null;
        if (isMultiSampleView() && block.type === 'survey') {
          axisBtn=document.createElement('button'); axisBtn.type='button'; axisBtn.className='xv-multi-energy-axis';
          const st0=multiTileViews.get(tileKey)||{}; axisBtn.textContent=st0.energyMode || 'BE';
          axisBtn.addEventListener('click',event=>{event.stopPropagation();const state=multiTileViews.get(tileKey)||{};state.energyMode=(state.energyMode||'BE')==='BE'?'KE':'BE';multiTileViews.set(tileKey,state);renderMultiRegionView();});
        }
        const resetBtn=document.createElement('button');resetBtn.type='button';resetBtn.className='xv-multi-reset';resetBtn.innerHTML='<span class="xv-btn-icon xv-svg-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5.2 6.2H2.8V3.8"></path><path d="M3.2 6a7 7 0 1 1-1 6"></path></svg></span><span>View</span>';
        const st=multiTileViews.get(tileKey)||{}; countBtn.classList.toggle('is-active',!!st.counts);
        countBtn.addEventListener('click',event=>{event.stopPropagation();const state=multiTileViews.get(tileKey)||{};state.counts=!state.counts;multiTileViews.set(tileKey,state);renderMultiRegionView();});
        resetBtn.addEventListener('click',event=>{event.stopPropagation();multiTileViews.delete(tileKey);renderMultiRegionView();});
        controls.append(meta); if(axisBtn) controls.append(axisBtn); controls.append(countBtn,resetBtn);
      } else controls.append(meta);
      head.append(titleWrap,controls);
      if (!block) {
        const unavailable=document.createElement('div'); unavailable.className='xv-multiregion-unavailable'; unavailable.textContent='Not available';
        tile.append(head,unavailable); multiregionView.appendChild(tile); return;
      }
      const svg=createSVG('svg');svg.setAttribute('class','xv-multiregion-chart');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${tileSample} ${normalizedBlockName(block)} spectrum`);
      tile.append(head,svg);multiregionView.appendChild(tile);renderMiniRegionChart(svg,block,rows,tileKey);
    });
    if(all.length>6){const note=document.createElement('div');note.className='xv-multiregion-limit';note.textContent=`Showing 6 of ${all.length} selected spectra.`;multiregionView.appendChild(note);}
  }

  async function writeClipboardText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      field.remove();
      return copied;
    }
  }

  function formatReferenceValue(row) {
    const uncertaintyDigits = Number.isFinite(row.uncertainty) && row.uncertainty > 0 && row.uncertainty < 0.1 ? 2 : 1;
    const uncertainty = Number.isFinite(row.uncertainty) && row.uncertainty > 0
      ? ` ± ${row.uncertainty.toFixed(uncertaintyDigits)}`
      : '';
    return `${row.be.toFixed(1)}${uncertainty} eV`;
  }

  function compoundClipboardText(compound, rows) {
    const sorted = rows.slice().sort((a,b) => a.coreLevel.localeCompare(b.coreLevel) || a.be - b.be);
    const first = sorted[0] || {};
    const heading = first.name && normalizeSearch(first.name) !== normalizeSearch(compound)
      ? `${compound} — ${first.name}`
      : compound;
    const references = uniqueBy(sorted, row => `${row.coreLevel}|${normalizeSearch(row.assignment)}|${row.be.toFixed(4)}|${row.doi}|${row.reference}`)
      .map(row => {
        const parts = [row.coreLevel, displayAssignment(row.assignment) || '—', formatReferenceValue(row)];
        if (row.doi) parts.push(`DOI: ${row.doi}`);
        if (row.reference && normalizeSearch(row.reference) !== normalizeSearch(row.doi)) parts.push(`Reference: ${row.reference}`);
        return parts.join(' · ');
      });
    return [heading, ...references].join('\n');
  }

  function renderPinnedCompounds() {
    if (!pinnedList) return;
    updateMultiRegionButton();
    pinnedList.innerHTML = '';
    if (!pinnedCompounds.size) {
      const empty = document.createElement('div');
      empty.className = 'xv-pinned-empty';
      empty.textContent = 'No pinned compound.';
      pinnedList.appendChild(empty);
      return;
    }

    Array.from(pinnedCompounds).sort().forEach(compound => {
      const allRows = compoundData.filter(row => row.compound === compound);
      const first = allRows[0] || {};
      const item = document.createElement('div');
      item.className = 'xv-pinned-item';

      const row = document.createElement('div');
      row.className = 'xv-pinned-row';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'xv-pinned-toggle';
      toggle.setAttribute('aria-expanded', String(expandedPinnedCompounds.has(compound)));
      toggle.innerHTML = `<span class="xv-pinned-copy"><b>${compound}</b><span>${first.name || ''}</span></span><span class="xv-pinned-chevron">${expandedPinnedCompounds.has(compound) ? '⌃' : '⌄'}</span>`;
      toggle.addEventListener('click', () => {
        if (expandedPinnedCompounds.has(compound)) expandedPinnedCompounds.delete(compound);
        else expandedPinnedCompounds.add(compound);
        renderPinnedCompounds();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'xv-unpin';
      remove.textContent = '×';
      remove.title = `Unpin ${compound}`;
      remove.addEventListener('click', event => {
        event.stopPropagation();
        pinnedCompounds.delete(compound);
        expandedPinnedCompounds.delete(compound);
        renderCoreExplorer();
        renderSpectrum();
      });

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'xv-copy-pinned';
      copy.title = `Copy all reference data for ${compound}`;
      copy.setAttribute('aria-label', `Copy all reference data for ${compound}`);
      copy.innerHTML = '<span class="xv-svg-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="6.5" y="6.5" width="9" height="9" rx="1.5"></rect><path d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5"></path></svg></span>';
      const copied = document.createElement('span');
      copied.className = 'xv-pinned-copy-feedback';
      copied.textContent = 'Copied';
      copied.hidden = true;
      copy.addEventListener('click', async event => {
        event.stopPropagation();
        if (!(await writeClipboardText(compoundClipboardText(compound, allRows)))) return;
        copied.hidden = false;
        window.setTimeout(() => { copied.hidden = true; }, 1000);
      });

      row.append(toggle, copy, remove, copied);
      item.appendChild(row);

      if (expandedPinnedCompounds.has(compound)) {
        const details = document.createElement('div');
        details.className = 'xv-pinned-details';
        const grouped = new Map();
        allRows.forEach(dataRow => {
          if (!grouped.has(dataRow.coreLevel)) grouped.set(dataRow.coreLevel, []);
          grouped.get(dataRow.coreLevel).push(dataRow);
        });

        Array.from(grouped.entries()).sort((a,b) => a[0].localeCompare(b[0])).forEach(([coreLevel, rows]) => {
          const detailRow = document.createElement('div');
          detailRow.className = 'xv-reported-row';
          const values = uniqueBy(rows, dataRow => `${dataRow.assignment}|${dataRow.be.toFixed(3)}`)
            .sort((a,b) => a.be - b.be)
            .map(dataRow => `${displayAssignment(dataRow.assignment) || '—'} ${dataRow.be.toFixed(1)} eV`)
            .join(' · ');
          const targetBlock = findSampleBlockForReportedRows(rows);
          const isCurrent = !!(targetBlock && currentBlock && targetBlock.index === currentBlock.index);

          const core = document.createElement('span');
          core.className = 'xv-reported-core';
          core.textContent = coreLevel;
          const value = document.createElement('span');
          value.className = 'xv-reported-values';
          value.textContent = values;
          const action = document.createElement('span');
          action.className = 'xv-reported-action';

          if (targetBlock && !isCurrent) {
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'xv-reported-open';
            open.textContent = '→';
            open.title = `Open available spectrum containing ${coreLevel}`;
            open.addEventListener('click', event => {
              event.stopPropagation();
              selectBlock(targetBlock);
            });
            action.appendChild(open);
          } else if (isCurrent) {
            const current = document.createElement('span');
            current.className = 'xv-reported-current';
            current.textContent = 'current';
            action.appendChild(current);
          }

          detailRow.append(core, value, action);
          details.appendChild(detailRow);
        });
        item.appendChild(details);
      }

      pinnedList.appendChild(item);
    });
  }

  function makeDatabaseHeader(labels) {
    const header = document.createElement('div');
    header.className = 'xv-db-header';
    labels.forEach(label => { const cell=document.createElement('span'); cell.textContent=label; header.appendChild(cell); });
    return header;
  }

  function energiesForRows(rows) {
    return uniqueBy(rows.filter(row=>Number.isFinite(row.be)).slice().sort((a,b)=>a.be-b.be), row=>row.be.toFixed(3)).map(row=>row.be.toFixed(1));
  }

  function makeExpectedCompoundRow(compound, rows) {
    const first = rows[0] || {};
    const bounds = currentBlockEnergyBounds();
    const inRegion = bounds ? rows.filter(row => row.be >= bounds.min && row.be <= bounds.max) : [];
    const energies = energiesForRows(inRegion);
    const assignments = Array.from(new Set(inRegion.map(row=>displayAssignment(row.assignment)).filter(Boolean)));
    const button = document.createElement('button');
    button.type='button';
    button.className='xv-db-row xv-compound-row xv-expected-compound-row';
    button.classList.toggle('is-pinned', pinnedCompounds.has(compound));
    const context = assignments.length ? `${assignments.join(', ')}${energies.length ? ' · '+energies.join(' · ')+' eV' : ''}` : 'No reported line in this energy region';
    button.innerHTML = `<span class="xv-db-primary">${compound}</span><span class="xv-db-energy">${context}</span>`;
    button.addEventListener('click',()=>{
      if (pinnedCompounds.has(compound)) { pinnedCompounds.delete(compound); expandedPinnedCompounds.delete(compound); }
      else { pinnedCompounds.add(compound); }
      renderCoreExplorer(); renderSpectrum();
    });
    return button;
  }

  function energyWindowBounds() {
    if (!energyWindow.active || !Number.isFinite(energyWindow.center) || !Number.isFinite(energyWindow.halfWidth)) return null;
    return { min: energyWindow.center-energyWindow.halfWidth, max: energyWindow.center+energyWindow.halfWidth };
  }

  function coreEnergyWindowRows() {
    const bounds=energyWindowBounds(); if(!bounds) return [];
    return uniqueBy(
      compoundData.filter(row=>row.be>=bounds.min && row.be<=bounds.max),
      row => `${row.compound}|${row.coreLevel}|${normalizeSearch(row.assignment)}`
    ).sort((a,b)=>b.be-a.be || a.coreLevel.localeCompare(b.coreLevel));
  }

  function renderCoreExplorer() {
    if (!databaseList || !currentBlock || currentBlock.type !== 'core') { if(databaseContext) databaseContext.hidden=true; return; }
    if (databaseContext) { databaseContext.textContent = `· ${currentSample || ''} · ${normalizedBlockName(currentBlock)}`; databaseContext.hidden=false; }
    updateCalibrationUI();
    databaseList.innerHTML='';
    const bounds=energyWindowBounds();
    if (bounds) {
      const rows=coreEnergyWindowRows();
      if (databaseHint) databaseHint.textContent=`${bounds.min.toFixed(1)}–${bounds.max.toFixed(1)} eV · ${rows.length} reference ${rows.length===1?'line':'lines'}`;
      if (databaseSummary) databaseSummary.textContent='';
      if (databaseClickHint) databaseClickHint.hidden=false;
      databaseList.appendChild(makeDatabaseHeader(['Compound','Peak assignment','BE']));
      rows.forEach(row=>{
        const button=document.createElement('button'); button.type='button'; button.className='xv-db-row xv-compound-row';
        button.classList.toggle('is-pinned',pinnedCompounds.has(row.compound));
        button.innerHTML=`<span class="xv-db-primary">${row.compound}</span><span class="xv-db-name">${displayAssignment(row.assignment)||row.coreLevel||'—'}</span><span class="xv-db-energy">${row.be.toFixed(1)} eV</span>`;
        button.addEventListener('click',()=>{ if(pinnedCompounds.has(row.compound)) pinnedCompounds.delete(row.compound); else pinnedCompounds.add(row.compound); renderCoreExplorer(); renderSpectrum(); });
        databaseList.appendChild(button);
      });
      if(!rows.length){ const e=document.createElement('div'); e.className='xv-database-empty'; e.textContent='No curated reference line falls inside this energy window.'; databaseList.appendChild(e); }
    } else {
      const results=compoundSearchResults();
      if (databaseHint) databaseHint.textContent=`${results.length} ${results.length===1?'compound':'compounds'}`;
      if (databaseSummary) databaseSummary.textContent='';
      if (databaseClickHint) databaseClickHint.hidden=false;
      const expectedHeader = makeDatabaseHeader(['Compound','Lines in current energy region']); expectedHeader.classList.add('xv-expected-db-header'); databaseList.appendChild(expectedHeader);
      results.forEach(([compound,rows])=>databaseList.appendChild(makeExpectedCompoundRow(compound,rows)));
      if(!results.length){ const e=document.createElement('div'); e.className='xv-database-empty'; e.textContent='No compound matches this search.'; databaseList.appendChild(e); }
    }
    renderPinnedCompounds();
  }

  /*
   * Shared VAMAS parser adapter.
   * assets/vamas.js owns the VAMAS syntax. This tool only normalizes blocks into
   * binding-energy points and classifies them for the identification interface.
   * Block ID stays independent from species + transition (e.g. Pr:C1s -> C 1s).
   */
  function parseVamas(text, fileName = '') {
    if (!window.XPSVamas || typeof window.XPSVamas.parseVamas !== 'function') {
      throw new Error('Shared VAMAS parser is not available.');
    }
    const meta = window.XPSVamas.parseVamas(text, fileName);
    const blocks = (meta.blocks || []).map((block, index) => {
      const photonEnergy = Number(block.sourceEnergy);
      const sourceX = Array.isArray(block.x) ? block.x : [];
      const signal = Array.isArray(block.data?.[0]) ? block.data[0] : [];
      const axisLabel = String(block.xLabel || '');
      const points = [];
      const count = Math.min(sourceX.length, signal.length);
      for (let i = 0; i < count; i++) {
        const rawX = Number(sourceX[i]);
        const y = Number(signal[i]);
        if (!Number.isFinite(rawX) || !Number.isFinite(y)) continue;
        const x = /kinetic/i.test(axisLabel) && Number.isFinite(photonEnergy) ? photonEnergy - rawX : rawX;
        if (Number.isFinite(x)) points.push({ x, y });
      }
      const energies = points.map(point => point.x);
      const span = energies.length ? Math.abs(Math.max(...energies) - Math.min(...energies)) : 0;
      const blockId = String(block.name || '').trim();
      const sampleId = String(block.sample || '').trim() || 'Unspecified sample';
      let species = String(block.species || '').trim();
      let transition = String(block.transition || '').trim();
      const blockIdLower = blockId.toLowerCase();
      let speciesLower = species.toLowerCase();
      const isSurvey = blockIdLower.includes('survey') || ['wide', 'survey'].includes(speciesLower) || span >= 400;
      // Some exporters put e.g. "Na1s" / "Sb3d" in species or block ID and leave
      // transition as "none". Recover element + orbital before classifying the block.
      if (!isSurvey && (!transition || transition.toLowerCase() === 'none' || !/^[A-Z][a-z]?$/.test(species))) {
        const candidates = [species, blockId].filter(Boolean);
        for (const candidate of candidates) {
          const compact = String(candidate).replace(/^Pr[:_ -]*/i,'').replace(/\s+/g,'');
          const m = compact.match(/^([A-Z][a-z]?)([1-9][spdf](?:\d\/2)?)$/i);
          if (m) {
            species = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
            transition = m[2].toLowerCase();
            break;
          }
        }
        speciesLower = species.toLowerCase();
      }
      const isCore = !isSurvey && /^[A-Z][a-z]?$/.test(species) && transition && transition.toLowerCase() !== 'none' && /^[1-9][spdf](?:\d\/2)?$/i.test(transition);
      const type = isSurvey ? 'survey' : (isCore ? 'core' : 'other');
      const dp = Array.isArray(block.dateParts) ? block.dateParts : [];
      return {
        index,
        blockId,
        sampleId,
        year: Number(dp[0]) || 0,
        month: Number(dp[1]) || 0,
        day: Number(dp[2]) || 0,
        hour: Number(dp[3]) || 0,
        minute: Number(dp[4]) || 0,
        second: Number(dp[5]) || 0,
        gmtOffset: Number(dp[6]) || 0,
        technique: String(block.tech || ''),
        comments: Array.isArray(block.comments) ? block.comments.slice() : [],
        sourceLabel: String(block.sourceLabel || ''),
        photonEnergy,
        species,
        transition,
        axisLabel,
        axisUnit: String(block.xUnit || ''),
        axisStart: Number(block.xStart),
        axisStep: Number(block.xStep),
        variableLabels: Array.isArray(block.corVars) ? block.corVars.map(v => ({ label: v?.[0] || '', unit: v?.[1] || '' })) : [],
        signalMode: String(block.signalMode || ''),
        dwellTime: Number(block.collectionTime),
        scans: Number(block.scans),
        points,
        span,
        type,
        rawBlock: block
      };
    }).filter(block => block.points.length);
    if (!blocks.length) throw new Error('No readable spectra were found in this VAMAS file.');
    return { meta, blocks };
  }

  function firstFreeColourIndex() {
    const used = new Set(colourAssignments.values());
    for (let i = 0; i < palette.length; i++) if (!used.has(i)) return i;
    return -1;
  }
  function colourFor(element) {
    const idx = colourAssignments.get(element);
    return idx === undefined ? palette[0] : palette[idx];
  }
  function toggleElement(element) {
    if (!currentBlock || currentBlock.type !== "survey") return;
    const idx = selectedElements.indexOf(element);
    if (idx >= 0) {
      selectedElements.splice(idx, 1);
      colourAssignments.delete(element);
    } else {
      if (selectedElements.length >= maxSelected) {
        if (autoSummary) {
          autoSummary.hidden = false;
          autoSummary.textContent = 'Maximum 6 elements.';
          window.setTimeout(() => {
            autoSummary.hidden = true;
            autoSummary.textContent = '';
          }, 1200);
        }
        return;
      }
      selectedElements.push(element);
      colourAssignments.set(element, firstFreeColourIndex());
    }
    updatePeriodicSelection();
    renderSpectrum();
  }
  function clearElements() {
    selectedElements.length = 0;
    colourAssignments.clear();
    updatePeriodicSelection();
    renderSpectrum();
  }
  function updatePeriodicSelection() {
    const suggested = new Set(autoCandidates.map(item => item.element));
    root.querySelectorAll("[data-element]").forEach(button => {
      const element = button.dataset.element;
      const selected = selectedElements.includes(element);
      button.classList.toggle("xv-element-selected", selected);
      button.classList.toggle("xv-element-candidate", identificationMode === "auto" && suggested.has(element));
      if (selected) button.style.setProperty("--xv-element-color", colourFor(element));
      else button.style.removeProperty("--xv-element-color");
    });
    clearElementsButton.disabled = selectedElements.length === 0;
  }

  function sourceForBlock(block) {
    const source = String(block && block.sourceLabel || "").toLowerCase();
    if (source.includes("mg")) return sourceDefinitions.mg;
    if (source.includes("al")) return sourceDefinitions.al;
    if (block && Number.isFinite(block.photonEnergy)) {
      const dAl = Math.abs(block.photonEnergy - sourceDefinitions.al.photonEnergy);
      const dMg = Math.abs(block.photonEnergy - sourceDefinitions.mg.photonEnergy);
      return dAl <= dMg ? sourceDefinitions.al : sourceDefinitions.mg;
    }
    return sourceDefinitions.al;
  }

  function removeAggregateLines(lines) {
    const transitions = new Set(lines.map(item => item.transition));
    return lines.filter(item => {
      const match = String(item.transition).match(/^(\d+)([pdf])$/i);
      if (!match) return true;
      const shell = match[1], orbital = match[2].toLowerCase();
      const split = orbital === "p" ? [`${shell}p1`,`${shell}p3`,`${shell}p1/2`,`${shell}p3/2`] :
        orbital === "d" ? [`${shell}d3`,`${shell}d5`,`${shell}d3/2`,`${shell}d5/2`] :
        orbital === "f" ? [`${shell}f5`,`${shell}f7`,`${shell}f5/2`,`${shell}f7/2`] : [];
      return !split.some(t => transitions.has(t));
    });
  }

  function getXPSLines(element, sourceInfo) {
    const candidates = rawData.filter(item => item.element === element && String(item.lineType).toLowerCase() === "xps" && String(item.energyType).toUpperCase() === "BE");
    const map = new Map();
    candidates.forEach(item => {
      let priority = 0;
      if (item.library === sourceInfo.scofieldLibrary) priority = 3;
      else if (item.source === sourceInfo.xraySource) priority = 2;
      if (!priority) return;
      const current = map.get(item.transition);
      if (!current || priority > current.priority) map.set(item.transition, { ...item, priority });
    });
    return removeAggregateLines(Array.from(map.values())).map(item => ({ ...item, bindingEnergy: item.energy, sensitivity: cleanSensitivity(item.sensitivity) }));
  }

  function getAugerLines(element, sourceInfo, photonEnergy) {
    const candidates = rawData.filter(item => item.element === element && String(item.lineType).toLowerCase() === "auger" && String(item.energyType).toUpperCase() === "KE");
    const map = new Map();
    candidates.forEach(item => {
      let priority = 0;
      if (item.source === sourceInfo.xraySource) priority = 4;
      else if (item.library === "AUGQNT") priority = 3;
      else if (item.source === "Any") priority = 1;
      if (!priority) return;
      const current = map.get(item.transition);
      if (!current || priority > current.priority) map.set(item.transition, { ...item, priority });
    });
    const hv = Number.isFinite(photonEnergy) ? photonEnergy : sourceInfo.photonEnergy;
    return Array.from(map.values()).map(item => ({ ...item, bindingEnergy: hv - item.energy, sensitivity: cleanSensitivity(item.sensitivity) })).filter(item => Number.isFinite(item.bindingEnergy));
  }

  function referenceLinesForCurrentBlock() {
    if (!currentBlock || currentBlock.type !== "survey") return [];
    const sourceInfo = sourceForBlock(currentBlock);
    let lines = [];
    selectedElements.forEach(element => {
      const elementColour = colourFor(element);
      lines.push(...getXPSLines(element, sourceInfo).map(item => ({ ...item, elementColour })));
      lines.push(...getAugerLines(element, sourceInfo, currentBlock.photonEnergy).map(item => ({ ...item, elementColour })));
    });
    if (lineFilter !== "both") lines = lines.filter(item => String(item.lineType).toLowerCase() === lineFilter);
    return lines.filter(item => Number.isFinite(item.bindingEnergy));
  }

  function allReferenceLinesForElement(element) {
    if (!currentBlock || currentBlock.type !== "survey") return [];
    const sourceInfo = sourceForBlock(currentBlock);
    let lines = [
      ...getXPSLines(element, sourceInfo),
      ...getAugerLines(element, sourceInfo, currentBlock.photonEnergy)
    ];
    if (lineFilter !== "both") lines = lines.filter(item => String(item.lineType).toLowerCase() === lineFilter);
    return lines.filter(item => Number.isFinite(item.bindingEnergy));
  }

  function median(values) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function percentile(values, fraction) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const position = Math.max(0, Math.min(sorted.length - 1, fraction * (sorted.length - 1)));
    const low = Math.floor(position), high = Math.ceil(position);
    if (low === high) return sorted[low];
    const weight = position - low;
    return sorted[low] * (1 - weight) + sorted[high] * weight;
  }

  function detectSurveyPeaks(points) {
    if (!points || points.length < 15) return [];
    const ys = points.map(point => point.y);
    const smooth = ys.slice();
    // Small triangular smoothing: enough to suppress point noise without moving survey maxima.
    for (let i = 2; i < ys.length - 2; i++) {
      smooth[i] = (ys[i - 2] + 2 * ys[i - 1] + 3 * ys[i] + 2 * ys[i + 1] + ys[i + 2]) / 9;
    }

    const differences = [];
    for (let i = 1; i < smooth.length; i++) differences.push(Math.abs(smooth[i] - smooth[i - 1]));
    const diffMedian = median(differences);
    const diffMAD = median(differences.map(value => Math.abs(value - diffMedian)));
    const noise = 1.4826 * diffMAD;
    const signalRange = Math.max(1e-12, percentile(smooth, 0.98) - percentile(smooth, 0.05));
    const minProminence = Math.max(noise * 4, signalRange * 0.012);
    const radius = 7;
    const raw = [];

    for (let i = radius; i < smooth.length - radius; i++) {
      if (!(smooth[i] >= smooth[i - 1] && smooth[i] > smooth[i + 1])) continue;
      let leftMin = Infinity, rightMin = Infinity;
      for (let j = i - radius; j < i; j++) leftMin = Math.min(leftMin, smooth[j]);
      for (let j = i + 1; j <= i + radius; j++) rightMin = Math.min(rightMin, smooth[j]);
      const prominence = smooth[i] - Math.max(leftMin, rightMin);
      if (prominence >= minProminence) raw.push({ index: i, x: points[i].x, y: points[i].y, smoothY: smooth[i], prominence });
    }

    // Keep the strongest maximum when two candidates are only a few eV apart.
    raw.sort((a, b) => b.prominence - a.prominence);
    const kept = [];
    raw.forEach(candidate => {
      if (kept.every(existing => Math.abs(existing.x - candidate.x) >= 4)) kept.push(candidate);
    });
    return kept.slice(0, 40).sort((a, b) => b.x - a.x);
  }

  function autoXpsLinesForElement(element) {
    if (!currentBlock || currentBlock.type !== "survey") return [];
    const sourceInfo = sourceForBlock(currentBlock);
    const allX = displayPointsForBlock(currentBlock).map(point => point.x);
    const minBE = Math.min(...allX) - autoMaxShiftEV;
    const maxBE = Math.max(...allX) + autoMaxShiftEV;
    let refs = getXPSLines(element, sourceInfo)
      .filter(item => Number.isFinite(item.bindingEnergy))
      .filter(item => item.bindingEnergy >= minBE && item.bindingEnergy <= maxBE)
      .filter(item => Number.isFinite(item.sensitivity) && item.sensitivity > 0);
    if (!refs.length) return [];
    const maxSensitivity = Math.max(...refs.map(item => item.sensitivity), 1e-12);
    refs = refs
      .map(item => ({ ...item, relativeSensitivity: item.sensitivity / maxSensitivity }))
      .filter(item => item.relativeSensitivity >= 0.035)
      .sort((a, b) => b.relativeSensitivity - a.relativeSensitivity);
    // Enough lines to check coherence without rewarding heavy elements simply
    // because their libraries contain many weak transitions.
    return refs.slice(0, 7);
  }

  function autoAugerLinesForElement(element) {
    if (!currentBlock || currentBlock.type !== "survey") return [];
    const sourceInfo = sourceForBlock(currentBlock);
    const allX = displayPointsForBlock(currentBlock).map(point => point.x);
    const minBE = Math.min(...allX) - autoMaxShiftEV;
    const maxBE = Math.max(...allX) + autoMaxShiftEV;
    let refs = getAugerLines(element, sourceInfo, currentBlock.photonEnergy)
      .filter(item => Number.isFinite(item.bindingEnergy))
      .filter(item => item.bindingEnergy >= minBE && item.bindingEnergy <= maxBE)
      .filter(item => Number.isFinite(item.sensitivity) && item.sensitivity > 0);
    if (!refs.length) return [];
    const maxSensitivity = Math.max(...refs.map(item => item.sensitivity), 1e-12);
    return refs
      .map(item => ({ ...item, relativeSensitivity: item.sensitivity / maxSensitivity }))
      .filter(item => item.relativeSensitivity >= 0.10)
      .sort((a, b) => b.relativeSensitivity - a.relativeSensitivity)
      .slice(0, 5);
  }

  function nearestPeakForPosition(peaks, target, tolerance, usedIndices = null, allowUsed = false) {
    let best = null;
    peaks.forEach((peak, index) => {
      if (!allowUsed && usedIndices && usedIndices.has(index)) return;
      const distance = Math.abs(peak.x - target);
      if (distance > tolerance) return;
      if (!best || distance < best.distance) best = { peak, index, distance };
    });
    return best;
  }

  function spinOrbitalKey(transition) {
    const match = String(transition || "").match(/^(\d+[pdf])(?:[1357](?:\/2)?)$/i);
    return match ? match[1].toLowerCase() : null;
  }

  function buildDiagnosticGroups(xpsRefs) {
    const principal = xpsRefs.filter(ref => ref.relativeSensitivity >= 0.20);
    const groups = [];
    const used = new Set();

    principal.forEach((ref, index) => {
      if (used.has(index)) return;
      const key = spinOrbitalKey(ref.transition);
      const members = [ref];
      used.add(index);

      if (key) {
        principal.forEach((other, otherIndex) => {
          if (used.has(otherIndex) || spinOrbitalKey(other.transition) !== key) return;
          // Collapse only doublets that a survey is unlikely to resolve. Large
          // splittings (Ni 2p, U 4f, Ce 3d...) remain independent requirements.
          const minEnergy = Math.min(...members.map(item => item.bindingEnergy), other.bindingEnergy);
          const maxEnergy = Math.max(...members.map(item => item.bindingEnergy), other.bindingEnergy);
          if (maxEnergy - minEnergy <= autoUnresolvedGroupEV) {
            members.push(other);
            used.add(otherIndex);
          }
        });
      }

      members.sort((a, b) => b.relativeSensitivity - a.relativeSensitivity);
      groups.push({
        key: key || `${ref.transition}|${ref.id}`,
        members,
        anchor: members[0],
        combinedSensitivity: members.reduce((sum, item) => sum + item.relativeSensitivity, 0),
        maxRelativeSensitivity: Math.max(...members.map(item => item.relativeSensitivity))
      });
    });

    return groups.sort((a, b) => b.combinedSensitivity - a.combinedSensitivity);
  }

  function nearestPeakForGroup(peaks, group, shift, tolerance, usedIndices = null) {
    // For an unresolved spin-orbit group, use the strongest component as the
    // diagnostic energy anchor. Allowing the weaker component to choose a
    // different maximum can artificially manufacture a coherent shift (e.g.
    // a false As 3p match). The whole group is still displayed later.
    const ref = group.anchor;
    const hit = nearestPeakForPosition(peaks, ref.bindingEnergy + shift, tolerance, usedIndices, false);
    return hit ? { ...hit, matchedRef: ref } : null;
  }

  function shiftCoherence(groupMatches) {
    if (!groupMatches.length) return null;

    const entries = groupMatches.map(match => ({
      shift: match.peak.x - match.ref.bindingEnergy,
      weight: Math.sqrt(Math.max(0.05, match.group.combinedSensitivity))
    }));
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    const commonShift = totalWeight > 0
      ? entries.reduce((sum, entry) => sum + entry.shift * entry.weight, 0) / totalWeight
      : entries[0].shift;
    const shifts = entries.map(entry => entry.shift);
    const minShift = Math.min(...shifts);
    const maxShift = Math.max(...shifts);
    const span = maxShift - minShift;
    const meanAbsDeviation = totalWeight > 0
      ? entries.reduce((sum, entry) => sum + Math.abs(entry.shift - commonShift) * entry.weight, 0) / totalWeight
      : 0;

    // A genuine global charge/calibration offset can be large, but all principal
    // lines should move in the same direction. Large positive AND negative shifts
    // are therefore a strong contradiction (typical false candidate on a survey).
    const oppositeDirections = entries.length >= 2 &&
      minShift < -autoOppositeShiftEV && maxShift > autoOppositeShiftEV;

    // Also reject a very broad set of individual shifts even when all happen to
    // lie on one side of zero. This is intentionally much looser than a ±1 eV rule.
    const excessiveDispersion = entries.length >= 2 &&
      span > autoShiftSpanRejectEV && meanAbsDeviation > 1.0;

    const coherence = Math.exp(-0.28 * meanAbsDeviation) *
      Math.exp(-0.08 * Math.max(0, span - 1.5));

    return {
      ok: !oppositeDirections && !excessiveDispersion,
      commonShift,
      minShift,
      maxShift,
      span,
      meanAbsDeviation,
      coherence,
      oppositeDirections,
      excessiveDispersion
    };
  }

  function intensityConsistency(groupMatches) {
    // Compare local peak prominence, not absolute counts. Prominence is a much
    // better survey-level proxy because the background changes strongly across BE.
    if (groupMatches.length < 2) return 0.72;
    let weighted = 0;
    let totalWeight = 0;

    for (let i = 0; i < groupMatches.length; i++) {
      for (let j = i + 1; j < groupMatches.length; j++) {
        const a = groupMatches[i], b = groupMatches[j];
        const theoryRatio = a.group.combinedSensitivity / Math.max(1e-12, b.group.combinedSensitivity);
        const expRatio = a.peak.prominence / Math.max(1e-12, b.peak.prominence);
        if (!(theoryRatio > 0) || !(expRatio > 0)) continue;
        const logError = Math.abs(Math.log(expRatio / theoryRatio));
        // Deliberately soft: ~factor 2 is acceptable, ~factor 4 is suspicious,
        // and a gross inversion of strong/weak peaks should reject the candidate.
        const agreement = Math.exp(-0.75 * logError);
        const weight = Math.sqrt(a.group.combinedSensitivity * b.group.combinedSensitivity);
        weighted += agreement * weight;
        totalWeight += weight;
      }
    }
    return totalWeight > 0 ? weighted / totalWeight : 0.72;
  }

  function evaluateElementAtShift(element, xpsRefs, augerRefs, peaks, shift) {
    const diagnosticGroups = buildDiagnosticGroups(xpsRefs);
    if (!diagnosticGroups.length) return null;

    const used = new Set();
    const groupMatches = [];

    diagnosticGroups.forEach(group => {
      const hit = nearestPeakForGroup(peaks, group, shift, autoMatchToleranceEV, used);
      if (!hit) return;
      used.add(hit.index);
      groupMatches.push({
        group,
        ref: hit.matchedRef || group.anchor,
        peak: hit.peak,
        peakIndex: hit.index,
        distance: hit.distance,
        shiftedEnergy: (hit.matchedRef || group.anchor).bindingEnergy + shift
      });
    });

    if (!groupMatches.length) return null;

    const shiftStats = shiftCoherence(groupMatches);
    if (!shiftStats || !shiftStats.ok) return null;
    const commonShift = shiftStats.commonShift;

    // Refine the display/matching distances around the common shift inferred from
    // all principal lines rather than keeping the single seed hypothesis.
    groupMatches.forEach(match => {
      match.shiftedEnergy = match.ref.bindingEnergy + commonShift;
      match.distance = Math.abs(match.peak.x - match.shiftedEnergy);
    });

    const matchedGroups = new Set(groupMatches.map(match => match.group.key));
    const strongestGroup = diagnosticGroups[0];
    if (!matchedGroups.has(strongestGroup.key)) return null;

    const totalDiagnosticWeight = diagnosticGroups.reduce(
      (sum, group) => sum + Math.sqrt(group.combinedSensitivity), 0
    );
    const matchedDiagnosticWeight = groupMatches.reduce((sum, match) => {
      const distanceFactor = Math.max(0, 1 - match.distance / autoMatchToleranceEV);
      return sum + Math.sqrt(match.group.combinedSensitivity) * (0.80 + 0.20 * distanceFactor);
    }, 0);
    const majorCoverage = totalDiagnosticWeight > 0
      ? matchedDiagnosticWeight / totalDiagnosticWeight
      : 0;

    // A missing principal feature is a near-elimination criterion. Components
    // closer than autoUnresolvedGroupEV count as one survey feature; well-separated
    // doublets remain separate and must both be present.
    const requiredGroups = diagnosticGroups.filter(group => group.maxRelativeSensitivity >= 0.35);
    if (requiredGroups.length >= 2 && requiredGroups.some(group => !matchedGroups.has(group.key))) return null;
    if (diagnosticGroups.length >= 2 && majorCoverage < 0.80) return null;

    const intensity = intensityConsistency(groupMatches);
    if (groupMatches.length >= 2 && intensity < 0.48) return null;

    // Secondary XPS lines can reinforce an identification but are not required.
    const diagnosticIds = new Set(
      diagnosticGroups.flatMap(group => group.members.map(member => member.id))
    );
    const optionalRefs = xpsRefs.filter(ref => !diagnosticIds.has(ref.id));
    const optionalMatches = [];
    optionalRefs.forEach(ref => {
      const hit = nearestPeakForPosition(peaks, ref.bindingEnergy + commonShift, autoMatchToleranceEV, used, false);
      if (!hit) return;
      used.add(hit.index);
      optionalMatches.push({
        ref,
        peak: hit.peak,
        peakIndex: hit.index,
        distance: hit.distance,
        shiftedEnergy: ref.bindingEnergy + commonShift
      });
    });

    const matches = [
      ...groupMatches.map(match => ({
        ref: match.ref,
        peak: match.peak,
        peakIndex: match.peakIndex,
        distance: match.distance,
        shiftedEnergy: match.shiftedEnergy
      })),
      ...optionalMatches
    ];

    let augerBonus = 0;
    const augerMatches = [];
    if (lineFilter !== "xps" && augerRefs.length) {
      augerRefs.forEach(ref => {
        const hit = nearestPeakForPosition(peaks, ref.bindingEnergy + commonShift, autoAugerToleranceEV, null, true);
        if (!hit) return;
        const w = Math.sqrt(Math.max(0, ref.relativeSensitivity));
        augerBonus += 0.12 * w;
        augerMatches.push({
          ref,
          peak: hit.peak,
          peakIndex: hit.index,
          distance: hit.distance,
          shiftedEnergy: ref.bindingEnergy + commonShift
        });
      });
      augerBonus = Math.min(0.28, augerBonus);
    }

    const optionalBonus = Math.min(
      0.20,
      optionalMatches.reduce((sum, match) => sum + 0.08 * Math.sqrt(match.ref.relativeSensitivity), 0)
    );

    let score = 1.40 * majorCoverage + 0.45 * intensity + optionalBonus + augerBonus;
    if (groupMatches.length >= 2) score += 0.10;
    score += 0.18 * shiftStats.coherence;

    return {
      element,
      score,
      shift: commonShift,
      shiftSpan: shiftStats.span,
      shiftDispersion: shiftStats.meanAbsDeviation,
      coverage: majorCoverage,
      majorCoverage,
      intensity,
      diagnosticGroupCount: diagnosticGroups.length,
      matchedDiagnosticGroupCount: groupMatches.length,
      diagnosticMatches: groupMatches.map(match => ({
        ref: match.ref,
        peak: match.peak,
        peakIndex: match.peakIndex,
        distance: match.distance,
        shiftedEnergy: match.shiftedEnergy
      })),
      matches,
      augerMatches
    };
  }

  function scoreAutoCandidates(peaks) {
    if (!currentBlock || currentBlock.type !== "survey" || !peaks.length) return [];
    const scores = [];

    availableElements.forEach(element => {
      const xpsRefs = autoXpsLinesForElement(element);
      if (!xpsRefs.length) return;
      const augerRefs = autoAugerLinesForElement(element);
      // Build shift hypotheses from principal survey features. Unresolved
      // spin-orbit pairs use the strongest member as the position anchor.
      const diagnosticGroups = buildDiagnosticGroups(xpsRefs);
      const anchors = diagnosticGroups.length
        ? diagnosticGroups.slice(0, 4).map(group => group.anchor)
        : xpsRefs.filter(ref => ref.relativeSensitivity >= 0.18).slice(0, 4);
      const shifts = [];
      anchors.forEach(ref => {
        peaks.forEach(peak => {
          const shift = peak.x - ref.bindingEnergy;
          if (Math.abs(shift) <= autoMaxShiftEV) shifts.push(shift);
        });
      });
      if (!shifts.length) return;

      // De-duplicate almost identical hypotheses so the expensive matching is small.
      shifts.sort((a, b) => a - b);
      const uniqueShifts = [];
      shifts.forEach(shift => {
        if (!uniqueShifts.length || Math.abs(shift - uniqueShifts[uniqueShifts.length - 1]) > 0.35) uniqueShifts.push(shift);
      });

      let best = null;
      uniqueShifts.forEach(shift => {
        const result = evaluateElementAtShift(element, xpsRefs, augerRefs, peaks, shift);
        if (result && (!best || result.score > best.score)) best = result;
      });
      if (!best) return;

      // Preselect only candidates with coherent principal features. The user
      // still performs the final visual validation by displaying all lines.
      if (best.score >= 1.35 && best.majorCoverage >= 0.80) scores.push(best);
    });

    scores.sort((a, b) => b.score - a.score);

    // A single-line candidate is intrinsically ambiguous. Keep it when its
    // diagnostic maximum is unique, but suppress it when that SAME maximum is
    // already explained by a stronger, better-supported candidate (principal
    // XPS line, secondary XPS line, or Auger confirmation). This removes cases
    // such as Ne 1s landing on an F KLL maximum or B 1s landing on P 2s,
    // without discarding genuine isolated C 1s / O 1s signals.
    const accepted = [];
    scores.forEach(candidate => {
      const diagnostic = candidate.diagnosticMatches || [];
      const isSingleDiagnostic = candidate.diagnosticGroupCount === 1 && diagnostic.length === 1;
      if (!isSingleDiagnostic) {
        accepted.push(candidate);
        return;
      }

      const peakIndex = diagnostic[0].peakIndex;
      const explainedByStrongerCandidate = accepted.some(other => {
        if (other.score <= candidate.score + 0.03) return false;
        const otherEvidenceCount =
          (other.diagnosticMatches ? other.diagnosticMatches.length : 0) +
          Math.min(2, other.augerMatches ? other.augerMatches.length : 0) +
          Math.max(0, (other.matches ? other.matches.length : 0) - (other.diagnosticMatches ? other.diagnosticMatches.length : 0));
        if (otherEvidenceCount < 2) return false;
        return [...(other.matches || []), ...(other.augerMatches || [])]
          .some(match => match.peakIndex === peakIndex);
      });

      if (!explainedByStrongerCandidate) accepted.push(candidate);
    });

    return accepted.slice(0, 14);
  }

  function peakCandidatesForEnergy(energy) {
    if (identificationMode !== "auto" || !autoCandidates.length) return [];
    const candidates = [];
    autoCandidates.forEach(candidate => {
      [...candidate.matches, ...candidate.augerMatches].forEach(match => {
        if (Math.abs(match.peak.x - energy) > 0.6) return;
        candidates.push({
          ...match.ref,
          shiftedEnergy: match.shiftedEnergy,
          shift: candidate.shift,
          distance: match.distance
        });
      });
    });
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.slice(0, 10);
  }

  function setIdentificationMode(mode) {
    identificationMode = mode === 'auto' ? 'auto' : (mode === 'manual' ? 'manual' : null);
    modeButtons.forEach(button => button.classList.toggle('is-active', button.dataset.mode === identificationMode));
    if (identificationMode !== 'auto') {
      detectedPeaks = [];
      autoCandidates = [];
      autoSummary.hidden = true;
      autoSummary.textContent = '';
    }
    updatePeriodicSelection();
  }

  function updateAutoSummary() {
    autoSummary.textContent = '';
    autoSummary.hidden = true;
  }

  function runAutoIdentification() {
    if (!currentBlock || currentBlock.type !== "survey") return;
    // Auto mode always starts from a clean manual selection.
    selectedElements.length = 0;
    colourAssignments.clear();
    lineInfo.hidden = true;
    lineInfo.textContent = "";
    identificationMode = "auto";
    detectedPeaks = detectSurveyPeaks(displayPointsForBlock(currentBlock));
    autoCandidates = scoreAutoCandidates(detectedPeaks);
    modeButtons.forEach(button => button.classList.toggle("is-active", button.dataset.mode === "auto"));
    updateAutoSummary();
    updatePeriodicSelection();
    renderSpectrum();
  }

  function showDetectedPeakInfo(peak) {
    const candidates = peakCandidatesForEnergy(peak.x);
    lineInfo.hidden = false;
    lineInfo.style.setProperty("--xv-info-color", "#f59e0b");
    lineInfo.textContent = "";
    const title = document.createElement("div");
    title.textContent = `Detected peak — ${peak.x.toFixed(1)} eV`;
    lineInfo.appendChild(title);
    const values = document.createElement("div");
    if (!candidates.length) {
      values.textContent = "No transition from the current element preselection matches this maximum.";
    } else {
      values.textContent = candidates.map(candidate => {
        const label = String(candidate.lineType).toLowerCase() === "auger" ? (candidate.augerGroup || candidate.transition) : candidate.transition;
        const shiftText = Math.abs(candidate.shift) >= 0.05 ? `, Δ ${candidate.shift >= 0 ? "+" : ""}${candidate.shift.toFixed(1)} eV` : "";
        return `${candidate.element} ${label} (ref ${candidate.bindingEnergy.toFixed(1)} eV${shiftText})`;
      }).join(" · ");
    }
    lineInfo.appendChild(values);
  }

  function niceStep(range, targetTicks = 8) {
    if (!(range > 0)) return 1;
    const rough = range / targetTicks;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const fraction = rough / power;
    const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
    return nice * power;
  }

  function renderLegend() {
    legend.innerHTML = "";
    selectedElements.forEach(element => {
      const span = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.style.background = colourFor(element);
      span.appendChild(swatch);
      span.appendChild(document.createTextNode(element));
      legend.appendChild(span);
    });
  }

  function showReferenceInfo(item, currentRefs = []) {
    lineInfo.hidden = false;
    delete lineInfo.dataset.copyEnergy;
    delete lineInfo.dataset.copyContent;
    lineInfo.style.setProperty("--xv-info-color", item.elementColour);

    const isAuger = String(item.lineType).toLowerCase() === "auger";
    if (isAuger) {
      const groupName = item.augerGroup || item.transition;
      const members = currentRefs
        .filter(entry => String(entry.lineType).toLowerCase() === "auger")
        .filter(entry => entry.element === item.element && (entry.augerGroup || entry.transition) === groupName)
        .sort((a, b) => b.bindingEnergy - a.bindingEnergy);
      const energies = (members.length ? members : [item])
        .map(entry => entry.bindingEnergy)
        .filter(Number.isFinite);
      lineInfo.textContent = "";
      const augerTitle = document.createElement("div");
      augerTitle.textContent = `${item.element} ${groupName}`;
      const augerValues = document.createElement("div");
      augerValues.textContent = `${energies.map(value => value.toFixed(1)).join(" | ")} eV`;
      lineInfo.appendChild(augerTitle);
      lineInfo.appendChild(augerValues);
      lineInfo.dataset.copyContent = lineInfo.innerText.trim();
      return;
    }

    const transition = String(item.transition || "");
    const split = transition.match(/^(\d+[pdf])([1357]\/2)$/i);
    if (split) {
      const shell = split[1];
      const members = currentRefs
        .filter(entry => String(entry.lineType).toLowerCase() !== "auger")
        .filter(entry => entry.element === item.element)
        .filter(entry => new RegExp(`^${shell}[1357]\\/2$`, "i").test(String(entry.transition)))
        .sort((a, b) => b.bindingEnergy - a.bindingEnergy);
      if (members.length >= 2) {
        const suffixes = members.map(entry => String(entry.transition).slice(shell.length));
        const name = `${shell}${suffixes.join("-")}`;
        const energies = members.map(entry => entry.bindingEnergy);
        const deltaE = Math.abs(energies[0] - energies[energies.length - 1]);
        lineInfo.textContent = `${item.element} ${name} — ${energies.map(value => value.toFixed(1)).join(" | ")} eV | ΔE = ${deltaE.toFixed(1)} eV`;
        lineInfo.dataset.copyContent = lineInfo.innerText.trim();
        return;
      }
    }

    lineInfo.textContent = `${item.element} ${transition} — ${item.bindingEnergy.toFixed(1)} eV`;
    lineInfo.dataset.copyContent = lineInfo.innerText.trim();
  }

  function showCoreReferenceInfo(row) {
    if (!row || !lineInfo) return;
    lineInfo.hidden = false;
    delete lineInfo.dataset.copyEnergy;
    lineInfo.style.setProperty('--xv-info-color', 'var(--good)');
    const shortText = `${row.compound} · ${row.coreLevel} · ${displayAssignment(row.assignment) || '—'} · ${formatReferenceValue(row)}`;
    const fullText = [shortText];
    if (row.name && normalizeSearch(row.name) !== normalizeSearch(row.compound)) fullText.push(`Name: ${row.name}`);
    if (row.doi) fullText.push(`DOI: ${row.doi}`);
    if (row.reference && normalizeSearch(row.reference) !== normalizeSearch(row.doi)) fullText.push(`Reference: ${row.reference}`);
    lineInfo.textContent = shortText;
    lineInfo.dataset.copyContent = fullText.join('\n');
    lineInfo.title = 'Click to copy this reference';
  }

  function surveyReferenceRowsInWindow() {
    const bounds=energyWindowBounds(); if(!bounds || !currentBlock || currentBlock.type!=='survey') return [];
    const sourceInfo=sourceForBlock(currentBlock); const photon=Number.isFinite(currentBlock.photonEnergy)?currentBlock.photonEnergy:sourceInfo.photonEnergy;
    const refs=[];
    availableElements.forEach(element=>{
      if(lineFilter==='xps' || lineFilter==='both') getXPSLines(element,sourceInfo).forEach(ref=>refs.push({...ref,kind:'XPS'}));
      if(lineFilter==='auger' || lineFilter==='both') getAugerLines(element,sourceInfo,photon).forEach(ref=>refs.push({...ref,kind:'Auger'}));
    });
    return uniqueBy(refs.filter(ref=>ref.bindingEnergy>=bounds.min && ref.bindingEnergy<=bounds.max),ref=>`${ref.element}|${ref.kind}|${ref.transition}|${ref.bindingEnergy.toFixed(3)}`)
      .sort((a,b)=>b.bindingEnergy-a.bindingEnergy);
  }

  function renderEnergyWindowResults() {
    if(!surveyEnergyCard) return;
    const bounds=energyWindowBounds();
    const isSurvey=!!currentBlock && currentBlock.type==='survey';
    surveyEnergyCard.hidden=!(isSurvey && bounds);
    if(!isSurvey || !bounds) { if(currentBlock&&currentBlock.type==='core') renderCoreExplorer(); return; }
    const rows=surveyReferenceRowsInWindow();
    const db1=displayEnergyValue(bounds.min), db2=displayEnergyValue(bounds.max); const dlo=Math.min(db1,db2), dhi=Math.max(db1,db2);
    energySummary.textContent=`${dlo.toFixed(1)}–${dhi.toFixed(1)} eV ${displayEnergyUnit()} · ${rows.length} ${rows.length===1?'line':'lines'}`;
    energyResults.innerHTML='';
    rows.slice(0,60).forEach(row=>{
      const el=document.createElement('div'); el.className='xv-energy-result-row';
      const label=String(row.lineType).toLowerCase()==='auger'?(row.augerGroup||row.transition):row.transition;
      el.innerHTML=`<b>${row.element}</b><span>${label}${row.kind==='Auger'?' · Auger':''}</span><span>${displayEnergyValue(row.bindingEnergy).toFixed(1)} eV</span>`;
      energyResults.appendChild(el);
    });
    if(!rows.length){ const e=document.createElement('div'); e.className='xv-database-empty'; e.textContent='No reference transition in this window.'; energyResults.appendChild(e); }
  }

  function normalizeEnergyWindowForCurrentBlock(forceDefault=false) {
    if(!currentBlock || !currentBlock.points.length) return;
    const xs=displayPointsForBlock(currentBlock).map(p=>p.x).filter(Number.isFinite);
    if(!xs.length) return;
    const min=Math.min(...xs), max=Math.max(...xs), span=Math.max(0.1,max-min);
    const defaultHalf=currentBlock.type==='survey' ? Math.min(5, span*0.18) : Math.min(1, span*0.18);
    if(!Number.isFinite(energyWindow.center) || energyWindow.center<min || energyWindow.center>max) energyWindow.center=(min+max)/2;
    const maxHalf=Math.max(0.05,Math.min(span*0.45, Math.max(0.05, Math.min(energyWindow.center-min,max-energyWindow.center))));
    if(forceDefault || !Number.isFinite(energyWindow.halfWidth) || energyWindow.halfWidth<=0 || energyWindow.halfWidth>maxHalf){
      energyWindow.halfWidth=Math.max(0.05,Math.min(defaultHalf,maxHalf));
    }
  }

  function updateEnergyWindowButtons() {
    energyWindowToggles.forEach(button=>{
      button.classList.toggle('is-active',energyWindow.active);
      button.setAttribute('aria-pressed',String(energyWindow.active));
    });
    if(energyModeNote){
      const active = energyWindow.active && !!currentBlock;
      energyModeNote.hidden=!active;
      if(active) energyModeNote.textContent = currentBlock.type==='core'
        ? 'Energy-window mode active — the database is showing references inside the selected energy range.'
        : 'Energy-window mode active — reference XPS/Auger transitions inside the selected energy range are listed beside the survey.';
    }
  }

  function clearEnergyWindowForRegionChange() {
    if (!energyWindow.active && !energyWindowDrag) return;
    energyWindow.active = false;
    energyWindow.center = null;
    energyWindowDrag = null;
    updateEnergyWindowButtons();
  }

  function setEnergyWindowActive(active) {
    if (active && calibrationPickMode) setCalibrationPickMode(false);
    if (active && multiRegionMode) {
      // Energy Window is allowed only for a same-sample Core-level analysis.
      // Resolve a concrete visible core tile before initializing the window so
      // the overlay and database results are anchored to the same spectrum.
      if (isMultiSampleView() || analysisMode !== 'core') return;
      const visible = selectedMultiBlocks();
      let match = visible.find(item => item.block && `${item.sampleId || item.block.sampleId}|${regionKey(item.block)}` === activeMultiTileKey && item.block.type === 'core');
      if (!match) match = visible.find(item => item.block && item.block.type === 'core');
      if (!match || !match.block) return;
      currentSample = match.sampleId || match.block.sampleId || currentSample;
      currentBlock = match.block;
      activeMultiTileKey = `${currentSample}|${regionKey(currentBlock)}`;
    }
    energyWindow.active=!!active;
    if(energyWindow.active) normalizeEnergyWindowForCurrentBlock(true);
    updateEnergyWindowButtons();
    if (analysisMode === 'core') renderCoreExplorer();
    renderSpectrum();
  }

  function energyFromPointer(event) {
    if(!chartGeometry) return null;
    const rect=chart.getBoundingClientRect(); const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(1,rect.width)));
    const svgX=ratio*chartGeometry.width;
    const plotRatio=Math.max(0,Math.min(1,(svgX-chartGeometry.left)/Math.max(1,chartGeometry.plotWidth)));
    return chartGeometry.xMax-plotRatio*(chartGeometry.xMax-chartGeometry.xMin);
  }

  function renderSpectrum() {
    chart.innerHTML = "";
    lineInfo.hidden = true;
    updateMultiRegionButton();
    if (multiRegionMode) {
      chart.hidden = true;
      if (chartCard) chartCard.classList.add('is-multiview');
      if (chartHead) chartHead.hidden = true;
      if (multiregionView) { multiregionView.hidden = false; renderMultiRegionView(); }
      if (energyModeNote) energyModeNote.hidden = true;
      syncAnalysisColumnHeight();
      return;
    }
    if (!currentBlock || !currentBlock.points.length) return;
    if(energyWindow.active) normalizeEnergyWindowForCurrentBlock(false);
    updateEnergyWindowButtons();
    chart.hidden = false;
    if (chartCard) chartCard.classList.remove('is-multiview');
    if (chartHead) chartHead.hidden = false;
    if (multiregionView) multiregionView.hidden = true;

    const points = displayPointsForBlock(currentBlock);
    const allX = points.map(p => p.x);
    const fullMax = Math.max(...allX), fullMin = Math.min(...allX);
    if (!viewRange) viewRange = { min: fullMin, max: fullMax };
    viewRange.min = Math.max(fullMin, Math.min(viewRange.min, fullMax));
    viewRange.max = Math.min(fullMax, Math.max(viewRange.max, fullMin));
    if (viewRange.max - viewRange.min < Math.max(0.5, (fullMax - fullMin) / 500)) viewRange = { min: fullMin, max: fullMax };
    const xMin = viewRange.min, xMax = viewRange.max;
    const visiblePoints = points.filter(p => p.x >= xMin && p.x <= xMax);
    const drawPoints = visiblePoints.length >= 2 ? visiblePoints : points;
    const yValues = drawPoints.map(p => p.y);
    const yMaxRaw = Math.max(...yValues), yMinRaw = Math.min(...yValues);
    const yRange = Math.max(1e-12, yMaxRaw - yMinRaw);
    const yMin = Math.max(0, yMinRaw - 0.01 * yRange);
    const yMax = yMaxRaw + 0.05 * yRange;

    const width = 1120, height = 656;
    const margin = { top: 20, right: 18, bottom: 54, left: showCounts ? 66 : 26 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.setAttribute("width", width);
    chart.setAttribute("height", height);
    chart.setAttribute("preserveAspectRatio", "xMidYMin meet");

    const xScale = value => margin.left + ((xMax - value) / Math.max(1e-12, xMax - xMin)) * plotW;
    const yScale = value => margin.top + ((yMax - value) / Math.max(1e-12, yMax - yMin)) * plotH;
    chartGeometry = { width, height, left: margin.left, right: margin.right, plotWidth: plotW, xMin, xMax };

    const xStep = niceStep(xMax - xMin, 8);
    let xTick = Math.floor(xMax / xStep) * xStep;
    for (; xTick >= xMin - xStep * 0.05; xTick -= xStep) {
      if (xTick > xMax + xStep * 0.05) continue;
      const x = xScale(xTick);
      const grid = createSVG("line");
      grid.setAttribute("x1", x); grid.setAttribute("x2", x); grid.setAttribute("y1", margin.top); grid.setAttribute("y2", margin.top + plotH); grid.setAttribute("class", "xv-grid"); chart.appendChild(grid);
      const tick = createSVG("text"); tick.setAttribute("x", x); tick.setAttribute("y", margin.top + plotH + 20); tick.setAttribute("text-anchor", "middle"); tick.setAttribute("class", "xv-tick"); const shownTick=displayEnergyValue(xTick); tick.textContent = Number.isInteger(xStep) ? Math.round(shownTick) : shownTick.toFixed(1); chart.appendChild(tick);
    }

    for (let n = 0; n <= 5; n++) {
      const value = yMin + (yMax - yMin) * n / 5;
      const y = yScale(value);
      const grid = createSVG("line"); grid.setAttribute("x1", margin.left); grid.setAttribute("x2", margin.left + plotW); grid.setAttribute("y1", y); grid.setAttribute("y2", y); grid.setAttribute("class", "xv-grid"); chart.appendChild(grid);
      if (showCounts) {
        const tick = createSVG("text"); tick.setAttribute("x", margin.left - 10); tick.setAttribute("y", y + 4); tick.setAttribute("text-anchor", "end"); tick.setAttribute("class", "xv-tick"); tick.textContent = value >= 10000 ? value.toExponential(1) : Math.round(value).toString(); chart.appendChild(tick);
      }
    }

    const xAxis = createSVG("line"); xAxis.setAttribute("x1", margin.left); xAxis.setAttribute("x2", margin.left + plotW); xAxis.setAttribute("y1", margin.top + plotH); xAxis.setAttribute("y2", margin.top + plotH); xAxis.setAttribute("class", "xv-axis"); chart.appendChild(xAxis);
    if (showCounts) {
      const yAxis = createSVG("line"); yAxis.setAttribute("x1", margin.left); yAxis.setAttribute("x2", margin.left); yAxis.setAttribute("y1", margin.top); yAxis.setAttribute("y2", margin.top + plotH); yAxis.setAttribute("class", "xv-axis"); chart.appendChild(yAxis);
    }

    const xLabel = createSVG("text"); xLabel.setAttribute("x", margin.left + plotW / 2); xLabel.setAttribute("y", margin.top + plotH + 44); xLabel.setAttribute("text-anchor", "middle"); xLabel.setAttribute("class", "xv-axis-label"); xLabel.textContent = energyDisplayMode === "KE" ? "Kinetic energy (eV)" : "Binding energy (eV)"; chart.appendChild(xLabel);
    if (showCounts) {
      const yLabel = createSVG("text"); yLabel.setAttribute("x", 18); yLabel.setAttribute("y", margin.top + plotH / 2); yLabel.setAttribute("text-anchor", "middle"); yLabel.setAttribute("class", "xv-axis-label"); yLabel.setAttribute("transform", `rotate(-90 18 ${margin.top + plotH / 2})`); yLabel.textContent = currentBlock.variableLabels[0] && currentBlock.variableLabels[0].label ? currentBlock.variableLabels[0].label : "Intensity"; chart.appendChild(yLabel);
    }

    let d = "";
    drawPoints.forEach((p, idx) => { d += `${idx ? "L" : "M"}${xScale(p.x).toFixed(2)},${yScale(p.y).toFixed(2)} `; });
    const path = createSVG("path"); path.setAttribute("d", d.trim()); path.setAttribute("class", "xv-spectrum-path"); chart.appendChild(path);

    if (currentBlock.type === 'core') {
      const overlayRows = uniqueBy(
        rowsForSelectedDatabaseOverlay(),
        row => `${row.compound}|${row.coreLevel}|${normalizeSearch(row.assignment)}|${row.be.toFixed(3)}`
      ).filter(row => row.be >= xMin && row.be <= xMax);
      const overlayLabelCandidates = [];
      overlayRows.forEach(row => {
        const x = xScale(row.be);
        if (Number.isFinite(row.uncertainty) && row.uncertainty > 0) {
          const x1 = xScale(row.be + row.uncertainty);
          const x2 = xScale(row.be - row.uncertainty);
          const band = createSVG('rect');
          band.setAttribute('x', Math.min(x1, x2));
          band.setAttribute('y', margin.top);
          band.setAttribute('width', Math.max(1, Math.abs(x2 - x1)));
          band.setAttribute('height', plotH);
          band.setAttribute('class', 'xv-db-reference-band');
          chart.appendChild(band);
        }
        const ref = createSVG('line');
        ref.setAttribute('x1', x); ref.setAttribute('x2', x);
        ref.setAttribute('y1', margin.top); ref.setAttribute('y2', margin.top + plotH);
        ref.setAttribute('class', 'xv-db-reference-line');
        const pinned = pinnedCompounds.has(row.compound);
        if (pinned) ref.classList.add('is-pinned-ref');
        const showInfo = event => {
          event.stopPropagation();
          showCoreReferenceInfo(row);
        };
        ref.addEventListener('pointerdown', event => event.stopPropagation());
        ref.addEventListener('click', showInfo);
        chart.appendChild(ref);

        const hit = createSVG('line');
        hit.setAttribute('x1', x); hit.setAttribute('x2', x);
        hit.setAttribute('y1', margin.top); hit.setAttribute('y2', margin.top + plotH);
        hit.setAttribute('class', 'xv-db-reference-hit');
        hit.addEventListener('pointerdown', event => event.stopPropagation());
        hit.addEventListener('click', showInfo);
        chart.appendChild(hit);
        
        overlayLabelCandidates.push({
          x,
          row,
          assignment: displayAssignment(row.assignment) || '—',
          compound: row.compound,
          pinned,
          showInfo,
          title: `${row.coreLevel} · ${row.compound} · ${displayAssignment(row.assignment) || '—'} · ${formatReferenceValue(row)} · Click to view and copy`
        });
      });
      const usedX = [];
      overlayLabelCandidates.forEach(candidate => {
        const label = createSVG('text');
        label.setAttribute('x', candidate.x);
        let level = 0;
        while (usedX.some(item => Math.abs(item.x - candidate.x) < 52 && item.level === level) && level < 5) level++;
        usedX.push({ x: candidate.x, level });
        label.setAttribute('y', margin.top + 17 + level * 18);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'xv-db-reference-label');
        if (candidate.pinned) label.classList.add('is-pinned-ref');
        const t1=createSVG('tspan'); t1.setAttribute('x',candidate.x); t1.textContent=candidate.assignment; label.appendChild(t1);
        const t2=createSVG('tspan'); t2.setAttribute('x',candidate.x); t2.setAttribute('dy','14'); t2.setAttribute('class','xv-db-reference-sub'); t2.textContent=candidate.compound; label.appendChild(t2);
        const title = createSVG('title'); title.textContent = candidate.title; label.appendChild(title);
        label.addEventListener('pointerdown',event=>event.stopPropagation());
        label.addEventListener('click',candidate.showInfo);
        chart.appendChild(label);
      });
    }

    if (energyWindow.active && Number.isFinite(energyWindow.center)) {
      const bounds=energyWindowBounds();
      const positions=[
        {key:'left',value:bounds.max,edge:true},
        {key:'center',value:energyWindow.center,edge:false},
        {key:'right',value:bounds.min,edge:true}
      ];
      positions.forEach(pos=>{
        if(pos.value<xMin || pos.value>xMax) return;
        const x=xScale(pos.value);
        const line=createSVG('line'); line.setAttribute('x1',x); line.setAttribute('x2',x); line.setAttribute('y1',margin.top); line.setAttribute('y2',margin.top+plotH); line.setAttribute('class',pos.edge?'xv-energy-window-edge':'xv-energy-window-center'); chart.appendChild(line);
        const hit=createSVG('line'); hit.setAttribute('x1',x); hit.setAttribute('x2',x); hit.setAttribute('y1',margin.top); hit.setAttribute('y2',margin.top+plotH); hit.setAttribute('class','xv-energy-window-hit'); hit.dataset.energyHandle=pos.key; chart.appendChild(hit);
      });
      const lbl=createSVG('text'); lbl.setAttribute('x',xScale(energyWindow.center)); lbl.setAttribute('y',margin.top+14); lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('class','xv-energy-window-label'); lbl.textContent=`${displayEnergyValue(energyWindow.center).toFixed(1)} ± ${energyWindow.halfWidth.toFixed(1)} eV`; chart.appendChild(lbl);
    }

    renderEnergyWindowResults();

    if (identificationMode === "auto" && currentBlock.type === "survey") {
      detectedPeaks
        .filter(peak => peak.x >= xMin && peak.x <= xMax)
        .forEach(peak => {
          const x = xScale(peak.x), y = yScale(peak.y);
          const hit = createSVG("circle");
          hit.setAttribute("cx", x); hit.setAttribute("cy", y); hit.setAttribute("r", 11); hit.setAttribute("class", "xv-detected-hit");
          const dot = createSVG("circle");
          dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("r", 3.8); dot.setAttribute("class", "xv-detected-peak");
          const showPeak = event => { event.stopPropagation(); showDetectedPeakInfo(peak); };
          hit.addEventListener("pointerdown", event => event.stopPropagation());
          hit.addEventListener("click", showPeak);
          dot.addEventListener("pointerdown", event => event.stopPropagation());
          dot.addEventListener("click", showPeak);
          chart.appendChild(hit);
          chart.appendChild(dot);
        });
    }

    const refs = referenceLinesForCurrentBlock().filter(item => item.bindingEnergy >= xMin && item.bindingEnergy <= xMax);
    const sensitivities = refs.map(item => item.sensitivity).filter(v => Number.isFinite(v) && v > 0);
    const maxSensitivity = sensitivities.length ? Math.max(...sensitivities) : 1;
    const labelCandidates = [];
    const augerLabelGroups = new Map();

    refs.forEach(item => {
      const x = xScale(item.bindingEnergy);
      const relative = Number.isFinite(item.sensitivity) && item.sensitivity > 0 ? item.sensitivity / maxSensitivity : 0.12;
      const markerLength = Math.max(38, Math.min(plotH * 0.50, 42 + relative * plotH * 0.39));
      const line = createSVG("line");
      line.setAttribute("x1", x); line.setAttribute("x2", x); line.setAttribute("y1", margin.top); line.setAttribute("y2", margin.top + markerLength);
      line.setAttribute("class", "xv-reference-line"); line.style.stroke = item.elementColour;

      const hit = createSVG("line");
      hit.setAttribute("x1", x); hit.setAttribute("x2", x); hit.setAttribute("y1", margin.top); hit.setAttribute("y2", margin.top + markerLength);
      hit.setAttribute("class", "xv-reference-hit");
      const showInfo = event => { event.stopPropagation(); showReferenceInfo(item, refs); };
      line.addEventListener("pointerdown", event => event.stopPropagation());
      line.addEventListener("click", showInfo);
      hit.addEventListener("pointerdown", event => event.stopPropagation());
      hit.addEventListener("click", showInfo);
      chart.appendChild(line);
      chart.appendChild(hit);
      if (String(item.lineType).toLowerCase() === 'auger') {
        const groupName = item.augerGroup || item.transition;
        const key = `${item.element}|${groupName}`;
        if (!augerLabelGroups.has(key)) augerLabelGroups.set(key, []);
        augerLabelGroups.get(key).push({ item, x, y: margin.top + 15, colour: item.elementColour });
      } else {
        labelCandidates.push({ item, x, y: margin.top + 15, colour: item.elementColour });
      }
    });

    augerLabelGroups.forEach(candidates => {
      const energies = candidates.map(candidate => candidate.item.bindingEnergy);
      const center = (Math.min(...energies) + Math.max(...energies)) / 2;
      candidates.sort((a,b) => Math.abs(a.item.bindingEnergy-center) - Math.abs(b.item.bindingEnergy-center));
      labelCandidates.push(candidates[0]);
    });

    const placed = [];
    labelCandidates.sort((a,b) => a.x - b.x).forEach(candidate => {
      const text = createSVG("text");
      text.setAttribute("x", candidate.x); text.setAttribute("text-anchor", "middle"); text.setAttribute("class", "xv-reference-label"); text.style.fill = candidate.colour;
      text.textContent = String(candidate.item.lineType).toLowerCase() === "auger" ? (candidate.item.augerGroup || candidate.item.transition) : candidate.item.transition;
      chart.appendChild(text);
      let y = candidate.y;
      text.setAttribute("y", y);
      for (let attempt = 0; attempt < 9; attempt++) {
        const box = text.getBBox();
        const padded = { left: box.x - 4, right: box.x + box.width + 4, top: box.y - 2, bottom: box.y + box.height + 2 };
        const collision = placed.some(p => !(p.right < padded.left || p.left > padded.right || p.bottom < padded.top || p.top > padded.bottom));
        if (!collision) { placed.push(padded); break; }
        y += 18; text.setAttribute("y", y);
      }
      text.addEventListener("pointerdown", event => event.stopPropagation());
      text.addEventListener("click", event => { event.stopPropagation(); showReferenceInfo(candidate.item, refs); });
    });

    renderLegend();
    syncAnalysisColumnHeight();
  }

  function regionKey(block) {
    if (!block) return '';
    if (block.type === 'survey') return 'survey';
    if (block.type === 'core') return `core:${String(block.species||'').toLowerCase()}:${String(block.transition||'').toLowerCase()}`;
    return `other:${normalizedBlockName(block).toLowerCase()}`;
  }

  function findBlockByRegionKey(sampleId, key) {
    if (!parsedFile || !sampleId || !key) return null;
    return parsedFile.blocks.find(block => block.sampleId === sampleId && regionKey(block) === key) || null;
  }

  function orderedBlocksForSample(sampleId) {
    if (!parsedFile || !sampleId) return [];
    const rank = block => block.type === 'survey' ? 0 : (block.type === 'core' ? 1 : 2);
    return parsedFile.blocks
      .filter(block => block.sampleId === sampleId)
      .sort((a,b) => (rank(a)-rank(b)) || (a.index-b.index));
  }

  function selectedMultiBlocks() {
    return multiRegionMode ? displayedMultiRegionBlocks().filter(item => item.block) : [];
  }

  function analysisAllowed(mode) {
    if (!parsedFile) return false;
    if (!multiRegionMode) {
      if (!currentBlock) return false;
      return mode === 'survey' ? currentBlock.type === 'survey' : currentBlock.type === 'core';
    }
    const items = selectedMultiBlocks();
    if (!items.length) return false;
    // Multi-sample is deliberately comparison-only: no Survey or Core-level search state is propagated across samples.
    if (isMultiSampleView()) return false;
    // A same-sample multi-view may still use Core-level analysis as long as at least one displayed tile is a core level.
    // Survey analysis stays Single-view only, even when a Survey tile is present.
    if (mode === 'survey') return false;
    return items.some(item => item.block && item.block.type === 'core');
  }

  function resetAnalysisStateForNavigation() {
    selectedDatabaseAssignment = null;
    if (coreSearchInput) coreSearchInput.value = '';
    if (energyWindow.active) energyWindow.active = false;
    energyWindow.center = null;
    energyWindowDrag = null;
    setIdentificationMode(null);
    selectedElements.length = 0;
    colourAssignments.clear();
    updatePeriodicSelection();
    updateEnergyWindowButtons();
  }

  function updateAnalysisModeUI() {
    if (!analysisModeBar) return;
    analysisModeBar.hidden = !parsedFile;
    const blocks = currentSample ? orderedBlocksForSample(currentSample) : [];
    const hasSurvey = blocks.some(block => block.type === 'survey');
    const hasCore = blocks.some(block => block.type === 'core');
    analysisModeButtons.forEach(button => {
      const mode = button.dataset.analysisMode;
      let available = mode === 'survey' ? hasSurvey : hasCore;
      if (multiRegionMode) available = analysisAllowed(mode);
      button.disabled = !available;
      const active = analysisMode === mode && analysisAllowed(mode);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const showSurvey = analysisMode === 'survey' && analysisAllowed('survey');
    const showCore = analysisMode === 'core' && analysisAllowed('core');
    if (surveyCommandCard) surveyCommandCard.hidden = !showSurvey;
    if (surveyTools) surveyTools.hidden = !showSurvey;
    if (surveyEnergyCard && !showSurvey) surveyEnergyCard.hidden = true;
    if (corePlaceholder) corePlaceholder.hidden = !showCore;
    if (databaseContext && !showCore) databaseContext.hidden = true;
  }

  function setAnalysisMode(mode) {
    if (!parsedFile || !currentSample) return;
    if (multiRegionMode) {
      if (!analysisAllowed(mode)) return;
      const visible = selectedMultiBlocks();
      const match = visible.find(item => item.block && (mode === 'survey' ? item.block.type === 'survey' : item.block.type === 'core'));
      if (match && match.block) {
        currentSample = match.sampleId || match.block.sampleId || currentSample;
        currentBlock = match.block;
        activeMultiTileKey = `${currentSample}|${regionKey(currentBlock)}`;
      }
      analysisMode = mode;
      resetAnalysisStateForNavigation();
      updateAnalysisModeUI();
      if (mode === 'core') renderCoreExplorer();
      renderSpectrum();
      return;
    }
    const blocks = orderedBlocksForSample(currentSample);
    const target = mode === 'survey' ? blocks.find(block => block.type === 'survey') : blocks.find(block => block.type === 'core');
    if (!target) return;
    analysisMode = mode;
    if (!currentBlock || currentBlock.index !== target.index) {
      currentBlock = target;
      viewRange = null;
      renderBlockList();
    }
    resetAnalysisStateForNavigation();
    if (graphSampleTitle) graphSampleTitle.textContent = currentSample || 'Sample';
    if (blockTitle) blockTitle.textContent = normalizedBlockName(currentBlock);
    if (energyAxisToggle) {
      energyAxisToggle.hidden = currentBlock.type !== 'survey';
      energyAxisToggle.textContent = energyDisplayMode;
    }
    updateAnalysisModeUI();
    if (mode === 'core') renderCoreExplorer();
    renderSpectrum();
  }

  function normalizedBlockName(block) {
    if (block.type === "survey") return "Survey";
    if (block.type === "core") return `${block.species} ${block.transition}`.trim();
    if (block.species && block.species.toLowerCase() !== "none") return [block.species, block.transition].filter(Boolean).join(" ");
    return block.blockId || "Other block";
  }

  function updateStepperAvailability() {
    if (!parsedFile || !currentSample || !currentBlock) return;
    const sampleIndex = sampleOrder.indexOf(currentSample);
    const key = regionKey(currentBlock);
    const multiSamples = isMultiSampleView();
    const multiRegions = isMultiRegionView();

    const hasSampleInDirection = direction => {
      if (multiSamples) return false;
      if (multiRegionMode) {
        const next = sampleIndex + direction;
        return next >= 0 && next < sampleOrder.length;
      }
      for (let i=sampleIndex+direction; i>=0 && i<sampleOrder.length; i+=direction) {
        if (!key || findBlockByRegionKey(sampleOrder[i], key)) return true;
      }
      return false;
    };
    if (samplePrevButton) samplePrevButton.disabled = !hasSampleInDirection(-1);
    if (sampleNextButton) sampleNextButton.disabled = !hasSampleInDirection(1);

    const blocks = orderedBlocksForSample(currentSample);
    const idx = blocks.findIndex(block => block.index === currentBlock.index);
    const regionLocked = multiRegions;
    if (regionPrevButton) regionPrevButton.disabled = regionLocked || idx <= 0;
    if (regionNextButton) regionNextButton.disabled = regionLocked || idx < 0 || idx >= blocks.length-1;
  }

  function renderBlockList() {
    blockList.innerHTML = "";
    if (!parsedFile || !currentSample) return;
    const sampleBlocks = parsedFile.blocks.filter(block => block.sampleId === currentSample);
    const groups = [
      { type: "survey", label: "Survey" },
      { type: "core", label: "Core levels" },
      { type: "other", label: "Other" }
    ];
    groups.forEach(group => {
      const items = sampleBlocks.filter(block => block.type === group.type);
      if (!items.length) return;

      const groupNode = document.createElement("div");
      groupNode.className = "xv-block-group";
      const heading = document.createElement("div");
      heading.className = "xv-block-heading";
      heading.textContent = group.label;
      const buttons = document.createElement("div");
      buttons.className = "xv-block-buttons";
      groupNode.appendChild(heading);
      groupNode.appendChild(buttons);

      items.forEach(block => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "xv-block-button";
        const activeMultiKeys = multiRegionMode && multiRegionSource === 'manual' ? manualMultiRegionKeys : null;
        button.classList.toggle("is-active", activeMultiKeys ? activeMultiKeys.has(regionKey(block)) : (currentBlock && block.index === currentBlock.index));
        const name = document.createElement("span");
        name.className = "xv-block-name";
        name.textContent = normalizedBlockName(block);
        const raw = document.createElement("span");
        raw.className = "xv-block-id";
        raw.textContent = block.blockId && block.blockId !== normalizedBlockName(block) ? block.blockId : "";
        raw.title = block.blockId || "";
        button.appendChild(name);
        button.appendChild(raw);
        button.addEventListener("click", () => {
          if (multiRegionMode && multiRegionSource === 'manual') {
            clearEnergyWindowForRegionChange();
            const key = regionKey(block);
            if (isMultiSampleView()) {
              // Multi-sample = exactly one region. Clicking another region moves the whole comparison.
              manualMultiRegionKeys.clear();
              manualMultiRegionLabels.clear();
              manualMultiRegionKeys.add(key);
              manualMultiRegionLabels.set(key, normalizedBlockName(block));
            } else {
              if (manualMultiRegionKeys.has(key)) {
                if (manualMultiRegionKeys.size > 1) manualMultiRegionKeys.delete(key);
              } else {
                manualMultiRegionKeys.add(key);
                manualMultiRegionLabels.set(key, normalizedBlockName(block));
              }
              // As soon as several regions are selected, multi-sample selection is locked to the current sample.
              if (manualMultiRegionKeys.size > 1) { multiSampleIds.clear(); multiSampleIds.add(currentSample); }
            }
            currentBlock = block;
            activeMultiTileKey = `${currentSample}|${key}`;
            renderBlockList();
            renderSampleMenu();
            syncSamplePickerLabel();
            updateStepperAvailability();
            updateAnalysisModeUI();
            if (analysisMode && !analysisAllowed(analysisMode)) analysisMode = null;
            updateAnalysisModeUI();
            if (analysisMode === 'core' && block.type === 'core') renderCoreExplorer();
            renderSpectrum();
            return;
          }
          selectBlock(block);
        });
        buttons.appendChild(button);
      });
      blockList.appendChild(groupNode);
    });
    updateStepperAvailability();
  }

  function selectBlock(block, options = {}) {
    const preserveMulti = !!options.preserveMulti;
    if (!preserveMulti) {
      multiRegionMode = false;
      multiRegionSource = 'manual';
    }
    currentBlock = block;
    calibrationPickMode = false;
    calibrationPanelOpen = false;
    if (calibrationStrip) calibrationStrip.hidden = true;
    chart.classList.remove('is-calibrating');
    if (calibrationPickButton) calibrationPickButton.classList.remove('is-active');
    if (calibrationObserved) calibrationObserved.value = '';
    if (calibrationReference) calibrationReference.value = '';
    viewRange = null;
    resetViewButton.disabled = true;
    renderBlockList();
    if (graphSampleTitle) graphSampleTitle.textContent = currentSample || 'Sample';
    blockTitle.textContent = normalizedBlockName(block);
    const date = block.year
      ? `${String(block.day).padStart(2,"0")}/${String(block.month).padStart(2,"0")}/${block.year}`
      : '';
    const displayName = normalizedBlockName(block);
    const rawIdPart = block.blockId && block.blockId !== displayName ? `${block.blockId} · ` : "";
    if (blockMeta) blockMeta.textContent = '';
    updateFileMeta(date);
    const sourceInfo = sourceForBlock(block);
    const sourceName = sourceInfo === sourceDefinitions.al ? "Al Kα" : (sourceInfo === sourceDefinitions.mg ? "Mg Kα" : (block.sourceLabel || sourceInfo.label));
    if (sourceReadout) sourceReadout.textContent = `${sourceName}${Number.isFinite(block.photonEnergy) ? ` — ${block.photonEnergy.toFixed(2)} eV` : ""}`;
    if (analysisMode && !analysisAllowed(analysisMode)) analysisMode = null;
    updateAnalysisModeUI();
    if (graphLineFilter) graphLineFilter.hidden = block.type !== "survey";
    if (energyAxisToggle) {
      if (block.type === 'core') energyDisplayMode = 'BE';
      energyAxisToggle.hidden = block.type !== 'survey';
      energyAxisToggle.textContent = energyDisplayMode;
      energyAxisToggle.classList.toggle('is-active', energyDisplayMode === 'KE');
      energyAxisToggle.setAttribute('aria-pressed', String(energyDisplayMode === 'KE'));
    }
    updateCalibrationUI();
    if (block.type === "core") {
      selectedDatabaseAssignment = null;
      populateChemicalClasses();
      renderCoreExplorer();
    }
    if(energyWindow.active) normalizeEnergyWindowForCurrentBlock(true);
    updateEnergyWindowButtons();
    renderSpectrum();
  }

  function selectSample(sampleId, options = {}) {
    const oldKey = currentBlock ? regionKey(currentBlock) : '';
    const sampleChanged = currentSample !== sampleId;
    if (sampleChanged) resetAnalysisStateForNavigation();
    currentSample = sampleId;
    if (sampleSelect) sampleSelect.value = sampleId;
    syncSamplePickerLabel();
    const blocks = orderedBlocksForSample(sampleId);
    let preferred = options.preserveRegion && oldKey ? findBlockByRegionKey(sampleId, oldKey) : null;
    if (!preferred) preferred = blocks.find(block => block.type === 'survey') || blocks[0];
    currentBlock = preferred || null;
    updateAnalysisModeUI();
    renderBlockList();
    if (currentBlock) selectBlock(currentBlock, { preserveMulti: !!options.preserveMulti, preserveAnalysisMode: !!options.preserveAnalysisMode });
  }

  function updateFileMeta(dateText = '') {
    if (!parsedFile || !fileMeta) return;
    const sampleCount = new Set(parsedFile.blocks.map(block => block.sampleId)).size;
    if (fileMetaName) fileMetaName.textContent = fileName;
    if (fileMetaInfo) fileMetaInfo.textContent = `${sampleCount} ${sampleCount===1?'sample':'samples'}${dateText ? ` · ${dateText}` : ''}`;
    if (!fileMetaName || !fileMetaInfo) fileMeta.textContent = `${fileName} · ${sampleCount} ${sampleCount===1?'sample':'samples'}${dateText ? ` · ${dateText}` : ''}`;
    fileMeta.hidden = false;
    if (fileMetaRow) fileMetaRow.hidden = false;
    if (fileSubtitle) fileSubtitle.hidden = true;
  }

  function populateSamples() {
    const samples = [];
    parsedFile.blocks.forEach(block => { if (!samples.includes(block.sampleId)) samples.push(block.sampleId); });
    sampleSelect.innerHTML = "";
    samples.forEach(sample => {
      const option = document.createElement("option"); option.value = sample; option.textContent = sample; sampleSelect.appendChild(option);
    });
    sampleOrder = samples.slice();
    multiSampleIds.clear();
    if (samples[0]) multiSampleIds.add(samples[0]);
    renderSampleMenu();
    syncSamplePickerLabel();
    selectSample(samples[0]);
  }

  async function loadFile(file) {
    clearStatus();
    try {
      const buffer = await file.arrayBuffer();
      const text = window.XPSVamas && typeof window.XPSVamas.decodeVamas === 'function'
        ? window.XPSVamas.decodeVamas(buffer)
        : new TextDecoder('utf-8').decode(buffer);
      parsedFile = parseVamas(text, file.name);
      fileName = file.name;
      lastSingleState = null;
      multiMasterTouched = false;
      multiRegionMode = false;
      manualMultiRegionKeys.clear();
      manualMultiRegionLabels.clear();
      multiSampleIds.clear();
      analysisMode = null;
      setIdentificationMode(null);
      workspace.hidden = false;
      if (navigation) navigation.hidden = false;
      updateFileMeta();
      populateSamples();
    } catch (error) {
      parsedFile = null; currentBlock = null; workspace.hidden = true;
      if (navigation) navigation.hidden = true;
      showStatus(`VAMAS import failed for ${file.name}: ${error && error.message ? error.message : error}`, true);
    }
  }


  if (calibrationPickButton) calibrationPickButton.addEventListener('click', () => setCalibrationPickMode(!calibrationPickMode));
  if (graphCalibrationButton) graphCalibrationButton.addEventListener('click', () => {
    if (currentBlock && !multiRegionMode) setCalibrationPanelOpen(!calibrationPanelOpen);
  });
  if (setCalibrationButton) setCalibrationButton.addEventListener('click', applyCalibration);
  if (resetCalibrationButton) resetCalibrationButton.addEventListener('change', () => {
    const mode = resetCalibrationButton.value;
    resetCalibrationButton.value = '';
    resetCalibration(mode);
  });

  if (coreClassToggle) coreClassToggle.addEventListener('click', () => {
    const open = !coreClassMenu.hidden;
    coreClassMenu.hidden = open;
    coreClassToggle.setAttribute('aria-expanded', String(!open));
    if (!open && coreClassSearch) coreClassSearch.focus();
  });
  if (coreClassSearch) coreClassSearch.addEventListener('input', () => {
    const search = normalizeSearch(coreClassSearch.value);
    coreClassOptions.querySelectorAll('.xv-core-class-option').forEach(option => {
      option.hidden = !!search && !normalizeSearch(option.textContent).includes(search);
    });
  });
  if (coreClassClear) coreClassClear.addEventListener('click', () => {
    selectedClasses = new Set();
    coreClassOptions.querySelectorAll('input').forEach(input => { input.checked = false; });
    selectedDatabaseAssignment = null;
    updateClassToggle();
    renderCoreExplorer();
    renderSpectrum();
  });
  document.addEventListener('click', event => {
    if (coreClassFilter && !coreClassFilter.contains(event.target)) {
      coreClassMenu.hidden = true;
      coreClassToggle.setAttribute('aria-expanded', 'false');
    }
  });

  if (coreSearchInput) coreSearchInput.addEventListener('input', () => {
    selectedDatabaseAssignment = null;
    renderCoreExplorer();
    renderSpectrum();
  });

  energyWindowToggles.forEach(button=>button.addEventListener('click',()=>setEnergyWindowActive(!energyWindow.active)));
  if(coreClearButton) coreClearButton.addEventListener('click',()=>{
    if(coreSearchInput) coreSearchInput.value='';
    selectedDatabaseAssignment = null;
    pinnedCompounds.clear();
    expandedPinnedCompounds.clear();
    if (energyWindow.active) {
      energyWindow.active = false;
      energyWindowDrag = null;
      updateEnergyWindowButtons();
    }
    if (multiRegionMode && multiRegionSource === 'pinned') setMultiRegionMode(false);
    else { renderCoreExplorer(); renderSpectrum(); }
  });
  if (lineInfo) lineInfo.addEventListener('click', async ()=>{
    const text=lineInfo.dataset.copyContent || lineInfo.innerText.trim(); if(!text) return;
    try {
      if (!(await writeClipboardText(text))) return;
      let feedback=lineInfo.querySelector('.xv-copy-feedback');
      if(!feedback){ feedback=document.createElement('span'); feedback.className='xv-copy-feedback'; lineInfo.appendChild(feedback); }
      feedback.textContent='Copied';
      window.setTimeout(()=>{ if(feedback) feedback.remove(); },1000);
    }
    catch(_) { /* leave the value visible when clipboard access is unavailable */ }
  });


  function syncAnalysisColumnHeight() {
    if (!leftPanel || !rightPanel || !workspace || workspace.hidden) return;
    window.requestAnimationFrame(() => {
      const h = Math.ceil(rightPanel.getBoundingClientRect().height);
      const extra = currentBlock && currentBlock.type === 'core' ? 42 : 0;
      if (h > 0) leftPanel.style.height = `${h + extra}px`;
    });
  }

  function safeFileToken(value) {
    return String(value || '').trim().replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'spectrum';
  }

  function inlineSvgComputedStyles(sourceSvg) {
    const clone = sourceSvg.cloneNode(true);
    const sourceNodes = [sourceSvg, ...sourceSvg.querySelectorAll('*')];
    const cloneNodes = [clone, ...clone.querySelectorAll('*')];
    const props = ['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','paint-order'];
    sourceNodes.forEach((node,index) => {
      const target = cloneNodes[index]; if (!target || node.nodeType !== 1) return;
      const cs = getComputedStyle(node);
      const style = props.map(prop => `${prop}:${cs.getPropertyValue(prop)}`).join(';');
      target.setAttribute('style', `${target.getAttribute('style') || ''};${style}`);
    });
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
    return clone;
  }

  function svgToCanvasImage(sourceSvg, width, height) {
    return new Promise((resolve,reject) => {
      try {
        const clone = inlineSvgComputedStyles(sourceSvg);
        clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height));
        const blob = new Blob([new XMLSerializer().serializeToString(clone)], {type:'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = err => { URL.revokeObjectURL(url); reject(err); };
        img.src = url;
      } catch (err) { reject(err); }
    });
  }

  function downloadCanvasPng(canvas, filename) {
    canvas.toBlob(blob => {
      if (!blob) return;
      const url=URL.createObjectURL(blob); const a=document.createElement('a');
      a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    },'image/png');
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = words.shift();
    words.forEach(word => {
      const candidate = `${line} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
      else { lines.push(line); line = word; }
    });
    lines.push(line);
    return lines;
  }

  function exportInfoLines() {
    if (!lineInfo || lineInfo.hidden) return [];
    const childLines = Array.from(lineInfo.children)
      .filter(child => !child.classList.contains('xv-copy-feedback'))
      .map(child => child.textContent.trim())
      .filter(Boolean);
    if (childLines.length) return childLines;
    return lineInfo.textContent.split(/\n+/).map(value => value.trim()).filter(Boolean);
  }

  function drawExportLegend(ctx, x, y, maxWidth, foreground) {
    if (!selectedElements.length) return 0;
    ctx.font = '600 20px sans-serif';
    const itemGap = 22;
    const swatchWidth = 25;
    const rowHeight = 28;
    let cursorX = x;
    let cursorY = y;
    selectedElements.forEach(element => {
      const textWidth = ctx.measureText(element).width;
      const itemWidth = swatchWidth + 8 + textWidth;
      if (cursorX > x && cursorX + itemWidth > x + maxWidth) {
        cursorX = x;
        cursorY += rowHeight;
      }
      ctx.fillStyle = colourFor(element);
      ctx.fillRect(cursorX, cursorY - 12, swatchWidth, 4);
      ctx.fillStyle = foreground;
      ctx.fillText(element, cursorX + swatchWidth + 8, cursorY - 5);
      cursorX += itemWidth + itemGap;
    });
    return cursorY - y + rowHeight;
  }

  async function exportDisplayedImage() {
    if (!parsedFile) return;
    const bg = getComputedStyle(root.querySelector('.xv-chart-card') || root).backgroundColor || '#081321';
    const fg = getComputedStyle(root).color || '#f4f7fb';
    if (!multiRegionMode) {
      if (!currentBlock || !chart) return;
      const W=1600,pad=24,chartH=884;
      const rawInfoLines=exportInfoLines();
      const measureCanvas=document.createElement('canvas');
      const measureContext=measureCanvas.getContext('2d');
      measureContext.font='600 21px sans-serif';
      const infoLines=rawInfoLines.flatMap(value=>wrapCanvasText(measureContext,value,W-2*pad));
      const hasLegend=selectedElements.length>0;
      const infoHeight=infoLines.length ? infoLines.length*27+8 : 0;
      const legendHeight=hasLegend ? 32 : 0;
      const head=72+infoHeight+legendHeight;
      const H=head+chartH+pad;
      const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
      const ctx=canvas.getContext('2d'); ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);ctx.fillStyle=fg;
      ctx.font='700 30px sans-serif';ctx.fillText(`${currentSample || 'Sample'}   ${normalizedBlockName(currentBlock)}`,pad,42);
      const off=calibrationOffsetForBlock(currentBlock); if(Math.abs(off)>=0.005){ctx.fillStyle='#f59e0b';ctx.font='700 24px sans-serif';ctx.fillText(`${off>=0?'+':''}${off.toFixed(2)} eV`,W-190,42);ctx.fillStyle=fg;}
      let metaY=70;
      if(infoLines.length){
        const infoColour=getComputedStyle(lineInfo).getPropertyValue('--xv-info-color').trim() || fg;
        ctx.fillStyle=infoColour;ctx.font='600 21px sans-serif';
        infoLines.forEach(value=>{
          wrapCanvasText(ctx,value,W-2*pad).forEach(line=>{ctx.fillText(line,pad,metaY);metaY+=27;});
        });
        metaY+=5;
      }
      if(hasLegend) metaY+=drawExportLegend(ctx,pad,metaY,W-2*pad,fg);
      const img=await svgToCanvasImage(chart,W-2*pad,chartH);ctx.drawImage(img,pad,head,W-2*pad,chartH);
      downloadCanvasPng(canvas,`${safeFileToken(currentSample)}_${safeFileToken(normalizedBlockName(currentBlock))}.png`); return;
    }
    const tiles=Array.from(multiregionView.querySelectorAll('.xv-multiregion-tile')).filter(tile=>tile.querySelector('.xv-multiregion-chart'));
    if(!tiles.length)return;
    const count=tiles.length, cols=count===1?1:(count===2?2:(count<=4?2:3)), rows=Math.ceil(count/cols);
    const tileW=760,tileH=520,gap=18,pad=24,head=52;
    const canvas=document.createElement('canvas');canvas.width=pad*2+cols*tileW+(cols-1)*gap;canvas.height=pad*2+rows*tileH+(rows-1)*gap;
    const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<tiles.length;i++){
      const tile=tiles[i],svg=tile.querySelector('.xv-multiregion-chart'),col=i%cols,row=Math.floor(i/cols),x=pad+col*(tileW+gap),y=pad+row*(tileH+gap);
      ctx.strokeStyle='rgba(148,163,184,.45)';ctx.strokeRect(x,y,tileW,tileH);ctx.fillStyle=fg;ctx.font='700 24px sans-serif';
      const sample=(tile.querySelector('.xv-multiregion-sample-badge')?.textContent||'').trim();const region=(tile.querySelector('.xv-multiregion-open')?.textContent||'').trim();ctx.fillText(`${sample}   ${region}`,x+16,y+33);
      const cal=(tile.querySelector('.xv-multiregion-calibration-badge')?.textContent||'').trim();if(cal){ctx.fillStyle='#f59e0b';ctx.font='700 20px sans-serif';ctx.fillText(cal,x+tileW-130,y+32);}
      const img=await svgToCanvasImage(svg,tileW-24,tileH-head-12);ctx.drawImage(img,x+12,y+head,tileW-24,tileH-head-12);
    }
    const items=selectedMultiBlocks();const samples=Array.from(new Set(items.map(i=>i.sampleId).filter(Boolean)));const regions=Array.from(new Set(items.map(i=>i.block?normalizedBlockName(i.block):i.label).filter(Boolean)));
    let filename='multiview.png';
    if(samples.length===1) filename=`${safeFileToken(samples[0])}_multiview_${regions.map(safeFileToken).join('_')}.png`;
    else if(regions.length===1) filename=`multisample_${safeFileToken(regions[0])}_${samples.map(safeFileToken).join('_')}.png`;
    else filename=`multiview_${samples.map(safeFileToken).join('_')}_${regions.map(safeFileToken).join('_')}.png`;
    downloadCanvasPng(canvas,filename);
  }

  function setMultiRegionMode(enabled, source = 'manual', options = {}) {
    const canUse = !!(parsedFile && currentSample);
    const wasMulti = multiRegionMode;
    if (!!enabled && canUse && !wasMulti) {
      lastSingleState = currentBlock ? { sampleId: currentSample, regionKey: regionKey(currentBlock) } : null;
      multiMasterTouched = false;
    }

    multiRegionMode = !!enabled && canUse;
    if (multiRegionMode) {
      multiRegionSource = source;
      setCalibrationPickMode(false);
      setCalibrationPanelOpen(false);
      if (energyWindow.active && !analysisAllowed(analysisMode)) setEnergyWindowActive(false);
      if (source === 'manual') {
        // Entering Multi-view from the top control starts with an intentionally blank canvas.
        // Pinned-compound shortcuts pass replaceRegions and therefore populate it explicitly.
        if (!wasMulti && !options.replaceRegions) {
          manualMultiRegionKeys.clear();
          manualMultiRegionLabels.clear();
          activeMultiTileKey = null;
          multiMasterTouched = false;
        }
        if (options.replaceRegions && Array.isArray(options.regionKeys)) {
          manualMultiRegionKeys.clear();
          manualMultiRegionLabels.clear();
          options.regionKeys.forEach(item => {
            const key = typeof item === 'string' ? item : item.key;
            const label = typeof item === 'string' ? item : item.label;
            if (key) { manualMultiRegionKeys.add(key); manualMultiRegionLabels.set(key, label || key); }
          });
        }
        if (!manualMultiRegionKeys.size && currentBlock && (wasMulti || options.replaceRegions)) {
          const key=regionKey(currentBlock); manualMultiRegionKeys.add(key); manualMultiRegionLabels.set(key, normalizedBlockName(currentBlock));
        }
        if (!multiSampleIds.size) multiSampleIds.add(currentSample);
        if (manualMultiRegionKeys.size) activeMultiTileKey = currentBlock ? `${currentSample}|${regionKey(currentBlock)}` : activeMultiTileKey;
      } else if (source === 'pinned' && !pinnedCompounds.size) {
        multiRegionMode = false;
      }
    } else {
      if (wasMulti) {
        let target = null;
        let targetSample = currentSample;
        if (multiMasterTouched && currentBlock) {
          target = currentBlock;
          targetSample = currentSample;
        } else if (lastSingleState) {
          targetSample = lastSingleState.sampleId;
          target = findBlockByRegionKey(targetSample, lastSingleState.regionKey);
        }
        if (target && targetSample) {
          currentSample = targetSample;
          if (sampleSelect) sampleSelect.value = targetSample;
          currentBlock = target;
        }
      }
      multiSampleIds.clear();
      if (currentSample) multiSampleIds.add(currentSample);
      activeMultiTileKey = null;
      multiMasterTouched = false;
    }
    renderSampleMenu();
    syncSamplePickerLabel();
    renderBlockList();
    updateMultiRegionButton();
    updateStepperAvailability();
    if (analysisMode && !analysisAllowed(analysisMode)) analysisMode = null;
    updateAnalysisModeUI();
    if (analysisMode === 'core' && currentBlock && currentBlock.type === 'core') renderCoreExplorer();
    renderSpectrum();
  }

  if (multiregionToggle) multiregionToggle.addEventListener('click', () => {
    if (!pinnedCompounds.size || !currentSample) return;
    const regions = multiRegionBlocks().map(item => item.block).filter(Boolean);
    const unique = []; const seen = new Set();
    regions.forEach(block => { const key = regionKey(block); if (!seen.has(key)) { seen.add(key); unique.push({ key, label: normalizedBlockName(block) }); } });
    if (!unique.length && currentBlock) unique.push({ key: regionKey(currentBlock), label: normalizedBlockName(currentBlock) });
    multiSampleIds.clear(); multiSampleIds.add(currentSample);
    setMultiRegionMode(true, 'manual', { replaceRegions: true, regionKeys: unique });
  });
  if (pinnedSingleViewButton) pinnedSingleViewButton.addEventListener('click', () => {
    if (multiRegionMode) setMultiRegionMode(false);
    else renderSpectrum();
  });
  if (workflowResetButton) workflowResetButton.addEventListener('click', () => {
    multiTileViews.clear();
    multiTileDragStates.clear();
    multiMasterTouched = false;
    activeMultiTileKey = null;
    if (multiRegionMode) {
      // Reset the Multi-view canvas itself: start from the first sample with no selected region.
      // Calibration maps and pinned compounds are intentionally preserved.
      resetAnalysisStateForNavigation();
      const firstSample = sampleOrder[0] || currentSample;
      if (firstSample) {
        currentSample = firstSample;
        if (sampleSelect) sampleSelect.value = firstSample;
      }
      multiSampleIds.clear();
      if (currentSample) multiSampleIds.add(currentSample);
      manualMultiRegionKeys.clear();
      manualMultiRegionLabels.clear();
      currentBlock = orderedBlocksForSample(currentSample)[0] || null;
      lastSingleState = null;
      renderSampleMenu();
      syncSamplePickerLabel();
      renderBlockList();
      updateStepperAvailability();
      updateAnalysisModeUI();
      updateCalibrationUI();
      renderSpectrum();
      return;
    }
    analysisMode = null;
    resetAnalysisStateForNavigation();
    activeMultiTileKey = currentBlock ? `${currentSample}|${regionKey(currentBlock)}` : null;
    lastSingleState = currentBlock ? { sampleId: currentSample, regionKey: regionKey(currentBlock) } : null;
    updateAnalysisModeUI();
    updateCalibrationUI();
    if (currentBlock && currentBlock.type === 'core') renderCoreExplorer();
    renderSpectrum();
  });
  if (topMultiViewButton) topMultiViewButton.addEventListener('click', () => setMultiRegionMode(true, 'manual'));
  if (singleViewButton) singleViewButton.addEventListener('click', () => setMultiRegionMode(false));
  if (exportImageButton) exportImageButton.addEventListener('click', () => { exportDisplayedImage().catch(() => {}); });

  function stepCurrentSample(direction) {
    if (!sampleOrder.length || !currentSample || isMultiSampleView()) return;
    const currentIndex = sampleOrder.indexOf(currentSample);
    if (multiRegionMode) {
      const next = currentIndex + direction;
      if (next < 0 || next >= sampleOrder.length) return;
      resetAnalysisStateForNavigation();
      currentSample = sampleOrder[next];
      if (sampleSelect) sampleSelect.value = currentSample;
      multiSampleIds.clear(); multiSampleIds.add(currentSample);
      const activeKey = currentBlock ? regionKey(currentBlock) : Array.from(manualMultiRegionKeys)[0];
      currentBlock = activeKey ? findBlockByRegionKey(currentSample, activeKey) : null;
      if (!currentBlock) currentBlock = orderedBlocksForSample(currentSample)[0] || null;
      if (currentBlock) activeMultiTileKey = `${currentSample}|${regionKey(currentBlock)}`;
      renderBlockList(); renderSampleMenu(); syncSamplePickerLabel(); updateAnalysisModeUI(); updateStepperAvailability();
      if (currentBlock && currentBlock.type === 'core') renderCoreExplorer();
      renderSpectrum();
      return;
    }
    const key = currentBlock ? regionKey(currentBlock) : '';
    for (let i=currentIndex+direction; i>=0 && i<sampleOrder.length; i+=direction) {
      const sampleId = sampleOrder[i];
      if (!key || findBlockByRegionKey(sampleId, key)) {
        selectSample(sampleId, { preserveRegion: true, preserveMulti: false, preserveAnalysisMode: false });
        return;
      }
    }
  }
  function stepCurrentRegion(direction) {
    if (!currentSample || !currentBlock || isMultiRegionView()) return;
    const blocks = orderedBlocksForSample(currentSample);
    const idx = blocks.findIndex(block => block.index === currentBlock.index);
    const next = idx + direction;
    if (next < 0 || next >= blocks.length) return;
    const nextBlock = blocks[next];
    if (isMultiSampleView()) {
      const key=regionKey(nextBlock);
      manualMultiRegionKeys.clear(); manualMultiRegionLabels.clear();
      manualMultiRegionKeys.add(key); manualMultiRegionLabels.set(key,normalizedBlockName(nextBlock));
      currentBlock=nextBlock; activeMultiTileKey=`${currentSample}|${key}`;
      renderBlockList(); updateAnalysisModeUI(); updateStepperAvailability();
      if(nextBlock.type==='core') renderCoreExplorer();
      renderSpectrum();
      return;
    }
    selectBlock(nextBlock, { preserveMulti: multiRegionMode, preserveAnalysisMode: multiRegionMode });
  }
  if (samplePrevButton) samplePrevButton.addEventListener('click', () => stepCurrentSample(-1));
  if (sampleNextButton) sampleNextButton.addEventListener('click', () => stepCurrentSample(1));
  if (regionPrevButton) regionPrevButton.addEventListener('click', () => stepCurrentRegion(-1));
  if (regionNextButton) regionNextButton.addEventListener('click', () => stepCurrentRegion(1));

  if (samplePickerButton) samplePickerButton.addEventListener('click', event => {
    event.stopPropagation();
    const open = sampleMenu && !sampleMenu.hidden;
    if (open) closeSampleMenu();
    else { renderSampleMenu(); sampleMenu.hidden=false; samplePickerButton.setAttribute('aria-expanded','true'); }
  });
  document.addEventListener('click', event => { if (samplePicker && !samplePicker.contains(event.target)) closeSampleMenu(); });

  analysisModeButtons.forEach(button => button.addEventListener('click', () => setAnalysisMode(button.dataset.analysisMode)));

  const openFileButton = root.querySelector(".xv-file-button");
  if (openFileButton) openFileButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) loadFile(file);
  });
  lineFilterButtons.forEach(button => button.addEventListener("click", () => {
    lineFilter = button.dataset.lineFilter || "both";
    lineFilterButtons.forEach(candidate => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (identificationMode === "auto") {
      autoCandidates = scoreAutoCandidates(detectedPeaks);
      updateAutoSummary();
      updatePeriodicSelection();
    }
    renderSpectrum();
  }));
  clearElementsButton.addEventListener("click", clearElements);
  modeButtons.forEach(button => button.addEventListener("click", () => {
    if (button.dataset.mode === "auto") runAutoIdentification();
    else { setIdentificationMode("manual"); renderSpectrum(); }
  }));
  if (energyAxisToggle) energyAxisToggle.addEventListener('click', () => {
    const canUseKE = Number.isFinite(photonEnergyForCurrentBlock());
    if (energyDisplayMode === 'BE' && !canUseKE) { showStatus('Photon energy is not available for KE display.', true); return; }
    energyDisplayMode = energyDisplayMode === 'BE' ? 'KE' : 'BE';
    energyAxisToggle.textContent = energyDisplayMode;
    energyAxisToggle.classList.toggle('is-active', energyDisplayMode === 'KE');
    energyAxisToggle.setAttribute('aria-pressed', String(energyDisplayMode === 'KE'));
    renderSpectrum();
  });

  countsToggle.addEventListener("click", () => {
    showCounts = !showCounts;
    countsToggle.classList.toggle("is-active", showCounts);
    countsToggle.setAttribute("aria-pressed", showCounts ? "true" : "false");
    renderSpectrum();
  });

  resetViewButton.addEventListener("click", () => {
    viewRange = null;
    resetViewButton.disabled = true;
    renderSpectrum();
  });

  chart.addEventListener("wheel", event => {
    if (!currentBlock || !currentBlock.points.length) return;
    event.preventDefault();
    const allX = displayPointsForBlock(currentBlock).map(p => p.x);
    const fullMin = Math.min(...allX), fullMax = Math.max(...allX);
    if (!viewRange) viewRange = { min: fullMin, max: fullMax };
    const rect = chart.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    // XPS axis is reversed: left = high BE, right = low BE.
    const anchor = viewRange.max - ratio * (viewRange.max - viewRange.min);
    const factor = event.deltaY < 0 ? 0.82 : 1.22;
    let newMin = anchor - (anchor - viewRange.min) * factor;
    let newMax = anchor + (viewRange.max - anchor) * factor;
    const minSpan = Math.max(1, (fullMax - fullMin) / 250);
    if (newMax - newMin < minSpan) return;
    if (newMin < fullMin) { newMax += fullMin - newMin; newMin = fullMin; }
    if (newMax > fullMax) { newMin -= newMax - fullMax; newMax = fullMax; }
    newMin = Math.max(fullMin, newMin); newMax = Math.min(fullMax, newMax);
    viewRange = { min: newMin, max: newMax };
    resetViewButton.disabled = Math.abs(newMin-fullMin) < 1e-6 && Math.abs(newMax-fullMax) < 1e-6;
    renderSpectrum();
  }, { passive: false });

  chart.addEventListener("pointerdown", event => {
    const handle = event.target && event.target.dataset ? event.target.dataset.energyHandle : null;
    if (energyWindow.active && handle) {
      event.preventDefault(); event.stopPropagation();
      energyWindowDrag={handle,startEnergy:energyFromPointer(event),center:energyWindow.center,halfWidth:energyWindow.halfWidth};
      chart.setPointerCapture(event.pointerId); return;
    }
    if (energyWindow.active) {
      const blocked = event.target && event.target.closest && event.target.closest('.xv-db-reference-label, .xv-reference-label, .xv-reference-hit');
      if(!blocked){
        const e=energyFromPointer(event); if(Number.isFinite(e)){ energyWindow.center=e; normalizeEnergyWindowForCurrentBlock(false); renderSpectrum(); }
        return;
      }
    }
    if (calibrationPickMode && currentBlock) {
      event.preventDefault();
      event.stopPropagation();
      pickCalibrationEnergyFromEvent(event);
      return;
    }
    if (event.target && event.target.closest && event.target.closest(".xv-reference-line, .xv-reference-hit, .xv-reference-label")) return;
    if (!currentBlock || !currentBlock.points.length) return;
    const allX = displayPointsForBlock(currentBlock).map(p => p.x);
    const fullMin = Math.min(...allX), fullMax = Math.max(...allX);
    if (!viewRange) viewRange = { min: fullMin, max: fullMax };
    dragState = { x: event.clientX, min: viewRange.min, max: viewRange.max, fullMin, fullMax };
    chart.classList.add("is-dragging");
    chart.setPointerCapture(event.pointerId);
  });
  chart.addEventListener("pointermove", event => {
    if (energyWindowDrag) {
      const now=energyFromPointer(event); if(!Number.isFinite(now)) return;
      if(energyWindowDrag.handle==='center'){ energyWindow.center=energyWindowDrag.center+(now-energyWindowDrag.startEnergy); }
      else { energyWindow.halfWidth=Math.max(0.05,Math.abs(now-energyWindow.center)); }
      renderSpectrum(); return;
    }
    if (!dragState) return;
    const rect = chart.getBoundingClientRect();
    const span = dragState.max - dragState.min;
    const dx = event.clientX - dragState.x;
    // Drag spectrum right -> inspect higher BE values.
    const shift = dx / Math.max(1, rect.width) * span;
    let newMin = dragState.min + shift;
    let newMax = dragState.max + shift;
    if (newMin < dragState.fullMin) { newMax += dragState.fullMin - newMin; newMin = dragState.fullMin; }
    if (newMax > dragState.fullMax) { newMin -= newMax - dragState.fullMax; newMax = dragState.fullMax; }
    viewRange = { min: newMin, max: newMax };
    resetViewButton.disabled = false;
    renderSpectrum();
  });
  const endDrag = () => { dragState = null; energyWindowDrag = null; chart.classList.remove("is-dragging"); };
  chart.addEventListener("pointerup", endDrag);
  chart.addEventListener("pointercancel", endDrag);
  chart.addEventListener("lostpointercapture", endDrag);

  window.addEventListener('resize', syncAnalysisColumnHeight);
  updatePeriodicSelection();
  syncAnalysisColumnHeight();
}
