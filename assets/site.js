(function () {
  "use strict";

  const databaseSearch = document.querySelector(".databaseLanding .databaseSearch");
  if (!databaseSearch || databaseSearch.querySelector(".databaseCopyNote")) return;

  const headingIcon = databaseSearch.querySelector(".sectionHeading svg");
  if (headingIcon) {
    headingIcon.replaceChildren();
    [
      "M5 5c0 1.7 3.1 3 7 3s7-1.3 7-3-3.1-3-7-3-7 1.3-7 3Z",
      "M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5",
      "M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"
    ].forEach(value => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", value);
      headingIcon.appendChild(path);
    });
  }

  const note = document.createElement("p");
  note.className = "databaseCopyNote";
  note.textContent = "Compound and reference data can be copied directly from the Core Level and Chemical Species searches.";
  databaseSearch.appendChild(note);
})();
