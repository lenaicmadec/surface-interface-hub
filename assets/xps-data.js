(function () {
  "use strict";

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    const source = String(text || "").replace(/^\uFEFF/, "");

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          value += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(value);
        value = "";
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && source[index + 1] === "\n") index += 1;
        row.push(value);
        if (row.some(cell => cell !== "")) rows.push(row);
        row = [];
        value = "";
      } else {
        value += character;
      }
    }

    row.push(value);
    if (row.some(cell => cell !== "")) rows.push(row);
    return rows;
  }

  async function loadRecords(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Reference data could not be loaded (${response.status}).`);
    const rows = parseCSV(await response.text());
    if (rows.length < 2) return [];
    const headers = rows[0].map(header => header.trim());
    return rows.slice(1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
  }

  window.XPSData = Object.freeze({ parseCSV, loadRecords });
})();
