/* Application shell: navigation, hash routing, data loading and event wiring. */
(function () {
  "use strict";

  const ICON = UI.icon;

  const NAV = [
    { group: "Workspace", items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard" },
      { id: "assistant", label: "Formula Assistant", icon: "assistant" },
      { id: "library", label: "Formula Library", icon: "library" },
    ]},
    { group: "Tools", items: [
      { id: "upload", label: "Excel File Upload", icon: "upload" },
      { id: "playground", label: "Formula Playground", icon: "playground" },
      { id: "compare", label: "Compare Formulas", icon: "compare" },
    ]},
    { group: "Personal", items: [
      { id: "favorites", label: "Favorites", icon: "favorites", badge: "favorites" },
      { id: "templates", label: "Templates", icon: "templates" },
    ]},
    { group: "More", items: [
      { id: "community", label: "Community", icon: "community" },
      { id: "help", label: "Help & About", icon: "help" },
    ]},
  ];

  const App = {
    state: {
      categories: [],
      formulas: [],
      comparisons: [],
      templates: [],
      community: [],
      health: null,
      pendingQuery: null,
      pendingCategory: null,
      pendingCompare: null,
      currentPage: "dashboard",
    },
  };

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = NAV.map(function (section) {
      return (
        '<div class="nav-group-label">' + UI.esc(section.group) + "</div>" +
        section.items.map(function (item) {
          return (
            '<button class="nav-item" data-nav="' + item.id + '">' +
              ICON(item.icon) + "<span>" + UI.esc(item.label) + "</span>" +
              (item.badge ? '<span class="nav-badge" data-badge="' + item.badge + '"></span>' : "") +
            "</button>"
          );
        }).join("")
      );
    }).join("");
  }

  function updateBadges() {
    const badge = document.querySelector('[data-badge="favorites"]');
    if (badge) badge.textContent = Store.getFavorites().length;
  }

  function setActiveNav(page) {
    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("data-nav") === page);
    });
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("backdrop").classList.remove("show");
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    if (!raw) return { page: "dashboard", params: {} };
    const parts = raw.split("?");
    const page = parts[0] || "dashboard";
    const params = {};
    if (parts[1]) {
      parts[1].split("&").forEach(function (pair) {
        const kv = pair.split("=");
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
      });
    }
    return { page: page, params: params };
  }

  App.go = function (page, params, replace) {
    const query = Object.keys(params || {}).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    const hash = "#/" + page + (query ? "?" + query : "");
    if (replace || location.hash === hash) {
      if (location.hash !== hash) location.hash = hash;
      else App.render();
    } else {
      location.hash = hash;
    }
  };

  App.render = async function () {
    const route = parseHash();
    const known = Object.keys(Pages).indexOf(route.page) !== -1 && typeof Pages[route.page] === "function";
    const page = known ? route.page : "dashboard";
    App.state.currentPage = page;

    if (page === "assistant" && route.params.query) App.state.pendingQuery = route.params.query;
    if (page === "library" && route.params.category) App.state.pendingCategory = route.params.category;
    if (page === "compare" && route.params.left && route.params.right) {
      App.state.pendingCompare = [route.params.left, route.params.right];
    }

    setActiveNav(page);
    updateBadges();
    document.getElementById("view").scrollTop = 0;
    window.scrollTo(0, 0);
    try {
      await Pages[page](document.getElementById("view"));
    } catch (err) {
      document.getElementById("view").innerHTML =
        '<div class="notice error">Failed to render this page: ' + UI.esc(err.message) + "</div>";
    }
  };

  function showFormulaModal(id) {
    const formula = App.state.formulas.find(function (f) { return f.id === id; });
    if (!formula) { UI.toast("Formula not found: " + id, "error"); return; }
    Store.addRecent(formula.id);
    updateBadges();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal">' +
        '<button class="icon-btn modal-close" aria-label="Close">' + ICON("plus") + "</button>" +
        UI.formulaDetail(formula) +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector(".modal-close").addEventListener("click", function () { overlay.remove(); });
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", escHandler); }
    });
  }
  App.showFormulaModal = showFormulaModal;

  function wireGlobalEvents() {
    document.addEventListener("click", function (e) {
      const navBtn = e.target.closest("[data-nav]");
      if (navBtn) { App.go(navBtn.getAttribute("data-nav"), {}); closeSidebar(); return; }

      const category = e.target.closest("[data-category]");
      if (category) { App.go("library", { category: category.getAttribute("data-category") }); closeSidebar(); return; }

      const fav = e.target.closest("[data-fav]");
      if (fav) {
        e.stopPropagation();
        const id = fav.getAttribute("data-fav");
        const added = Store.toggleFavorite(id);
        UI.toast(added ? "Added to favorites" : "Removed from favorites", added ? "success" : "");
        updateBadges();
        if (App.state.currentPage === "favorites") App.render();
        else updateFavButtons(id, added);
        return;
      }

      const copy = e.target.closest("[data-copy]");
      if (copy) { e.stopPropagation(); UI.copyText(copy.getAttribute("data-copy")); return; }

      const open = e.target.closest("[data-open]");
      if (open) { showFormulaModal(open.getAttribute("data-open")); return; }
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("open");
      document.getElementById("backdrop").classList.toggle("show");
    });
    document.getElementById("backdrop").addEventListener("click", closeSidebar);
    window.addEventListener("hashchange", App.render);
  }

  function updateFavButtons(id, added) {
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (btn) {
      btn.classList.toggle("fav-on", added);
      if (btn.classList.contains("btn")) {
        btn.innerHTML = ICON("star") + (added ? "Saved" : "Save");
      }
    });
  }

  async function loadData() {
    const results = await Promise.all([
      API.categories(),
      API.formulas(),
      API.comparisons(),
      API.templates(),
      API.community(),
      API.health(),
    ]);
    App.state.categories = results[0];
    App.state.formulas = results[1];
    App.state.comparisons = results[2];
    App.state.templates = results[3];
    App.state.community = results[4];
    App.state.health = results[5];
  }

  async function checkHealth() {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("statusText");
    try {
      const health = await API.health();
      App.state.health = health;
      dot.className = "status-dot online";
      text.textContent = "Server online · " + health.formula_count + " formulas";
    } catch (err) {
      dot.className = "status-dot offline";
      text.textContent = "Server offline";
    }
  }

  async function init() {
    document.getElementById("menuToggle").innerHTML = ICON("menu");
    buildNav();
    wireGlobalEvents();
    document.getElementById("view").innerHTML =
      '<div class="card"><span class="spinner"></span> Loading formula library…</div>';
    try {
      await loadData();
    } catch (err) {
      document.getElementById("view").innerHTML =
        '<div class="notice error">Could not load data from the server: ' + UI.esc(err.message) +
        "<br>Start the backend with <code>uvicorn app.main:app --reload</code> and refresh.</div>";
      return;
    }
    checkHealth();
    if (!location.hash) location.hash = "#/dashboard";
    await App.render();
  }

  window.App = App;
  document.addEventListener("DOMContentLoaded", init);
})();
