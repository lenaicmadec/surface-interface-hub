
(function () {
  const root = document.getElementById("xps-element-lines-static");
  if (!root) return;

  const sourceSelect = root.querySelector("#xps-element-lines-static-source");

  const lineFilterButtons =
    Array.from(
      root.querySelectorAll(
        ".xps-line-filter [data-line-filter]"
      )
    );
  const chartContainer = root.querySelector(".xps-element-chart-container");
  const chartTitle = root.querySelector(".xps-element-chart-title");
  const chart = root.querySelector(".xps-element-chart");
  const legend = root.querySelector(".xps-element-legend");
  const expandButton = root.querySelector(".xps-expand-button");
  const photoButton = root.querySelector(".xps-photo-button");
  const chartWrapper = root.querySelector(".xps-element-chart-wrapper");

  const spectrumModal =
    root.querySelector(".xps-spectrum-modal");

  const spectrumModalBackdrop =
    root.querySelector(".xps-spectrum-modal-backdrop");

  const spectrumModalBody =
    root.querySelector(".xps-spectrum-modal-body");
const lineInfo = root.querySelector(".xps-line-info");
  const lineInfoMain = root.querySelector(".xps-line-info-main");

  const palette = [
    "#14b8a6",  // turquoise / green
    "#f59e0b",  // orange
    "#60a5fa",  // blue
    "#6d28d9",  // deep violet
    "#ec4899",  // pink / magenta
    "#dc2626"   // red
  ];
  const maxSelected = palette.length;

  const sources = {
    Al: {
      label: "Al Kα",
      photonEnergy: 1486.6,
      scofieldLibrary: "ALSCOF",
      xraySource: "Al Kα"
    },
    Mg: {
      label: "Mg Kα",
      photonEnergy: 1253.6,
      scofieldLibrary: "MGSCOF",
      xraySource: "Mg Kα"
    }
  };

  const rawData = Array.from(
    root.querySelectorAll(".xps-element-raw-data span")
  ).map((item, index) => ({
    id: index,
    element: item.dataset.element,
    transition: item.dataset.transition,
    augerGroup: item.dataset.augerGroup,
    lineType: item.dataset.lineType,
    energyType: item.dataset.energyType,
    energy: parseFloat(item.dataset.energy),
    library: item.dataset.library,
    source: item.dataset.source,
    sensitivity: parseFloat(item.dataset.sensitivity)
  }));

  const selectedElements = [];
  const colourAssignments = new Map();
  let selectedLineId = null;
  let selectedAugerGroupKey = null;
  let selectedXpsGroupKey = null;

  let lineFilter = "both";
  let viewMinBE = 0;
  let viewMaxBE = 1500;
  let draggingSpectrum = false;
  let dragStartX = 0;
  let dragStartMin = 0;
  let dragStartMax = 1500;

  /*
   * Current lines displayed in the survey.
   * Used by grouped XPS click logic outside renderChart().
   */
  let currentLines = [];

  const availableElements = new Set(rawData.map(item => item.element));
  const elementButtons = Array.from(root.querySelectorAll("[data-element]"));

  const svgNS = "http://www.w3.org/2000/svg";
  const createSVG = tag => document.createElementNS(svgNS, tag);

  function cleanSensitivity(value) {
    if (!Number.isFinite(value) || value < 0 || value > 1000) return null;
    return value;
  }

  function firstFreeColourIndex() {
    const used = new Set(colourAssignments.values());
    for (let i = 0; i < palette.length; i++) {
      if (!used.has(i)) return i;
    }
    return -1;
  }

  function colourFor(element) {
    const i = colourAssignments.get(element);
    return i === undefined ? palette[0] : palette[i];
  }

  function flashSelectionLimit() {
    const instruction = root.querySelector(".xps-source-instruction");
    if (!instruction) return;
    instruction.classList.add("xps-limit-flash");
    setTimeout(() => instruction.classList.remove("xps-limit-flash"), 700);
  }

  elementButtons.forEach(button => {
    const element = button.dataset.element;
    if (!availableElements.has(element)) button.disabled = true;

    button.addEventListener("click", () => {
      const index = selectedElements.indexOf(element);

      if (index !== -1) {
        selectedElements.splice(index, 1);
        colourAssignments.delete(element);
      } else {
        if (selectedElements.length >= maxSelected) {
          flashSelectionLimit();
          return;
        }
        selectedElements.push(element);
        colourAssignments.set(element, firstFreeColourIndex());
      }

      selectedLineId = null;
      selectedAugerGroupKey = null;
      lineInfo.hidden = true;

      updatePeriodicTable();
      renderChart();
    });
  });

  function updatePeriodicTable() {
    elementButtons.forEach(button => {
      const element = button.dataset.element;
      const selected = selectedElements.includes(element);
      button.classList.toggle("xps-element-selected", selected);

      if (selected) {
        button.style.setProperty("--xps-element-color", colourFor(element));
      } else {
        button.style.removeProperty("--xps-element-color");
      }
    });
  }

  function removeAggregateLines(lines) {
    const transitions = new Set(lines.map(item => item.transition));

    return lines.filter(item => {
      const match = item.transition.match(/^(\d+)([pdf])$/);
      if (!match) return true;

      const shell = match[1];
      const orbital = match[2];
      let splitTransitions;

      if (orbital === "p") {
        splitTransitions = [
          shell + "p1",
          shell + "p3",
          shell + "p1/2",
          shell + "p3/2"
        ];
      }

      else if (orbital === "d") {
        splitTransitions = [
          shell + "d3",
          shell + "d5",
          shell + "d3/2",
          shell + "d5/2"
        ];
      }

      else if (orbital === "f") {
        splitTransitions = [
          shell + "f5",
          shell + "f7",
          shell + "f5/2",
          shell + "f7/2"
        ];
      }

      else return true;

      return !splitTransitions.some(
        t => transitions.has(t)
      );
    });
  }

  function getXPSLines(element, source) {
    const sourceInfo = sources[source];

    const candidates = rawData.filter(item =>
      item.element === element &&
      item.lineType.toLowerCase() === "xps" &&
      item.energyType.toUpperCase() === "BE"
    );

    const transitionMap = new Map();

    candidates.forEach(item => {
      let priority = 0;

      if (item.library === sourceInfo.scofieldLibrary) priority = 3;
      else if (item.source === sourceInfo.xraySource) priority = 2;

      if (!priority) return;

      const current = transitionMap.get(item.transition);
      if (!current || priority > current.priority) {
        transitionMap.set(item.transition, { ...item, priority });
      }
    });

    return removeAggregateLines(Array.from(transitionMap.values()))
      .map(item => ({
        ...item,
        bindingEnergy: item.energy,
        sensitivity: cleanSensitivity(item.sensitivity)
      }));
  }

  function getAugerLines(element, source) {
    const sourceInfo = sources[source];

    const candidates = rawData.filter(item =>
      item.element === element &&
      item.lineType.toLowerCase() === "auger" &&
      item.energyType.toUpperCase() === "KE"
    );

    const transitionMap = new Map();

    candidates.forEach(item => {
      let priority = 0;

      if (item.source === sourceInfo.xraySource) priority = 4;
      else if (item.library === "AUGQNT") priority = 3;
      else if (item.source === "Any") priority = 1;

      if (!priority) return;

      const current = transitionMap.get(item.transition);
      if (!current || priority > current.priority) {
        transitionMap.set(item.transition, { ...item, priority });
      }
    });

    return Array.from(transitionMap.values())
      .map(item => ({
        ...item,
        bindingEnergy: sourceInfo.photonEnergy - item.energy,
        sensitivity: cleanSensitivity(item.sensitivity)
      }))
      .filter(item =>
        Number.isFinite(item.bindingEnergy) &&
        item.bindingEnergy >= 0 &&
        item.bindingEnergy <= sourceInfo.photonEnergy
      );
  }

  const augerGroupKey = (element, groupName) => `${element}|${groupName}`;

  function setInfoColour(colour) {
    lineInfo.style.setProperty("--xps-info-color", colour);
  }

  function showLineInfo(item) {
    lineInfo.hidden = false;
    setInfoColour(colourFor(item.element));

    const isAuger =
      item.lineType.toLowerCase() === "auger";

    const displayName =
      isAuger
        ? (item.augerGroup || item.transition)
        : item.transition;

    lineInfoMain.textContent =
      `${item.element} ${displayName} — ${item.bindingEnergy.toFixed(1)} eV`;
  }

  function showAugerGroupInfo(group) {
    lineInfo.hidden = false;
    setInfoColour(group.colour);

    const energies = group.items
      .map(entry => entry.item.bindingEnergy)
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    lineInfoMain.textContent =
      `${group.element} ${group.groupName} — ` +
      `${energies.map(value => value.toFixed(1)).join(" | ")} eV`;
  }


  function xpsSpinGroupFor(item) {
    if (!item || item.lineType.toLowerCase() === "auger") return null;

    const match = String(item.transition).match(/^(\d+)([pdf])([1357])\/2$/i);
    if (!match) return null;

    const shell = `${match[1]}${match[2].toLowerCase()}`;

    const members = currentLines
      .filter(entry =>
        entry.element === item.element &&
        entry.lineType.toLowerCase() !== "auger"
      )
      .filter(entry =>
        new RegExp(`^${shell}[1357]\\/2$`, "i").test(String(entry.transition))
      )
      .sort((a, b) => {
        const left = String(a.transition).match(/([1357])\/2$/);
        const right = String(b.transition).match(/([1357])\/2$/);
        return Number(right ? right[1] : 0) - Number(left ? left[1] : 0) ||
          a.bindingEnergy - b.bindingEnergy;
      });

    if (members.length < 2) return null;

    return {
      key: `${item.element}|${shell}`,
      element: item.element,
      shell,
      colour: colourFor(item.element),
      items: members
    };
  }


  function showXpsGroupInfo(group) {
    lineInfo.hidden = false;
    setInfoColour(group.colour);

    const transitions =
      group.items
        .map(item => String(item.transition));

    let names =
      transitions.join(" | ");

    /*
     * Compact spin-orbit notation:
     * 3p3/2 + 3p1/2 -> 3p3/2-1/2
     * 3d5/2 + 3d3/2 -> 3d5/2-3/2
     * 4f7/2 + 4f5/2 -> 4f7/2-5/2
     */
    if (transitions.length >= 2) {
      const first =
        transitions[0].match(/^(\d+[pdf])(\d\/2)$/i);

      const sameShell =
        first &&
        transitions.every(transition =>
          transition.startsWith(first[1])
        );

      if (sameShell) {
        names =
          first[1] +
          transitions
            .map(transition => transition.slice(first[1].length))
            .join("-");
      }
    }

    const energies =
      group.items
        .map(item => item.bindingEnergy);

    const energyText =
      energies
        .map(value => value.toFixed(1))
        .join(" | ");

    const deltaE =
      energies.length >= 2
        ? Math.abs(
            energies[0] -
            energies[energies.length - 1]
          )
        : null;

    lineInfoMain.textContent =
      `${group.element} ${names} — ${energyText} eV` +
      (
        deltaE !== null
          ? ` | ΔE = ${deltaE.toFixed(1)} eV`
          : ""
      );
  }


  function selectLine(item) {
    const xpsGroup = xpsSpinGroupFor(item);

    selectedAugerGroupKey = null;

    if (xpsGroup) {
      selectedLineId = null;
      selectedXpsGroupKey = xpsGroup.key;
      showXpsGroupInfo(xpsGroup);
    } else {
      selectedXpsGroupKey = null;
      selectedLineId = item.id;
      showLineInfo(item);
    }

    renderChart();
  }


  function selectAugerGroup(group) {
    selectedLineId = null;
    selectedXpsGroupKey = null;
    selectedAugerGroupKey = group.key;
    showAugerGroupInfo(group);
    renderChart();
  }


  function addLineClick(node, item, augerGroup = null) {
    node.addEventListener(
      "click",
      () => {
        if (augerGroup) selectAugerGroup(augerGroup);
        else selectLine(item);
      }
    );
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



  function renderChart() {
    if (!selectedElements.length) {
      currentLines = [];

      chartContainer.hidden = true;
      chart.innerHTML = "";
      legend.innerHTML = "";
      lineInfo.hidden = true;
      return;
    }

    const source = sourceSelect.value;
    const sourceInfo = sources[source];

    let lines = [];

    selectedElements.forEach(element => {
      const elementColour = colourFor(element);

      lines.push(
        ...getXPSLines(element, source).map(item => ({ ...item, elementColour })),
        ...getAugerLines(element, source).map(item => ({ ...item, elementColour }))
      );
    });

    if (lineFilter !== "both") {
      lines = lines.filter(
        item => item.lineType.toLowerCase() === lineFilter
      );
    }

    lines = lines
      .filter(item => Number.isFinite(item.bindingEnergy) && item.bindingEnergy >= viewMinBE && item.bindingEnergy <= viewMaxBE)
      .sort((a, b) => b.bindingEnergy - a.bindingEnergy);

    currentLines =
      lines;

    if (!lines.length) {
      chartContainer.hidden = true;
      return;
    }

    chartContainer.hidden = false;
    chartTitle.textContent =
      `${selectedElements.join(" + ")} — ${sourceInfo.label} element lines`;

    renderLegend();

    const maxBE = viewMaxBE;
    const minBE = viewMinBE;
    const spanBE = Math.max(40, maxBE - minBE);
    const width = 1000;

    const expandedView =
      spectrumModal &&
      !spectrumModal.hidden &&
      spectrumModalBody &&
      spectrumModalBody.contains(chartContainer);

    /*
     * Expanded mode uses larger labels, so give them more headroom.
     * Normal mode stays compact.
     */
    const height =
      expandedView
        ? 390
        : 330;

    const margin = {
      top:
        expandedView
          ? 85
          : 56,
      right: 30,
      bottom: 58,
      left: 30
    };

    const baselineY = height - margin.bottom;
    const peakMaxHeight = baselineY - margin.top;

    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.innerHTML = "";

    const xScale = value =>
      margin.left +
      ((maxBE - value) / spanBE) *
      (width - margin.left - margin.right);

    // Axis
    const axis = createSVG("line");
    axis.setAttribute("x1", margin.left);
    axis.setAttribute("x2", width - margin.right);
    axis.setAttribute("y1", baselineY);
    axis.setAttribute("y2", baselineY);
    axis.setAttribute("class", "xps-axis");
    chart.appendChild(axis);

    const tickStep = spanBE <= 250 ? 20 : spanBE <= 600 ? 50 : 100;
    const firstTick = Math.floor(maxBE / tickStep) * tickStep;
    for (let value = firstTick; value >= minBE; value -= tickStep) {
      const x = xScale(value);

      const tick = createSVG("line");
      tick.setAttribute("x1", x);
      tick.setAttribute("x2", x);
      tick.setAttribute("y1", baselineY);
      tick.setAttribute("y2", baselineY + 4);
      tick.setAttribute("class", "xps-axis");
      chart.appendChild(tick);

      const tickLabel = createSVG("text");
      tickLabel.setAttribute("x", x);
      tickLabel.setAttribute("y", baselineY + 24);
      tickLabel.setAttribute("text-anchor", "middle");
      tickLabel.setAttribute("class", "xps-tick-label");
      tickLabel.textContent = value;
      chart.appendChild(tickLabel);
    }

    const axisLabel = createSVG("text");
    axisLabel.setAttribute("x", width / 2);
    axisLabel.setAttribute("y", height - 6);
    axisLabel.setAttribute("text-anchor", "middle");
    axisLabel.setAttribute("class", "xps-axis-label");
    axisLabel.textContent = "Binding energy (eV)";
    chart.appendChild(axisLabel);

    // Global RSF normalization
    const sensitivities = lines
      .map(item => item.sensitivity)
      .filter(value => Number.isFinite(value) && value > 0);

    const maxSensitivity = sensitivities.length
      ? Math.max(...sensitivities)
      : 1;

    // Build Auger groups before drawing so every Auger stick can
    // immediately open the complete group information.
    const augerGroupsForClick = new Map();

    lines
      .filter(item => item.lineType.toLowerCase() === "auger")
      .forEach(item => {
        const groupName = item.augerGroup || item.transition;
        const key = augerGroupKey(item.element, groupName);

        if (!augerGroupsForClick.has(key)) {
          augerGroupsForClick.set(key, {
            key,
            element: item.element,
            groupName,
            colour: item.elementColour,
            items: []
          });
        }

        augerGroupsForClick.get(key).items.push({ item });
      });

    // Draw every individual stick first.
    const renderedLines = [];

    lines.forEach(item => {
      const x = xScale(item.bindingEnergy);
      const relative =
        Number.isFinite(item.sensitivity) && item.sensitivity > 0
          ? item.sensitivity / maxSensitivity
          : 0.10;

      const stickHeight = Math.max(
        11,
        Math.min(
          relative * peakMaxHeight,
          peakMaxHeight * 0.82
        )
      );

      const peakY = baselineY - stickHeight;
      const isAuger = item.lineType.toLowerCase() === "auger";
      const groupName = isAuger
        ? (item.augerGroup || item.transition)
        : null;
      const groupKey = isAuger ? augerGroupKey(item.element, groupName) : null;

      const stick = createSVG("line");
      stick.setAttribute("x1", x);
      stick.setAttribute("x2", x);
      stick.setAttribute("y1", baselineY);
      stick.setAttribute("y2", peakY);
      stick.setAttribute("class", isAuger ? "xps-stick-auger" : "xps-stick-xps");
      stick.style.stroke = item.elementColour;

      const xpsGroup = !isAuger ? xpsSpinGroupFor(item) : null;

      if (
        selectedLineId === item.id ||
        (selectedAugerGroupKey && selectedAugerGroupKey === groupKey) ||
        (selectedXpsGroupKey && xpsGroup && selectedXpsGroupKey === xpsGroup.key)
      ) {
        stick.classList.add("xps-stick-selected");
      }

      if (isAuger) {
        stick.addEventListener(
          "click",
          () => {
            const group = augerGroupsForClick.get(groupKey);
            if (group) selectAugerGroup(group);
          }
        );
      } else {
        addLineClick(stick, item);
      }

      chart.appendChild(stick);

      renderedLines.push({
        item,
        x,
        peakY,
        isAuger,
        groupName,
        groupKey,
        colour: item.elementColour
      });
    });

    // Build label candidates.
    // XPS: one label per transition.
    // Auger: one label per group (KLL, LMM, MNN, NOO...).
    const labelCandidates = [];

    renderedLines
      .filter(entry => !entry.isAuger)
      .forEach(entry => {
        labelCandidates.push({
          kind: "xps",
          label: entry.item.transition,
          x: entry.x,
          baseY: entry.peakY - 9,
          bindingEnergy: entry.item.bindingEnergy,
          colour: entry.colour,
          item: entry.item
        });
      });

    const augerGroups = new Map();

    renderedLines
      .filter(entry => entry.isAuger)
      .forEach(entry => {
        if (!augerGroups.has(entry.groupKey)) {
          augerGroups.set(entry.groupKey, {
            key: entry.groupKey,
            element: entry.item.element,
            groupName: entry.groupName,
            colour: entry.colour,
            items: []
          });
        }
        augerGroups.get(entry.groupKey).items.push(entry);
      });

    augerGroups.forEach(group => {
      let weightedX = 0;
      let weightedBE = 0;
      let weightSum = 0;
      let topY = Infinity;

      group.items.forEach(entry => {
        const weight =
          Number.isFinite(entry.item.sensitivity) && entry.item.sensitivity > 0
            ? entry.item.sensitivity
            : 1;

        weightedX += entry.x * weight;
        weightedBE += entry.item.bindingEnergy * weight;
        weightSum += weight;
        topY = Math.min(topY, entry.peakY);
      });

      labelCandidates.push({
        kind: "auger-group",
        label: group.groupName,
        x: weightedX / weightSum,
        baseY: topY - 10,
        bindingEnergy: weightedBE / weightSum,
        colour: group.colour,
        group
      });
    });

    // High BE -> low BE = left -> right on the reversed XPS axis.
    labelCandidates.sort((a, b) => b.bindingEnergy - a.bindingEnergy);

    /*
     * Draw labels using the REAL rendered SVG text bounds.
     *
     * This is more robust than estimating character widths:
     * the browser tells us the actual box for "2s", "3p3/2",
     * "LMM", etc. in the current font and current view.
     *
     * The X coordinate never moves away from the true energy.
     * If a label collides, it is moved only upward.
     */

    const placedLabelBoxes =
      [];

    const labelVerticalStep =
      24;

    const labelPaddingX =
      5;

    const labelPaddingY =
      3;


    function paddedBox(box) {

      return {
        left:
          box.x -
          labelPaddingX,

        right:
          box.x +
          box.width +
          labelPaddingX,

        top:
          box.y -
          labelPaddingY,

        bottom:
          box.y +
          box.height +
          labelPaddingY
      };

    }


    function boxesOverlap(
      a,
      b
    ) {

      return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
      );

    }


    labelCandidates.forEach(
      candidate => {

        const label =
          createSVG(
            "text"
          );

        label.setAttribute(
          "x",
          candidate.x
        );

        label.setAttribute(
          "text-anchor",
          "middle"
        );

        label.setAttribute(
          "class",
          "xps-line-name"
        );

        label.style.fill =
          candidate.colour;

        label.textContent =
          candidate.label;


        /*
         * Start immediately above the corresponding line/group.
         */
        let labelY =
          Math.max(
            18,
            candidate.baseY
          );

        label.setAttribute(
          "y",
          labelY
        );


        /*
         * Append first so getBBox() returns the real rendered size.
         */
        chart.appendChild(
          label
        );


        let attempts =
          0;

        while (
          attempts < 20
        ) {

          const box =
            paddedBox(
              label.getBBox()
            );

          const collides =
            placedLabelBoxes.some(
              placed =>
                boxesOverlap(
                  box,
                  placed
                )
            );


          if (
            !collides
          ) {

            placedLabelBoxes.push(
              box
            );

            break;

          }


          labelY -=
            labelVerticalStep;

          label.setAttribute(
            "y",
            labelY
          );

          attempts +=
            1;

        }


        /*
         * Keep labels inside the SVG if a pathological cluster
         * needs many levels.
         */
        if (
          labelY < 18
        ) {

          labelY =
            18;

          label.setAttribute(
            "y",
            labelY
          );

        }


        if (
          candidate.kind ===
          "xps"
        ) {

          addLineClick(
            label,
            candidate.item
          );

        }

        else {

          label.addEventListener(
            "click",
            () =>
              selectAugerGroup(
                candidate.group
              )
          );

        }

      }
    );


    // Restore the info box after redraw.
    if (selectedLineId !== null) {
      const item = lines.find(line => line.id === selectedLineId);
      if (item) showLineInfo(item);
      else {
        selectedLineId = null;
        lineInfo.hidden = true;
      }
    } else if (selectedAugerGroupKey) {
      const group = augerGroups.get(selectedAugerGroupKey);
      if (group) showAugerGroupInfo(group);
      else {
        selectedAugerGroupKey = null;
        lineInfo.hidden = true;
      }
    } else if (selectedXpsGroupKey) {
      const representative = lines.find(item => {
        const group = xpsSpinGroupFor(item);
        return group && group.key === selectedXpsGroupKey;
      });

      const group = representative
        ? xpsSpinGroupFor(representative)
        : null;

      if (group) showXpsGroupInfo(group);
      else {
        selectedXpsGroupKey = null;
        lineInfo.hidden = true;
      }
    }
  }

  const chartHome =
    document.createComment("xps-chart-home");

  chartContainer.parentNode.insertBefore(
    chartHome,
    chartContainer
  );


  function openExpandedSpectrum() {

    if (
      !spectrumModal ||
      !spectrumModalBody ||
      selectedElements.length === 0
    ) {
      return;
    }

    spectrumModal.hidden = false;

    spectrumModalBody.appendChild(
      chartContainer
    );

    /*
     * Re-render after moving into the modal so collision detection
     * uses the expanded font sizes and available display context.
     */
    renderChart();

    expandButton.textContent =
      "↙ Collapse";

    expandButton.title =
      "Collapse spectrum";

    expandButton.setAttribute(
      "aria-expanded",
      "true"
    );

    document.documentElement.style.overflow =
      "hidden";

  }


  function closeExpandedSpectrum() {

    if (
      !spectrumModal ||
      spectrumModal.hidden
    ) {
      return;
    }

    chartHome.parentNode.insertBefore(
      chartContainer,
      chartHome.nextSibling
    );

    spectrumModal.hidden = true;

    /*
     * Re-render again for the normal-size font metrics.
     */
    renderChart();

    expandButton.textContent =
      "⛶ Expand";

    expandButton.title =
      "Expand spectrum";

    expandButton.setAttribute(
      "aria-expanded",
      "false"
    );

    document.documentElement.style.overflow =
      "";

  }


  if (expandButton) {

    expandButton.addEventListener(
      "click",
      () => {

        if (
          spectrumModal &&
          !spectrumModal.hidden
        ) {
          closeExpandedSpectrum();
        }

        else {
          openExpandedSpectrum();
        }

      }
    );

  }
if (spectrumModalBackdrop) {
    spectrumModalBackdrop.addEventListener(
      "click",
      closeExpandedSpectrum
    );
  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        spectrumModal &&
        !spectrumModal.hidden
      ) {
        closeExpandedSpectrum();
      }

    }
  );


  lineFilterButtons.forEach(button => {
    button.addEventListener("click", () => {
      lineFilter = button.dataset.lineFilter || "both";

      lineFilterButtons.forEach(candidate => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", active ? "true" : "false");
      });

      selectedLineId = null;
      selectedAugerGroupKey = null;
      selectedXpsGroupKey = null;
      lineInfo.hidden = true;

      renderChart();
    });
  });


  sourceSelect.addEventListener("change", () => {
    closeExpandedSpectrum();

    selectedLineId = null;
    selectedAugerGroupKey = null;
    lineInfo.hidden = true;
    renderChart();
  });

  if(lineInfo){
    lineInfo.title = 'Click to copy selected line information';
    lineInfo.addEventListener('click', async () => {
      const text = (lineInfoMain?.textContent || '').trim();
      if(!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        const area=document.createElement('textarea');
        area.value=text; area.style.position='fixed'; area.style.opacity='0';
        document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      }
      lineInfo.classList.add('is-copied');
      setTimeout(()=>lineInfo.classList.remove('is-copied'),900);
    });
  }

  updatePeriodicTable();
  renderChart();


  function exportSpectrumPng(){
    if(!chart || chartContainer.hidden) return;

    const serializer = new XMLSerializer();
    const clone = chart.cloneNode(true);
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');

    const vb = (chart.getAttribute('viewBox') || '0 0 1000 330').split(/\s+/).map(Number);
    const w = vb[2] || 1000;
    const h = vb[3] || 330;

    const rootStyle = getComputedStyle(root);
    const docStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.color || '#e8edf5';
    const mutedColor = docStyle.getPropertyValue('--muted').trim() || '#9ca3af';
    const bgColor = docStyle.getPropertyValue('--plot-bg').trim() || docStyle.getPropertyValue('--bg').trim() || '#0b1220';

    /* Serialized SVGs do not carry the page stylesheet with them.  Embed the
       theme-dependent styles needed by the exported spectrum. */
    const defs = document.createElementNS(svgNS,'defs');
    const style = document.createElementNS(svgNS,'style');
    style.textContent = `
      text{fill:${textColor};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
      .xps-axis{stroke:${mutedColor};stroke-width:1}
      .xps-tick-label{fill:${textColor};font-size:15px;opacity:.85}
      .xps-axis-label{fill:${textColor};font-size:20px;font-weight:600}
      .xps-line-name{font-size:14px;font-weight:700}
      .xps-stick-xps,.xps-stick-auger{stroke-width:4;opacity:.84}
      .xps-stick-selected{stroke-width:8;opacity:1}
    `;
    defs.appendChild(style);
    clone.insertBefore(defs, clone.firstChild);

    const svgText = serializer.serializeToString(clone);
    const blob = new Blob([svgText],{type:'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const scale = 2;
      const headerH = 82;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = (h + headerH) * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0,0,w,h+headerH);

      /* Title */
      ctx.fillStyle = textColor;
      ctx.font = '700 18px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((chartTitle?.textContent || 'XPS element lines').trim(), w/2, 18);

      /* Legend */
      let lx = 18;
      const ly = 47;
      ctx.textAlign = 'left';
      ctx.font = '600 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      selectedElements.forEach(element => {
        ctx.fillStyle = colourFor(element);
        ctx.fillRect(lx, ly-2, 18, 3);
        lx += 24;
        ctx.fillStyle = textColor;
        ctx.fillText(element, lx, ly);
        lx += Math.max(30, ctx.measureText(element).width + 18);
      });

      /* Selected transition / group information */
      const infoText = !lineInfo.hidden ? (lineInfoMain?.textContent || '').trim() : '';
      if(infoText){
        const infoStyle = getComputedStyle(lineInfo);
        const infoColor = infoStyle.color || docStyle.getPropertyValue('--accent').trim() || textColor;
        ctx.font = '600 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
        const boxW = Math.min(w - 36, Math.max(190, ctx.measureText(infoText).width + 28));
        const boxX = (w - boxW)/2;
        const boxY = 36;
        const boxH = 28;
        ctx.strokeStyle = infoColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(boxX,boxY,boxW,boxH,6);
        else ctx.rect(boxX,boxY,boxW,boxH);
        ctx.stroke();
        ctx.fillStyle = infoColor;
        ctx.textAlign = 'center';
        ctx.fillText(infoText,w/2,boxY+boxH/2+1);
      }

      /* The SVG is the current chart state, so this preserves the active zoom/pan. */
      ctx.drawImage(img,0,headerH,w,h);

      canvas.toBlob(out => {
        if(!out) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(out);
        a.download = `XPS_element_lines_${selectedElements.join('-') || 'spectrum'}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href),500);
      },'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  if(photoButton) photoButton.addEventListener('click',exportSpectrumPng);

  if(chartWrapper){
    chartWrapper.addEventListener('wheel',event=>{
      if(!selectedElements.length)return;
      event.preventDefault();
      const rect=chartWrapper.getBoundingClientRect();
      const frac=Math.min(1,Math.max(0,(event.clientX-rect.left)/Math.max(1,rect.width)));
      const span=viewMaxBE-viewMinBE;
      const factor=event.deltaY>0?1.18:0.84;
      let newSpan=Math.min(1500,Math.max(80,span*factor));
      const anchor=viewMaxBE-frac*span;
      let newMax=anchor+frac*newSpan;
      let newMin=newMax-newSpan;
      if(newMax>1500){newMin-=newMax-1500;newMax=1500;}
      if(newMin<0){newMax-=newMin;newMin=0;}
      viewMinBE=Math.max(0,newMin); viewMaxBE=Math.min(1500,newMax);
      renderChart();
    },{passive:false});
    chartWrapper.addEventListener('pointerdown',event=>{
      if(!selectedElements.length)return;
      if(event.target.closest?.('.xps-stick-xps, .xps-stick-auger, .xps-line-name')) return;
      draggingSpectrum=true;
      dragStartX=event.clientX;
      dragStartMin=viewMinBE;
      dragStartMax=viewMaxBE;
      chartWrapper.classList.add('is-dragging');
      chartWrapper.setPointerCapture?.(event.pointerId);
    });
    chartWrapper.addEventListener('pointermove',event=>{
      if(!draggingSpectrum)return;
      const rect=chartWrapper.getBoundingClientRect(); const span=dragStartMax-dragStartMin;
      const delta=(event.clientX-dragStartX)/Math.max(1,rect.width)*span;
      let min=dragStartMin+delta,max=dragStartMax+delta;
      if(max>1500){min-=max-1500;max=1500;} if(min<0){max-=min;min=0;}
      viewMinBE=min;viewMaxBE=max;renderChart();
    });
    const endDrag=()=>{draggingSpectrum=false;chartWrapper.classList.remove('is-dragging')};
    chartWrapper.addEventListener('pointerup',endDrag);chartWrapper.addEventListener('pointercancel',endDrag);chartWrapper.addEventListener('pointerleave',event=>{if(event.buttons===0)endDrag()});
  }
})();
