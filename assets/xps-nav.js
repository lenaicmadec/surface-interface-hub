(function () {
  "use strict";

  const scriptUrl = document.currentScript
    ? new URL(document.currentScript.src, document.baseURI)
    : new URL("../assets/xps-nav.js", document.baseURI);
  const root = new URL("../", scriptUrl);
  const href = path => new URL(path, root).href;
  const groups = [
    { label: "Hub", items: [{ key: "home", label: "Home", path: "" }] },
    {
      label: "Resources",
      landingPath: "resources/",
      items: [
        { key: "batteries", label: "Batteries", path: "resources/batteries/" },
        { key: "sei", label: "SEI & Surface Analysis", path: "resources/sei/" },
        { key: "xps", label: "XPS", path: "resources/xps/" }
      ]
    },
    {
      label: "Database",
      landingPath: "database/",
      items: [
        { key: "element", label: "Element", path: "database/element/" },
        { key: "core-level", label: "Core Level", path: "database/core-level/" },
        { key: "chemical-species", label: "Chemical Species", path: "database/chemical-species/" }
      ]
    },
    {
      label: "Tools",
      landingPath: "tools/",
      items: [
        { key: "vamas-dataset-builder", label: "VAMAS Dataset Builder", path: "tools/vamas-dataset-builder/app/" },
        { key: "spectrum-identification", label: "Spectrum Identification", path: "tools/spectrum-identification/app/" },
        { key: "figure-builder", label: "Figure Builder", path: "tools/figure-builder/app/" }
      ]
    },
    { label: "About", landingPath: "about/", items: [{ key: "about", label: "Project & Contact", path: "about/" }] }
  ];

  const siteGroups = [
    {
      label: "Resources",
      landingPath: "resources/",
      icon: ["M4 5.5h5.5A3.5 3.5 0 0 1 13 9v10H7.5A3.5 3.5 0 0 0 4 20V5.5Z", "M20 5.5h-5.5A3.5 3.5 0 0 0 11 9v10h5.5A3.5 3.5 0 0 1 20 20V5.5Z"],
      items: groups.find(group => group.label === "Resources").items
    },
    {
      label: "Database",
      landingPath: "database/",
      icon: ["M5 5c0 1.7 3.1 3 7 3s7-1.3 7-3-3.1-3-7-3-7 1.3-7 3Z", "M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5", "M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"],
      items: groups.find(group => group.label === "Database").items
    },
    {
      label: "Tools",
      landingPath: "tools/",
      icon: ["M3 19h18", "M4 18l3-1 2-4 2 3 2-10 2 9 2-5 3 7"],
      items: groups.find(group => group.label === "Tools").items.map(item => ({
        ...item,
        path: item.key === "vamas-dataset-builder" ? "tools/vamas-dataset-builder/" : item.key === "spectrum-identification" ? "tools/spectrum-identification/" : "tools/figure-builder/"
      }))
    },
    {
      label: "About",
      landingPath: "about/",
      icon: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 10v7", "M12 7h.01"],
      items: groups.find(group => group.label === "About").items
    }
  ];

  function normalizedPath(value) {
    return new URL(value, document.baseURI).pathname.replace(/index\.html$/, "").replace(/\/+$/, "/");
  }

  function siteIcon(paths) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    paths.forEach(value => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", value);
      svg.appendChild(path);
    });
    return svg;
  }

  function renderSiteSidebar() {
    const sidebar = document.querySelector(".hubSidebar");
    if (!sidebar) return;
    const current = normalizedPath(window.location.href);
    const fragment = document.createDocumentFragment();
    const home = document.createElement("a");
    home.className = `hubHomeLink${current === normalizedPath(href("")) ? " active" : ""}`;
    home.href = href("");
    home.textContent = "Home";
    if (home.classList.contains("active")) home.setAttribute("aria-current", "page");
    fragment.appendChild(home);

    siteGroups.forEach(group => {
      const block = document.createElement("div");
      block.className = "hubSideGroup";
      const title = document.createElement(group.landingPath ? "a" : "div");
      title.className = "hubSideTitle";
      if (group.landingPath) {
        title.href = href(group.landingPath);
        if (current === normalizedPath(title.href)) {
          title.classList.add("active");
          title.setAttribute("aria-current", "page");
        }
      }
      title.append(siteIcon(group.icon), document.createTextNode(group.label));
      const links = document.createElement("div");
      links.className = "hubSideLinks";
      group.items.forEach(item => {
        const link = document.createElement("a");
        link.href = href(item.path);
        link.textContent = item.label;
        if (current === normalizedPath(link.href)) {
          link.className = "active";
          link.setAttribute("aria-current", "page");
        }
        links.appendChild(link);
      });
      block.append(title, links);
      fragment.appendChild(block);
    });
    sidebar.replaceChildren(fragment);
  }

  function renderNavigation() {
    const navigation = document.querySelector("[data-xps-nav]");
    if (!navigation) return;

    const active = navigation.dataset.active || "";
    const current = normalizedPath(window.location.href);
    const brand = document.createElement("a");
    brand.className = "hubHomeLink";
    brand.href = href("");
    brand.textContent = "Home";
    if (current === normalizedPath(brand.href)) {
      brand.classList.add("active");
      brand.setAttribute("aria-current", "page");
    }
    const fragment = document.createDocumentFragment();
    fragment.appendChild(brand);

    siteGroups.forEach(siteGroup => {
      const group = groups.find(candidate => candidate.label === siteGroup.label);
      if (!group) return;
      const block = document.createElement("div");
      block.className = "hubSideGroup";
      const title = document.createElement(group.landingPath ? "a" : "div");
      title.className = "hubSideTitle";
      if (group.landingPath) {
        title.href = href(group.landingPath);
        const landing = normalizedPath(title.href);
        if (current === landing || current.startsWith(landing)) title.classList.add("active");
      }
      title.append(siteIcon(siteGroup.icon), document.createTextNode(group.label));
      block.appendChild(title);

      const links = document.createElement("div");
      links.className = "hubSideLinks";
      group.items.forEach(item => {
        const link = document.createElement("a");
        link.href = href(item.path);
        link.textContent = item.label;
        if (item.key === active) {
          link.className = "active";
          link.setAttribute("aria-current", "page");
        }
        links.appendChild(link);
      });
      block.appendChild(links);
      fragment.appendChild(block);
    });
    navigation.replaceChildren(fragment);
  }

  function renderTopNavigation() {
    const navigation = document.querySelector(".hubTopNav");
    if (!navigation) return;
    const rootPath = normalizedPath(root.href);
    const currentPath = normalizedPath(window.location.href);
    const relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
    const section = relativePath.split("/").filter(Boolean)[0] || "home";
    const toolSections = new Set(["tools"]);
    const items = [
      { key: "home", label: "Home", path: "" },
      { key: "resources", label: "Resources", path: "resources/" },
      { key: "database", label: "Database", path: "database/" },
      { key: "tools", label: "Tools", path: "tools/" },
      { key: "about", label: "About", path: "about/" }
    ];
    const active = toolSections.has(section) ? "tools" : section;
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const link = document.createElement("a");
      link.href = href(item.path);
      link.textContent = item.label;
      if (item.key === active) {
        link.className = "active";
        link.setAttribute("aria-current", "page");
      }
      fragment.appendChild(link);
    });
    navigation.replaceChildren(fragment);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch (error) {
        // Use the selection-based fallback below when Clipboard API access fails.
      }
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
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

  function ensureShareButton() {
    const topbar = document.querySelector(".hubTopbar");
    if (!topbar) return;

    const existingButton = topbar.querySelector("[data-share-page]");
    if (existingButton) {
      activateShareButton(existingButton);
      return;
    }

    let actions = topbar.querySelector(".hubActions");
    const theme = topbar.querySelector(".hubTheme");
    if (!actions && theme) {
      actions = document.createElement("div");
      actions.className = "hubActions";
      theme.parentNode.insertBefore(actions, theme);
      actions.appendChild(theme);
    }
    if (!actions) return;

    const button = document.createElement("button");
    button.className = "hubShare";
    button.type = "button";
    button.dataset.sharePage = "";
    button.textContent = "Share";
    button.setAttribute("aria-label", "Share this page");
    actions.insertBefore(button, actions.firstChild);
    activateShareButton(button);
  }

  function activateShareButton(button) {
    if (button.dataset.shareReady === "true") return;
    button.dataset.shareReady = "true";
    button.addEventListener("click", async () => {
      const original = button.textContent;
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, url: window.location.href });
        } else {
          await copyText(window.location.href);
          button.textContent = "Link copied";
        }
      } catch (error) {
        if (error && error.name !== "AbortError") button.textContent = "Unable to share";
      }
      window.setTimeout(() => {
        button.textContent = original;
      }, 1400);
    });
  }

  function initialize() {
    renderTopNavigation();
    renderNavigation();
    renderSiteSidebar();
    ensureShareButton();
    document.querySelectorAll(".suiteVersion").forEach(version => {
      if (version.querySelector("svg")) return;
      version.classList.add("appVersionIcon");
      const versionIcon = siteIcon(["M3 6.5V3h3.5L17 13.5 13.5 17 3 6.5Z", "M6.1 6.1h.01"]);
      versionIcon.setAttribute("viewBox", "0 0 20 20");
      version.prepend(versionIcon);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
