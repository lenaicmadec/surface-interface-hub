
(function () {
  const root = document.getElementById("xps-assignments-static");
  if (!root) return;
  const scriptUrl = document.currentScript ? new URL(document.currentScript.src, document.baseURI) : new URL("./chemical-species.js", document.baseURI);

  const search = root.querySelector("#xps-assignments-static-search");
  const classControl = root.querySelector(".xps-class-control");
  const classToggle = root.querySelector(".xps-class-toggle");
  const classMenu = root.querySelector(".xps-class-menu");
  const classSearch = root.querySelector(".xps-class-search");
  const classOptions = root.querySelector(".xps-class-options");
  const classClear = root.querySelector(".xps-class-clear");
  const tableHead = root.querySelector("thead");
  const tbody = root.querySelector("tbody");
  const summary = root.querySelector(".xps-result-summary");
  const prev = root.querySelector(".xps-prev");
  const next = root.querySelector(".xps-next");
  const info = root.querySelector(".xps-page-info");
  const perPageCompound = 4;
  const perPageClass = 5;
  let currentPage = 1;
  let openCompound = "";
  let openReference = "";
  let selectedClasses = new Map();

  let data = [];
  let classData = [];

  async function loadData() {
    const [compoundRecords, classRecords] = await Promise.all([
      window.XPSData.loadRecords(new URL("../../data/compounds-core-levels-final.csv", scriptUrl)),
      window.XPSData.loadRecords(new URL("../../data/chemical-classes-final.csv", scriptUrl))
    ]);
    data = compoundRecords.map(item => ({
      compound:item["Compound"] || "", name:item["Compound name"] || "", aliases:item["Compound aliases"] || "",
      chemicalClass:item["Chemical class"] || "", core:item["Core level"] || "", be:item["Binding energy (eV)"] || "",
      uncertainty:item["Uncertainty (eV)"] || "", assignment:item["Peak assignment"] || "",
      reference:item["Reference"] || "", doi:item["DOI"] || "", calibration:item["Calibration"] || ""
    })).filter(item => item.compound && item.core && Number.isFinite(Number.parseFloat(item.be)));
    classData = classRecords.map(item => ({
      category:item["Category"] || "", chemicalClass:item["Chemical class"] || "",
      element:item["XPS element"] || "", aliases:item["Aliases"] || ""
    })).filter(item => item.chemicalClass);
    if (!data.length || !classData.length) throw new Error("Reference database is empty or has unexpected columns.");
  }

  function normalise(value) {
    return String(value || "").normalize("NFKD")
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "₀₁₂₃₄₅₆₇₈₉".indexOf(digit))
      .replace(/[−–—-]/g, "").replace(/\s+/g, "").toLowerCase();
  }
  function listIncludes(value, query) {
    return String(value || "").split(";").some(part => normalise(part) === query);
  }
  function fieldMatches(value, query) {
    const whole = normalise(value);
    if (whole === query || whole.startsWith(query)) return true;
    return String(value || "").split(/[|,;()\s]+/).some(part => normalise(part).startsWith(query));
  }
  function compoundKey(item) { return normalise(item.compound); }
  function compoundRows(key) { return data.filter(item => compoundKey(item) === key); }
  function compareCompounds(left, right) {
    return left.compound.localeCompare(right.compound, "en", {
      numeric:true,
      sensitivity:"base"
    });
  }
  function groups(rows) {
    const result = [];
    rows.forEach(item => {
      const key = compoundKey(item);
      let group = result.find(candidate => candidate.key === key);
      if (!group) { group = { key, compound:item.compound, name:item.name, rows:[] }; result.push(group); }
      group.rows.push(item);
    });
    return result.sort(compareCompounds);
  }
  function populateClassOptions() {
    const available = new Map();
    data.forEach(item => {
      String(item.chemicalClass || "").split(";").map(value => value.trim()).filter(Boolean).forEach(name => {
        const key = normalise(name);
        if (!available.has(key)) available.set(key, name);
      });
    });
    Array.from(available.entries()).sort((left, right) => left[1].localeCompare(right[1], "en", { sensitivity:"base" })).forEach(([key, name]) => {
      const metadata = classData.find(item => normalise(item.chemicalClass) === key);
      const option = document.createElement("label");
      option.className = "xps-class-option";
      option.dataset.search = `${name} ${metadata ? metadata.aliases : ""} ${metadata ? metadata.category : ""}`;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = key;
      input.checked = selectedClasses.has(key);
      input.addEventListener("change", () => {
        input.checked ? selectedClasses.set(key, name) : selectedClasses.delete(key);
        updateClassToggle();
        currentPage = 1;
        openCompound = "";
        openReference = "";
        render();
      });
      option.append(input, document.createTextNode(name));
      classOptions.appendChild(option);
    });
  }
  function updateClassToggle() {
    const count = selectedClasses.size;
    classToggle.textContent = count ? `${count} chemical ${count === 1 ? "class" : "classes"} selected` : "All chemical classes";
  }
  function queryResult() {
    const query = normalise(search.value);
    if (selectedClasses.size) {
      let rows = data.filter(item => Array.from(selectedClasses.keys()).some(key => listIncludes(item.chemicalClass, key)));
      if (query) rows = rows.filter(item => fieldMatches(item.compound, query) || fieldMatches(item.name, query) || fieldMatches(item.aliases, query));
      return { type:"class", selectedClasses:new Map(selectedClasses), groups:groups(rows) };
    }
    if (!query) return { type:"compound", groups:groups(data) };

    const exactCompounds = new Set(data.filter(item => normalise(item.compound) === query).map(compoundKey));
    if (exactCompounds.size) return { type:"compound", groups:groups(data.filter(item => exactCompounds.has(compoundKey(item)))) };

    return { type:"compound", groups:groups(data.filter(item => fieldMatches(item.compound, query) || fieldMatches(item.name, query) || fieldMatches(item.aliases, query))) };
  }
  function energy(item) { return item.uncertainty ? `${item.be} ± ${item.uncertainty}` : item.be; }
  function doiUrl(doi) { const value = String(doi || "").trim(); return !value ? "" : /^https?:\/\//.test(value) ? value : "https://doi.org/" + value; }
  function splitReferences(value) { return String(value || "").split(";").map(part => part.trim().replace(/^\[|\]$/g, "")).filter(Boolean); }
  function splitParallelValues(value) { return String(value || "").split(";").map(part => part.trim()); }
  function referencePairs(item) {
    const references = splitReferences(item.reference);
    const dois = splitReferences(item.doi);
    const calibrations = splitParallelValues(item.calibration);
    return Array.from({ length:Math.max(references.length, dois.length, calibrations.length) }, (_, index) => ({
      reference:references[index] || "",
      url:doiUrl(dois[index] || ""),
      calibration:calibrations[index] || ""
    }));
  }
  function referenceSignature(item) {
    return Array.from(new Set(referencePairs(item).map(pair => `${pair.reference}|${pair.url}|${pair.calibration}`))).sort().join("\n");
  }
  function referenceRuns(items) {
    const runs = [];
    items.forEach((item, index) => {
      const signature = referenceSignature(item);
      const previous = runs[runs.length - 1];
      if (previous && previous.signature === signature) {
        previous.items.push(item);
        previous.length += 1;
        return;
      }
      runs.push({ start:index, length:1, signature, items:[item] });
    });
    return runs;
  }
  function uniqueReferencePairs(items) {
    const unique = new Map();
    (Array.isArray(items) ? items : [items]).forEach(item => {
      referencePairs(item).forEach(pair => {
        const key = `${pair.reference}|${pair.url}|${pair.calibration}`;
        if (!unique.has(key)) unique.set(key, pair);
      });
    });
    return Array.from(unique.values());
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
  function compoundClipboardText(rows) {
    const first = rows[0];
    const lines = [`Compound: ${first.compound}`];
    if (first.name) lines.push(`Name: ${first.name}`);
    if (first.aliases) lines.push(`Aliases: ${first.aliases}`);
    if (first.chemicalClass) lines.push(`Chemical classes: ${first.chemicalClass}`);
    lines.push("", "Reported values:");
    rows.forEach(item => {
      lines.push(`- ${item.core} — ${item.assignment || "—"} — ${energy(item)} eV`);
      referencePairs(item).forEach(pair => {
        if (pair.reference) lines.push(`  Reference: [${pair.reference}]`);
        if (pair.url) lines.push(`  DOI: ${pair.url}`);
        lines.push(`  Calibration: ${pair.calibration || "Not reported"}`);
      });
    });
    return lines.join("\n");
  }
  function copyButton(rows) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "xps-copy-compound";
    button.textContent = "Copy";
    button.title = "Copy all compound reference data";
    button.setAttribute("aria-label", `Copy all reference data for ${rows[0].compound}`);
    button.addEventListener("click", async () => {
      try {
        await copyPlainText(compoundClipboardText(rows));
        button.textContent = "Copied ✓";
        button.classList.add("xps-copy-success");
      } catch (error) {
        button.textContent = "Copy failed";
      }
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = "Copy";
        button.classList.remove("xps-copy-success");
      }, 1400);
    });
    return button;
  }
  function cell(text, className) { const td = document.createElement("td"); if (className) td.className = className; td.textContent = text || "—"; return td; }
  function referenceCell(items, toggleKey) {
    const td = document.createElement("td"); td.className = "xps-reference";
    td.classList.add(Array.isArray(items) ? "xps-reference-shared" : "xps-reference-row");
    const pairs = uniqueReferencePairs(items);
    if (!pairs.length) { td.textContent = "—"; td.classList.add("xps-empty"); return td; }
    const list = document.createElement("div"); list.className = "xps-reference-list";
    pairs.forEach(item => {
      const line = document.createElement("div"); line.className = "xps-reference-item";
      if (item.reference) { const number = document.createElement("span"); number.className = "xps-ref-number"; number.textContent = `[${item.reference}]`; line.appendChild(number); }
      if (item.url) { const link = document.createElement("a"); link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.className = "xps-doi-link"; link.textContent = "DOI ↗"; line.appendChild(link); }
      list.appendChild(line);
    });
    const toggle = document.createElement("button");
    const expanded = openReference === toggleKey;
    toggle.type = "button";
    toggle.className = "xps-reference-toggle";
    if (expanded) toggle.classList.add("xps-reference-toggle-open");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3.5 6 8 10.5 12.5 6");
    icon.appendChild(path); toggle.appendChild(icon);
    toggle.title = expanded ? "Hide reference details" : "Show reference details";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", `${expanded ? "Hide" : "Show"} calibration details`);
    toggle.addEventListener("click", () => {
      openReference = expanded ? "" : toggleKey;
      render();
    });
    td.append(list, toggle);
    return td;
  }
  function referenceDetailRow(items, columnCount) {
    const tr = document.createElement("tr"); tr.className = "xps-reference-detail-row";
    const td = document.createElement("td"); td.colSpan = columnCount;
    const detail = document.createElement("div"); detail.className = "xps-reference-detail";
    const heading = document.createElement("strong"); heading.textContent = "Calibration";
    detail.appendChild(heading);
    uniqueReferencePairs(items).forEach(pair => {
      const block = document.createElement("div"); block.className = "xps-reference-detail-item";
      const label = document.createElement("span"); label.className = "xps-reference-detail-label";
      label.textContent = pair.reference ? `Ref. [${pair.reference}]:` : "Reference:";
      const calibration = document.createElement("span");
      calibration.textContent = pair.calibration || "Not reported";
      block.append(label, calibration); detail.appendChild(block);
    });
    td.appendChild(detail); tr.appendChild(td); return tr;
  }
  function compoundButton(item) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "xps-compound-link"; button.textContent = item.compound;
    button.setAttribute("aria-expanded", String(openCompound === compoundKey(item)));
    button.addEventListener("click", () => {
      openCompound = openCompound === compoundKey(item) ? "" : compoundKey(item);
      openReference = "";
      render();
    });
    return button;
  }
  function detailRow(key, columnCount = 4) {
    const rows = compoundRows(key);
    const runs = referenceRuns(rows);
    const runByStart = new Map(runs.map(run => [run.start, run]));
    const tr = document.createElement("tr"); tr.className = "xps-detail-row";
    const td = document.createElement("td"); td.colSpan = columnCount;
    const detail = document.createElement("div"); detail.className = "xps-compound-detail";
    const heading = document.createElement("p"); heading.className = "xps-detail-heading"; heading.textContent = rows[0].compound;
    if (rows[0].name) { const name = document.createElement("span"); name.textContent = rows[0].name; heading.appendChild(name); }
    heading.appendChild(copyButton(rows));
    detail.appendChild(heading);
    const table = document.createElement("table"); table.className = "xps-detail-table";
    table.innerHTML = "<thead><tr><th>Core level</th><th>Peak assignment</th><th class=\"xps-energy\">Binding energy (eV)</th><th class=\"xps-reference-heading\">Reference</th></tr></thead>";
    const body = document.createElement("tbody");
    rows.forEach((item, index) => {
      const row = document.createElement("tr");
      row.append(cell(item.core), cell(item.assignment, "xps-assignment"), cell(energy(item), "xps-energy"));
      const run = runByStart.get(index);
      if (run) {
        const reference = referenceCell(run.items.length > 1 ? run.items : item, `detail:${key}:run:${run.start}`);
        reference.rowSpan = run.length;
        row.append(reference);
      }
      body.appendChild(row);
    });
    const selectedRun = runs.find(run => openReference === `detail:${key}:run:${run.start}`);
    if (selectedRun) body.appendChild(referenceDetailRow(selectedRun.items, 4));
    table.appendChild(body); detail.appendChild(table); td.appendChild(detail); tr.appendChild(td);
    return tr;
  }
  function renderCompound(groupsToShow) {
    tableHead.innerHTML = "<tr><th>Chemical Species</th><th>Core level</th><th>Peak assignment</th><th class=\"xps-energy\">Binding energy (eV)</th><th class=\"xps-reference-heading\">Reference</th></tr>";
    const totalPages = Math.max(1, Math.ceil(groupsToShow.length / perPageCompound)); currentPage = Math.min(currentPage, totalPages);
    groupsToShow.slice((currentPage - 1) * perPageCompound, currentPage * perPageCompound).forEach(group => {
      const runs = referenceRuns(group.rows);
      const runByStart = new Map(runs.map(run => [run.start, run]));
      group.rows.forEach((item, index) => {
      const tr = document.createElement("tr");
      if (index === 0) {
        const compound = cell(group.compound, "xps-compound"); compound.rowSpan = group.rows.length;
        const formula = document.createElement("span"); formula.textContent = group.compound;
        compound.textContent = "";
        const heading = document.createElement("span"); heading.className = "xps-compound-heading"; heading.append(formula, copyButton(group.rows));
        compound.appendChild(heading);
        if (group.name) { const name = document.createElement("span"); name.className = "xps-compound-name"; name.textContent = group.name; compound.appendChild(name); }
        tr.appendChild(compound);
      }
      tr.append(cell(item.core), cell(item.assignment, "xps-assignment"), cell(energy(item), "xps-energy"));
      const run = runByStart.get(index);
      if (run) {
        const reference = referenceCell(run.items.length > 1 ? run.items : item, `${group.key}:run:${run.start}`);
        reference.rowSpan = run.length;
        tr.append(reference);
      }
      tbody.appendChild(tr);
      });
      const selectedRun = runs.find(run => openReference === `${group.key}:run:${run.start}`);
      if (selectedRun) tbody.appendChild(referenceDetailRow(selectedRun.items, 5));
    });
    return { total:groupsToShow.length, totalPages, noun:"species" };
  }
  function renderClass(result) {
    tableHead.innerHTML = "<tr><th>Chemical class</th><th>Chemical species</th><th>Reported core levels</th><th>Reported peak assignments</th></tr>";
    const totalPages = Math.max(1, Math.ceil(result.groups.length / perPageClass)); currentPage = Math.min(currentPage, totalPages);
    let detailShown = false;
    result.groups.slice((currentPage - 1) * perPageClass, currentPage * perPageClass).forEach(group => {
      const item = group.rows[0]; const tr = document.createElement("tr");
      const matchingClasses = String(item.chemicalClass || "").split(";").map(value => value.trim()).filter(name => result.selectedClasses.has(normalise(name)));
      tr.append(cell(matchingClasses.join(" · "), "xps-class"));
      const compound = document.createElement("td");
      if (openCompound === group.key) compound.className = "xps-compound-selected";
      const heading = document.createElement("span"); heading.className = "xps-compound-heading";
      heading.append(compoundButton(item), copyButton(group.rows)); compound.appendChild(heading);
      if (item.name) { const name = document.createElement("span"); name.className = "xps-compound-name"; name.textContent = item.name; compound.appendChild(name); }
      const coreLevels = Array.from(new Set(group.rows.map(row => row.core))).join(" · ");
      const assignments = Array.from(new Set(group.rows.map(row => row.assignment))).join(" · ");
      tr.append(compound, cell(coreLevels), cell(assignments, "xps-assignment")); tbody.appendChild(tr);
      if (openCompound === group.key && !detailShown) { tbody.appendChild(detailRow(group.key, 4)); detailShown = true; }
    });
    return { total:result.groups.length, totalPages, noun:"species" };
  }
  function renderEmpty() { tableHead.innerHTML = "<tr><th>Results</th></tr>"; const tr = document.createElement("tr"); const td = document.createElement("td"); td.colSpan = 5; td.textContent = "No results"; td.style.textAlign = "center"; tr.appendChild(td); tbody.appendChild(tr); return { total:0, totalPages:1, noun:"results" }; }
  function render() {
    const result = queryResult(); tbody.innerHTML = "";
    root.classList.toggle("xps-class-results", result.type === "class");
    let view;
    if (result.type === "class") view = renderClass(result);
    else if (result.groups.length) view = renderCompound(result.groups);
    else view = renderEmpty();
    const query = search.value.trim();
    summary.textContent = result.type === "class" ? `Chemical ${result.selectedClasses.size === 1 ? "class" : "classes"}: ${Array.from(result.selectedClasses.values()).join(" · ")}` : query ? `Chemical species results for “${query}”` : `${view.total} chemical species in the database`;
    info.textContent = view.total ? `Page ${currentPage} / ${view.totalPages} — ${view.total} ${view.noun}` : "No results";
    prev.disabled = currentPage <= 1; next.disabled = currentPage >= view.totalPages;
  }
  search.addEventListener("input", () => { currentPage = 1; openCompound = ""; openReference = ""; render(); });
  classToggle.addEventListener("click", () => {
    const open = !classMenu.hidden;
    classMenu.hidden = open;
    classToggle.setAttribute("aria-expanded", String(!open));
    if (!open) {
      classSearch.value = "";
      classOptions.querySelectorAll(".xps-class-option").forEach(option => { option.classList.remove("xps-filtered-out"); });
      classOptions.classList.remove("xps-class-options-empty");
      classSearch.focus();
    }
  });
  classSearch.addEventListener("input", () => {
    const query = normalise(classSearch.value);
    let visible = 0;
    classOptions.querySelectorAll(".xps-class-option").forEach(option => {
      const match = !query || normalise(option.dataset.search).includes(query);
      option.classList.toggle("xps-filtered-out", !match);
      if (match) visible += 1;
    });
    classOptions.classList.toggle("xps-class-options-empty", visible === 0);
  });
  classClear.addEventListener("click", () => {
    selectedClasses.clear();
    classOptions.querySelectorAll("input[type=checkbox]").forEach(input => { input.checked = false; });
    updateClassToggle();
    currentPage = 1;
    openCompound = "";
    openReference = "";
    render();
  });
  document.addEventListener("click", event => {
    if (!classControl.contains(event.target)) {
      classMenu.hidden = true;
      classToggle.setAttribute("aria-expanded", "false");
    }
  });
  prev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; openReference = ""; render(); } });
  next.addEventListener("click", () => { currentPage++; openReference = ""; render(); });
  loadData().then(() => {
    populateClassOptions();
    render();
  }).catch(error => {
    console.error(error);
    summary.textContent = "Reference database could not be loaded. Open the site through a local web server and try again.";
    tbody.innerHTML = "";
    renderEmpty();
  });
})();
