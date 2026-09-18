
(function () {
  const root = document.getElementById("xps-core-levels-static");
  if (!root) return;
  const scriptUrl = document.currentScript ? new URL(document.currentScript.src, document.baseURI) : new URL("./core-level.js", document.baseURI);

  const coreChoice = root.querySelector("#xps-core-levels-static-core-choice");
  const coreControl = root.querySelector(".xps-core-control");
  const coreToggle = root.querySelector(".xps-core-toggle");
  const coreMenu = root.querySelector(".xps-core-menu");
  const coreSearch = root.querySelector(".xps-core-search");
  const coreOptions = root.querySelector(".xps-core-options");
  const chartContainer = root.querySelector(".xps-chart-container");
  const chartPlaceholder = root.querySelector(".xps-chart-placeholder");
  const chart = root.querySelector(".xps-chart");
  const chartTitle = root.querySelector(".xps-chart-title");
  const spinOrbitInfo = root.querySelector(".xps-spin-orbit-info");
  const classFilter = root.querySelector(".xps-class-filter");
  const classToggle = root.querySelector(".xps-class-toggle");
  const classMenu = root.querySelector(".xps-class-menu");
  const classSearch = root.querySelector(".xps-class-search");
  const classOptions = root.querySelector(".xps-class-options");
  const classClear = root.querySelector(".xps-class-clear");
  const defaultUncertainty = parseFloat("0.15");
  const svgNS = "http://www.w3.org/2000/svg";
  const createSVG = tag => document.createElementNS(svgNS, tag);
  const classKey = value => (value || "").trim().toLocaleLowerCase();
  const splitClasses = value => (value || "").split(";").map(value => value.trim()).filter(Boolean);
  let rawData = [];
  let referenceLines = [];

  async function loadCompoundData() {
    const url = new URL("../../data/compounds-core-levels-final.csv", scriptUrl);
    const records = await window.XPSData.loadRecords(url);
    const mapped = records.map((item, id) => ({
      id,
      compound: item["Compound"] || "",
      name: item["Compound name"] || "",
      aliases: item["Compound aliases"] || "",
      chemicalClasses: splitClasses(item["Chemical class"]),
      core: item["Core level"] || "",
      be: item["Binding energy (eV)"] || "",
      uncertainty: item["Uncertainty (eV)"] || "",
      assignment: item["Peak assignment"] || "",
      reference: item["Reference"] || "",
      doi: item["DOI"] || "",
      calibration: item["Calibration"] || ""
    })).filter(item => item.compound && item.core && Number.isFinite(Number.parseFloat(item.be)));
    if (!mapped.length) throw new Error("Reference database is empty or has unexpected columns.");
    return mapped;
  }

  async function loadReferenceLines() {
    const url = new URL("../../data/element-lines-master.csv", scriptUrl);
    const records = await window.XPSData.loadRecords(url);
    return records.map(item => ({
      element: item.element || "",
      transition: item.transition || "",
      lineType: item.line_type || "",
      energyType: item.energy_type || "",
      energy: Number.parseFloat(item.energy_eV),
      library: item.library || "",
      source: item.xray_source || ""
    })).filter(item => item.element && item.transition && Number.isFinite(item.energy));
  }

  function spinOrbitPair(core) {
    const match = /^([A-Z][a-z]?)\s+(\d+[pdf])([1357])\/2$/i.exec(core.trim());
    if (!match) return null;
    const [, element, shell] = match;
    const candidates = referenceLines.filter(item =>
      item.element.toLocaleLowerCase() === element.toLocaleLowerCase() &&
      item.lineType.toLocaleLowerCase() === "xps" &&
      item.energyType.toLocaleLowerCase() === "be" &&
      new RegExp(`^${shell}[1357]\\/2$`, "i").test(item.transition)
    );
    const preferred = candidates.filter(item => item.library === "ALSCOF" && item.source === "Al Kα");
    const source = preferred.length >= 2 ? preferred : candidates;
    const unique = new Map();
    source.forEach(item => {
      if (!unique.has(item.transition)) unique.set(item.transition, item);
    });
    const pair = Array.from(unique.values()).sort((left, right) => {
      const leftJ = Number((left.transition.match(/([1357])\/2$/) || [])[1] || 0);
      const rightJ = Number((right.transition.match(/([1357])\/2$/) || [])[1] || 0);
      return rightJ - leftJ;
    });
    if (pair.length < 2) return null;
    const delta = Math.abs(pair[0].energy - pair[1].energy);
    if (delta < 0.05) return null;
    return { pair: pair.slice(0, 2), delta };
  }

  function updateSpinOrbitInfo() {
    const group = spinOrbitPair(selectedCore);
    if (!group) {
      spinOrbitInfo.hidden = true;
      spinOrbitInfo.textContent = "";
      return;
    }
    const [first, second] = group.pair;
    const firstMatch = first.transition.match(/^(\d+[pdf])(\d\/2)$/i);
    const secondSuffix = second.transition.replace(firstMatch ? firstMatch[1] : "", "");
    const label = firstMatch ? `${first.transition}–${secondSuffix}` : `${first.transition}–${second.transition}`;
    spinOrbitInfo.textContent = `Spin–orbit doublet: ${label} · ΔE = ${group.delta.toFixed(1)} eV`;
    spinOrbitInfo.hidden = false;
  }

  let selectedId = null;
  let selectedCore = "";
  let selectedClasses = new Set();

  const elementCatalog = new Map([
    ["H", "Hydrogen"], ["Li", "Lithium"], ["B", "Boron"], ["C", "Carbon"],
    ["N", "Nitrogen"], ["O", "Oxygen"], ["F", "Fluorine"], ["Na", "Sodium"],
    ["Mg", "Magnesium"], ["Al", "Aluminium"], ["Si", "Silicon"], ["P", "Phosphorus"],
    ["S", "Sulfur"], ["Cl", "Chlorine"], ["K", "Potassium"], ["Ca", "Calcium"],
    ["Ti", "Titanium"], ["V", "Vanadium"], ["Cr", "Chromium"], ["Mn", "Manganese"],
    ["Fe", "Iron"], ["Co", "Cobalt"], ["Ni", "Nickel"], ["Br", "Bromine"],
    ["Rb", "Rubidium"], ["Y", "Yttrium"], ["Zr", "Zirconium"], ["Nb", "Niobium"],
    ["Mo", "Molybdenum"], ["In", "Indium"], ["Sb", "Antimony"], ["I", "Iodine"],
    ["Cs", "Caesium"]
  ]);

  function coreParts(core) {
    const parts = core.trim().split(/\s+/);
    return { element:parts.shift() || "", orbital:parts.join(" ") };
  }
  function orbitalParts(orbital) {
    const match = /^(\d+)([spdf])(?:(\d+)\/(\d+))?$/i.exec(orbital.trim());
    if (!match) return [Number.MAX_SAFE_INTEGER, 9, 9, orbital];
    const orbitalOrder = { s:0, p:1, d:2, f:3 };
    return [Number(match[1]), orbitalOrder[match[2].toLowerCase()], match[3] ? -Number(match[3]) : -99, orbital];
  }
  function compareCoreLevels(a, b) {
    const left = coreParts(a); const right = coreParts(b);
    const elementOrder = left.element.localeCompare(right.element, "en", { sensitivity:"base" });
    if (elementOrder) return elementOrder;
    const leftOrbital = orbitalParts(left.orbital); const rightOrbital = orbitalParts(right.orbital);
    for (let index = 0; index < 3; index += 1) {
      if (leftOrbital[index] !== rightOrbital[index]) return leftOrbital[index] - rightOrbital[index];
    }
    return String(leftOrbital[3]).localeCompare(String(rightOrbital[3]), "en", { numeric:true });
  }
  function normaliseCoreSearch(value) {
    return String(value || "").normalize("NFKD")
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "₀₁₂₃₄₅₆₇₈₉".indexOf(digit))
      .replace(/[−–—-]/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  function populateCoreOptions() {
    const energies = new Map();
    rawData.forEach(item => {
      const core = item.core.trim(); const value = parseFloat(item.be);
      if (!core || !Number.isFinite(value)) return;
      if (!energies.has(core)) energies.set(core, []);
      energies.get(core).push(value);
    });
    Array.from(energies.keys()).sort(compareCoreLevels).forEach(core => {
      const { element, orbital } = coreParts(core);
      const label = elementCatalog.has(element) ? `${element} — ${elementCatalog.get(element)} ${orbital}` : core;
      coreChoice.add(new Option(label, core));
      const option = document.createElement("button");
      option.type = "button"; option.className = "xps-core-option"; option.textContent = label;
      option.dataset.search = `${core} ${element} ${elementCatalog.get(element) || ""} ${orbital}`;
      option.addEventListener("click", () => {
        coreChoice.value = core; coreToggle.textContent = label;
        coreMenu.hidden = true; coreToggle.setAttribute("aria-expanded", "false"); updateCoreSelection();
      });
      coreOptions.appendChild(option);
    });
  }

  function normalizeDOI(doi) {
    const value = (doi || "").trim();
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : "https://doi.org/" + value;
  }

  function splitReferences(value) {
    return (value || "").split(/\s*(?:;|\r?\n)\s*/).map(item => item.trim()).filter(Boolean);
  }

  function splitParallelValues(value) {
    return String(value || "").split(";").map(part => part.trim());
  }
  function referenceEntries(item) {
    const references = splitReferences(item.reference);
    const dois = splitReferences(item.doi);
    const calibrations = splitParallelValues(item.calibration);
    const count = Math.max(references.length, dois.length, calibrations.length);
    return Array.from({ length: count }, (_, index) => ({
      reference: references[index] || "",
      doi: dois[index] || "",
      calibration: calibrations[index] || ""
    }));
  }

  async function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        // Fall back to a temporary textarea for older Safari versions.
      }
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard access is unavailable.");
  }

  function clipboardText(item) {
    const lines = [
      item.name ? `${item.compound} — ${item.name}` : item.compound,
      `Core level: ${item.core}`,
      `Peak assignment: ${item.assignment || "—"}`,
      `Binding energy: ${item.be}${item.uncertainty ? ` ± ${item.uncertainty}` : ""} eV`
    ];
    referenceEntries(item).forEach(entry => {
      if (entry.reference) lines.push(`Reference: [${entry.reference}]`);
      const url = normalizeDOI(entry.doi);
      if (url) lines.push(`DOI: ${url}`);
      lines.push(`Calibration: ${entry.calibration || "Not reported"}`);
    });
    return lines.join("\n");
  }

  function updateClassToggle() {
    const count = selectedClasses.size;
    classToggle.textContent = count ? `${count} chemical ${count === 1 ? "class" : "classes"} selected` : "All chemical classes";
  }

  function populateClassOptions() {
    const available = new Map();
    rawData.filter(item => item.core.trim() === selectedCore).forEach(item => {
      item.chemicalClasses.forEach(name => available.set(classKey(name), name));
    });
    selectedClasses = new Set(Array.from(selectedClasses).filter(name => available.has(name)));
    classOptions.innerHTML = "";
    Array.from(available.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([key, name]) => {
      const label = document.createElement("label");
      label.className = "xps-class-option";
      const input = document.createElement("input");
      input.type = "checkbox"; input.value = key; input.checked = selectedClasses.has(key);
      input.addEventListener("change", () => {
        input.checked ? selectedClasses.add(key) : selectedClasses.delete(key);
        selectedId = null; updateClassToggle(); renderChart();
      });
      label.append(input, document.createTextNode(name)); classOptions.appendChild(label);
    });
    classFilter.hidden = available.size < 2;
    classSearch.value = "";
    classMenu.hidden = true;
    classToggle.setAttribute("aria-expanded", "false");
    updateClassToggle();
  }

  function coreRows(core) {
    return rawData.filter(item => item.core.trim() === core && (!selectedClasses.size || item.chemicalClasses.some(name => selectedClasses.has(classKey(name))))).map(item => ({
      ...item,
      value: parseFloat(item.be),
      uncertaintyValue: Number.isFinite(parseFloat(item.uncertainty)) ? parseFloat(item.uncertainty) : defaultUncertainty
    })).filter(item => Number.isFinite(item.value)).sort((a, b) => a.value - b.value || a.compound.localeCompare(b.compound));
  }

  function appendText(text, attrs = {}, parent = chart) {
    const node = createSVG("text");
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function renderChart() {
    if (!selectedCore) {
      spinOrbitInfo.hidden = true; chartContainer.hidden = true; chartPlaceholder.hidden = true; chart.innerHTML = ""; return;
    }
    const rows = coreRows(selectedCore);
    if (!rows.length) {
      spinOrbitInfo.hidden = true; chartContainer.hidden = true; chartPlaceholder.textContent = "No reference binding energies are currently available for this core level."; chartPlaceholder.hidden = false; chart.innerHTML = ""; return;
    }
    chartPlaceholder.hidden = true; chartContainer.hidden = false;
    chartTitle.textContent = `${selectedCore} — Reference binding energies`;
    updateSpinOrbitInfo();

    const rowHeight = 29;
    const referenceLineHeight = 19;
    const displayRows = rows.map(item => {
      const references = selectedId === item.id ? referenceEntries(item) : [];
      return {
        type: "detail",
        item,
        references,
        height: selectedId === item.id
          ? Math.max(44, references.length * referenceLineHeight + 8)
          : rowHeight
      };
    });
    const min = Math.floor(Math.min(...rows.map(item => item.value - item.uncertaintyValue)) - 1);
    const max = Math.ceil(Math.max(...rows.map(item => item.value + item.uncertaintyValue)) + 1);
    const width = 1100, margin = { top: 12, right: 410, bottom: 53, left: 160 };
    const plotRight = width - margin.right, infoX = plotRight + 22;
    const height = margin.top + margin.bottom + displayRows.reduce((sum, row) => sum + row.height, 0);
    chart.setAttribute("viewBox", `0 0 ${width} ${height}`); chart.innerHTML = "";
    const xScale = value => plotRight - ((value - min) / (max - min)) * (plotRight - margin.left);
    const axisY = height - margin.bottom;
    const axis = createSVG("line");
    [["x1", margin.left], ["x2", plotRight], ["y1", axisY], ["y2", axisY], ["class", "xps-axis"]].forEach(([name, value]) => axis.setAttribute(name, value)); chart.appendChild(axis);
    for (let value = min; value <= max; value += 1) {
      const x = xScale(value), tick = createSVG("line");
      [["x1", x], ["x2", x], ["y1", axisY], ["y2", axisY + 5], ["class", "xps-axis"]].forEach(([name, v]) => tick.setAttribute(name, v)); chart.appendChild(tick);
      appendText(value.toFixed(0), { x, y: axisY + 23, "text-anchor": "middle" });
    }
    appendText("Binding energy (eV)", { x: (margin.left + plotRight) / 2, y: height - 10, "text-anchor": "middle", class: "xps-axis-title" });

    let rowTop = margin.top;
    displayRows.forEach(row => {
      const y = rowTop + row.height / 2;
      rowTop += row.height;
      const item = row.item;
      const compoundLabel = appendText(item.compound, { x: margin.left - 14, y: y + 4, "text-anchor": "end", class: `xps-detail-label${selectedId === item.id ? " xps-detail-label-selected" : ""}` });
      compoundLabel.style.cursor = "pointer";
      const range = createSVG("line");
      [["x1", xScale(item.value - item.uncertaintyValue)], ["x2", xScale(item.value + item.uncertaintyValue)], ["y1", y], ["y2", y], ["class", `xps-range${selectedId === item.id ? " xps-range-selected" : ""}`]].forEach(([name, value]) => range.setAttribute(name, value));
      const selectItem = () => { selectedId = item.id; renderChart(); };
      range.addEventListener("click", selectItem); compoundLabel.addEventListener("click", selectItem); chart.appendChild(range);
      if (selectedId !== item.id) return;
      let nextX = infoX;
      if (item.assignment) {
        const assignmentX = nextX;
        const assignment = appendText(item.assignment, { x: assignmentX, y: y + 1, class: "xps-peak-assignment" });
        const copyFeedback = appendText("", { x: assignmentX, y: y + 17, class: "xps-copy-feedback" });
        copyFeedback.setAttribute("aria-live", "polite");
        assignment.setAttribute("role", "button");
        assignment.setAttribute("tabindex", "0");
        assignment.setAttribute("aria-label", `Copy reference data for ${item.compound}, ${item.assignment}`);
        assignment.setAttribute("title", "Copy reference data");
        const copyAssignment = async () => {
          try {
            await copyPlainText(clipboardText(item));
            copyFeedback.textContent = "Copied ✓";
          } catch (error) {
            copyFeedback.textContent = "Copy failed";
          }
          window.setTimeout(() => {
            if (copyFeedback.isConnected) copyFeedback.textContent = "";
          }, 1400);
        };
        assignment.addEventListener("click", copyAssignment);
        assignment.addEventListener("keydown", event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          copyAssignment();
        });
        nextX += assignment.getComputedTextLength() + 18;
      }
      const beText = appendText(`${item.value.toFixed(1)} ± ${item.uncertaintyValue.toFixed(2)} eV`, { x: nextX, y: y + 4, class: "xps-selected-value" });
      nextX += beText.getComputedTextLength() + 14;
      const references = row.references.length ? row.references : referenceEntries(item);
      const referenceStartY = y - ((references.length - 1) * referenceLineHeight) / 2;
      references.forEach((entry, index) => {
        const referenceY = referenceStartY + index * referenceLineHeight + 4;
        let referenceX = nextX;
        if (entry.reference) {
          const ref = appendText(`[${entry.reference}]`, { x: referenceX, y: referenceY, class: "xps-reference-number" });
          referenceX += ref.getComputedTextLength() + 14;
        }
        const doiURL = normalizeDOI(entry.doi);
        if (doiURL) {
          const link = createSVG("a"); link.setAttribute("href", doiURL); link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer");
          appendText("DOI ↗", { x: referenceX, y: referenceY, class: "xps-doi-link" }, link); chart.appendChild(link);
        }
      });
    });
  }

  function updateCoreSelection() {
    selectedCore = coreChoice.value; selectedId = null; selectedClasses = new Set();
    if (selectedCore) populateClassOptions(); else classFilter.hidden = true;
    renderChart();
  }
  coreChoice.addEventListener("change", updateCoreSelection);
  coreToggle.addEventListener("click", () => {
    const open = !coreMenu.hidden;
    coreMenu.hidden = open; coreToggle.setAttribute("aria-expanded", String(!open));
    if (!open) {
      coreSearch.value = "";
      filterCoreOptions();
      coreSearch.focus();
    }
  });
  function filterCoreOptions() {
    const search = normaliseCoreSearch(coreSearch.value);
    const compactSearch = search.replace(/\s+/g, "");
    let visible = 0;
    coreOptions.querySelectorAll(".xps-core-option").forEach(option => {
      const value = normaliseCoreSearch(option.dataset.search || option.textContent);
      const match = !search || value.includes(search) || value.replace(/\s+/g, "").includes(compactSearch);
      option.classList.toggle("xps-filtered-out", !match);
      if (match) visible += 1;
    });
    let empty = coreOptions.querySelector(".xps-core-empty");
    if (!empty) {
      empty = document.createElement("div"); empty.className = "xps-core-empty";
      empty.textContent = "No matching core level"; coreOptions.appendChild(empty);
    }
    empty.hidden = visible > 0;
  }
  coreSearch.addEventListener("input", filterCoreOptions);
  classToggle.addEventListener("click", () => {
    const open = !classMenu.hidden;
    classMenu.hidden = open; classToggle.setAttribute("aria-expanded", String(!open));
    if (!open) classSearch.focus();
  });
  classSearch.addEventListener("input", () => {
    const search = classSearch.value.trim().toLocaleLowerCase();
    classOptions.querySelectorAll(".xps-class-option").forEach(option => {
      option.classList.toggle("xps-filtered-out", !!search && !option.textContent.toLocaleLowerCase().includes(search));
    });
  });
  classClear.addEventListener("click", () => {
    selectedClasses = new Set();
    classOptions.querySelectorAll("input").forEach(input => { input.checked = false; });
    selectedId = null; updateClassToggle(); renderChart();
  });
  document.addEventListener("click", event => {
    if (!classFilter.contains(event.target)) {
      classMenu.hidden = true;
      classToggle.setAttribute("aria-expanded", "false");
    }
    if (!coreControl.contains(event.target)) {
      coreMenu.hidden = true;
      coreToggle.setAttribute("aria-expanded", "false");
    }
  });
  Promise.all([loadCompoundData(), loadReferenceLines()]).then(([records, lines]) => {
    rawData = records;
    referenceLines = lines;
    populateCoreOptions();
    updateCoreSelection();
  }).catch(error => {
    console.error(error);
    spinOrbitInfo.hidden = true;
    chartContainer.hidden = true;
    chartPlaceholder.textContent = "Reference database could not be loaded. Open the site through a local web server and try again.";
    chartPlaceholder.hidden = false;
  });
})();
