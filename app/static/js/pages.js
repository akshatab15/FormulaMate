/* Page renderers. Each function renders into the #view element. */
(function () {
  "use strict";

  const ICON = UI.icon;
  const esc = UI.esc;

  const POPULAR = ["sum", "average", "if", "vlookup", "countif", "xlookup"];

  function byId(id) {
    return App.state.formulas.find(function (f) { return f.id === id; }) || null;
  }

  function formulaMap() {
    const map = {};
    App.state.formulas.forEach(function (f) { map[f.id] = f; });
    return map;
  }

  function setHeader(title, subtitle, actionsHtml) {
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = subtitle || "";
    document.getElementById("headerActions").innerHTML = actionsHtml || "";
  }

  /* ------------------------------ Dashboard ------------------------------ */
  async function dashboard(view) {
    setHeader("Dashboard", "Overview of your formula workspace");
    const favorites = Store.getFavorites();
    const recent = Store.getRecent().map(byId).filter(Boolean);
    const categories = App.state.categories;

    const categoryCards = categories.map(function (c) {
      const count = App.state.formulas.filter(function (f) { return f.category === c.id; }).length;
      return (
        '<button class="category-card" data-category="' + esc(c.id) + '">' +
          '<span class="category-icon">' + UI.categoryIcon(c.icon) + "</span>" +
          "<strong>" + esc(c.name) + "</strong>" +
          "<span>" + esc(c.description) + "</span>" +
          '<span class="badge gray">' + count + " formulas</span>" +
        "</button>"
      );
    }).join("");

    const popular = POPULAR.map(byId).filter(Boolean).map(UI.formulaCard).join("");

    const recentHtml = recent.length
      ? '<div class="list">' + recent.map(function (f) {
          return (
            '<div class="list-item">' +
              '<div class="li-main"><strong>' + esc(f.name) + "</strong><p>" + esc(f.description) + "</p></div>" +
              '<button class="btn small" data-open="' + esc(f.id) + '">View</button>' +
            "</div>"
          );
        }).join("") + "</div>"
      : emptyState("No formulas viewed yet", "Open a formula from the library or use the assistant to see it here.");

    view.innerHTML =
      '<div class="welcome">' +
        "<h1>Find the right Excel formula in seconds</h1>" +
        "<p>Describe what you want to calculate in plain English (or Hindi/Marathi keywords) and the assistant matches it to a predefined formula with syntax, explanation and examples.</p>" +
        '<div class="search-box mt-16">' +
          '<input type="text" id="dashSearch" placeholder="e.g. Calculate the total of cells A1 to A10" />' +
          '<button class="btn primary" id="dashSearchBtn">' + ICON("search") + "Find formula</button>" +
        "</div>" +
      "</div>" +

      '<div class="stat-grid mt-16">' +
        stat(App.state.formulas.length, "Formulas in library") +
        stat(categories.length, "Categories") +
        stat(favorites.length, "Saved favorites") +
        stat(recent.length, "Recently viewed") +
      "</div>" +

      '<div class="card mt-24">' +
        '<div class="card-header"><h2>Formula categories</h2></div>' +
        '<div class="grid auto">' + categoryCards + "</div>" +
      "</div>" +

      '<div class="grid cols-2 mt-24">' +
        '<div class="card">' +
          '<div class="card-header"><h2>Quick actions</h2></div>' +
          '<div class="grid cols-2">' +
            quickAction("upload", "Analyse a file", "Upload .xlsx or .csv and get formula suggestions.") +
            quickAction("favorites", "Saved favorites", "Your bookmarked formulas, stored locally.") +
            quickAction("playground", "Formula playground", "Try sample values with safe simulations.") +
            quickAction("templates", "Templates", "Ready-made sheets for common tasks.") +
          "</div>" +
        "</div>" +
        '<div class="card">' +
          '<div class="card-header"><h2>Recently viewed</h2>' +
            '<div class="spacer"></div>' +
            '<button class="btn small ghost" id="clearRecent">Clear</button></div>' +
          recentHtml +
        "</div>" +
      "</div>" +

      '<div class="card mt-24">' +
        '<div class="card-header"><h2>Popular formulas</h2>' +
          '<div class="spacer"></div>' +
          '<button class="btn small ghost" data-nav="library">Browse all ' + ICON("arrow") + "</button></div>" +
        '<div class="grid auto">' + popular + "</div>" +
      "</div>";

    view.querySelector("#dashSearchBtn").addEventListener("click", function () {
      const value = view.querySelector("#dashSearch").value.trim();
      App.go("assistant", { query: value });
    });
    view.querySelector("#dashSearch").addEventListener("keydown", function (e) {
      if (e.key === "Enter") view.querySelector("#dashSearchBtn").click();
    });
    const clear = view.querySelector("#clearRecent");
    if (clear) clear.addEventListener("click", function () { Store.clearRecent(); App.render(); });
  }

  function stat(value, label) {
    return '<div class="stat"><div class="stat-value">' + value + '</div><div class="stat-label">' + esc(label) + "</div></div>";
  }

  function quickAction(page, title, desc) {
    return (
      '<button class="category-card" data-nav="' + esc(page) + '">' +
        '<span class="category-icon">' + ICON(page === "upload" ? "upload" : page) + "</span>" +
        "<strong>" + esc(title) + "</strong><span>" + esc(desc) + "</span>" +
      "</button>"
    );
  }

  function emptyState(title, text) {
    return (
      '<div class="empty-state">' + ICON("info") +
        "<h3>" + esc(title) + "</h3><p>" + esc(text) + "</p></div>"
    );
  }

  /* ------------------------------ Assistant ------------------------------ */
  async function assistant(view) {
    setHeader("Formula Assistant", "Ask in plain language");
    const examples = [
      "Calculate the total of cells A1 to A10",
      "Count how many students scored above 60",
      "Average marks of students",
      "Lookup product price from an order id",
      "Find the second highest value",
      "Combine first name and last name",
      "How many days between two dates",
    ];

    view.innerHTML =
      '<div class="card">' +
        '<div class="search-box">' +
          '<textarea id="assistantInput" rows="2" placeholder="Describe what you want to calculate…"></textarea>' +
          '<button class="btn primary" id="assistantBtn">' + ICON("assistant") + "Ask assistant</button>" +
        "</div>" +
        '<div class="chips mt-16">' + examples.map(function (ex) {
          return '<button class="chip" data-example="' + esc(ex) + '">' + esc(ex) + "</button>";
        }).join("") + "</div>" +
        '<div class="notice info mt-16">' + ICON("info") +
          " This assistant uses rule-based keyword matching against a predefined formula library - no AI service is used, and it never invents a formula it cannot match." +
        "</div>" +
      "</div>" +
      '<div id="assistantResults" class="mt-24"></div>';

    const input = view.querySelector("#assistantInput");
    const button = view.querySelector("#assistantBtn");

    function run() {
      const query = input.value.trim();
      if (!query) { UI.toast("Type a question first", "error"); return; }
      App.go("assistant", { query: query }, true);
    }
    button.addEventListener("click", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); }
    });
    view.querySelectorAll("[data-example]").forEach(function (chip) {
      chip.addEventListener("click", function () { input.value = chip.getAttribute("data-example"); run(); });
    });

    if (App.state.pendingQuery) {
      const q = App.state.pendingQuery;
      App.state.pendingQuery = null;
      input.value = q;
      await runAssistant(q, view.querySelector("#assistantResults"));
    }
  }

  async function runAssistant(query, container) {
    container.innerHTML = '<div class="card"><span class="spinner"></span> Matching your question…</div>';
    let result;
    try {
      result = await API.search(query);
    } catch (err) {
      container.innerHTML = '<div class="notice error">' + esc(err.message) + "</div>";
      return;
    }

    if (!result.matched) {
      container.innerHTML =
        '<div class="card">' +
          '<div class="card-header"><h2>No confident match</h2></div>' +
          '<div class="notice warn">' + esc(result.message) + "</div>" +
          "<p class=\"muted mt-16\">Try one of these starting points:</p>" +
          '<div class="chips">' +
            ["Sum of a range", "Count with a condition", "Average of numbers", "Lookup a value", "Extract text"]
              .map(function (s) { return '<button class="chip" data-nav="library">' + esc(s) + "</button>"; }).join("") +
          "</div>" +
        "</div>";
      return;
    }

    const primary = result.primary;
    Store.addRecent(primary.id);
    const confidenceBadge = '<span class="badge amber">Confidence ' + Math.round(result.confidence * 100) + "%</span>";
    const altHtml = result.alternatives.length
      ? '<div class="card mt-16"><div class="card-header"><h3>Alternative matches</h3></div>' +
        '<div class="grid auto">' + result.alternatives.map(UI.formulaCard).join("") + "</div></div>"
      : "";
    const relatedHtml = result.related.length
      ? '<div class="card mt-16"><div class="card-header"><h3>Related formulas</h3></div>' +
        '<div class="chips">' + result.related.map(function (r) {
            return '<button class="chip" data-open="' + esc(r.id) + '">' + esc(r.name) + "</button>";
          }).join("") + "</div></div>"
      : "";

    container.innerHTML =
      '<div class="row between mb-8"><span class="small-text muted">Results for: <strong>' + esc(result.query) + "</strong></span>" + confidenceBadge + "</div>" +
      UI.formulaDetail(primary) +
      (result.matched_keywords.length
        ? '<div class="notice mt-16 small-text">Matched keywords: ' +
          result.matched_keywords.map(esc).join(", ") + "</div>"
        : "") +
      altHtml + relatedHtml;
  }

  /* ------------------------------- Library ------------------------------- */
  let libCategory = "all";
  let libQuery = "";

  async function library(view) {
    setHeader("Formula Library", App.state.formulas.length + " predefined formulas");
    const tabs = [{ id: "all", name: "All" }].concat(App.state.categories);

    view.innerHTML =
      '<div class="card">' +
        '<div class="tabs" id="libTabs">' + tabs.map(function (c) {
          return '<button class="tab' + (c.id === libCategory ? " active" : "") + '" data-cat="' + esc(c.id) + '">' +
            esc(c.name) + "</button>";
        }).join("") + "</div>" +
        '<div class="search-box">' +
          '<input type="text" id="libSearch" placeholder="Search formulas by name, description or keyword…" value="' + esc(libQuery) + '" />' +
        "</div>" +
      "</div>" +
      '<div id="libResults" class="grid auto mt-24"></div>';

    function paint() {
      const q = libQuery.toLowerCase();
      const list = App.state.formulas.filter(function (f) {
        const catOk = libCategory === "all" || f.category === libCategory;
        if (!catOk) return false;
        if (!q) return true;
        return (f.name + " " + f.description + " " + (f.keywords || []).join(" ")).toLowerCase().indexOf(q) !== -1;
      });
      const box = view.querySelector("#libResults");
      if (!list.length) {
        box.className = "mt-24";
        box.innerHTML = emptyState("No formulas found", "Try a different search term or category.");
        return;
      }
      box.className = "grid auto mt-24";
      box.innerHTML = list.map(UI.formulaCard).join("");
    }

    view.querySelectorAll("[data-cat]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        libCategory = tab.getAttribute("data-cat");
        view.querySelectorAll("[data-cat]").forEach(function (t) { t.classList.toggle("active", t === tab); });
        paint();
      });
    });
    const search = view.querySelector("#libSearch");
    search.addEventListener("input", function () { libQuery = search.value; paint(); });
    paint();

    if (App.state.pendingCategory) {
      libCategory = App.state.pendingCategory;
      App.state.pendingCategory = null;
      view.querySelectorAll("[data-cat]").forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-cat") === libCategory);
      });
      paint();
    }
  }

  /* -------------------------------- Upload ------------------------------- */
  async function upload(view) {
    setHeader("Excel File Upload", "Analyse .xlsx or .csv and get formula suggestions");
    view.innerHTML =
      '<div class="card">' +
        '<div class="upload-zone" id="dropZone">' + ICON("upload") +
          '<p>Drop a <strong>.xlsx</strong> or <strong>.csv</strong> file here, or click to browse</p>' +
          "<small>Max size 5 MB · files are analysed in memory and never stored</small>" +
        "</div>" +
        '<input type="file" id="fileInput" accept=".xlsx,.csv" class="hidden" />' +
      "</div>" +
      '<div id="uploadResults" class="mt-24"></div>';

    const zone = view.querySelector("#dropZone");
    const input = view.querySelector("#fileInput");
    zone.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () { if (input.files[0]) handle(input.files[0]); });
    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); zone.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); zone.classList.remove("dragover"); });
    });
    zone.addEventListener("drop", function (e) {
      const file = e.dataTransfer.files[0];
      if (file) handle(file);
    });

    async function handle(file) {
      const results = view.querySelector("#uploadResults");
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
        results.innerHTML = '<div class="notice error">Unsupported file type. Please upload a .xlsx or .csv file.</div>';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        results.innerHTML = '<div class="notice error">File is too large. Maximum allowed size is 5 MB.</div>';
        return;
      }
      results.innerHTML = '<div class="card"><span class="spinner"></span> Analysing ' + esc(file.name) + "…</div>";
      let data;
      try {
        data = await API.analyzeFile(file);
      } catch (err) {
        results.innerHTML = '<div class="notice error">' + esc(err.message) + "</div>";
        return;
      }
      render(results, data);
    }

    function render(results, data) {
      const sheets = data.sheets;
      let sheetHtml = "";
      sheets.forEach(function (sheet, index) {
        const headers = sheet.headers.map(function (h, i) {
          const type = sheet.types[i] || "text";
          return "<th>" + esc(h) + '<br><span class="badge ' + (type === "number" ? "blue" : "gray") + '">' + esc(type) + "</span></th>";
        }).join("");
        const rows = sheet.preview.map(function (row) {
          return "<tr>" + sheet.headers.map(function (h) {
            return "<td>" + esc(row[h]) + "</td>";
          }).join("") + "</tr>";
        }).join("");
        sheetHtml +=
          '<div class="card mt-16">' +
            '<div class="card-header"><h3>' + esc(sheet.name) + "</h3>" +
              '<span class="badge gray">' + sheet.row_count + " data rows</span></div>" +
            '<div class="table-scroll"><table class="data-table"><thead><tr>' + headers + "</tr></thead><tbody>" +
              (rows || '<tr><td colspan="' + Math.max(1, sheet.headers.length) + '">No rows to preview</td></tr>') +
            "</tbody></table></div>" +
          "</div>";
      });

      const suggestions = data.suggestions.length
        ? '<div class="card mt-16"><div class="card-header"><h3>Suggested formulas</h3>' +
            '<div class="spacer"></div><span class="badge">Based on detected columns &amp; types</span></div>' +
            '<div class="grid auto">' + data.suggestions.map(UI.formulaCard).join("") + "</div></div>"
        : '<div class="notice warn mt-16">No specific suggestions could be generated for this file.</div>';

      results.innerHTML =
        '<div class="notice success">' + ICON("check") + " Analysed " + esc(data.filename) + " (" + esc(data.kind.toUpperCase()) + ", " + sheets.length + " sheet(s)).</div>" +
        sheetHtml + suggestions;
    }
  }

  /* ------------------------------ Playground ----------------------------- */
  async function playground(view) {
    setHeader("Formula Playground", "Safe simulations of supported formulas");
    let supported = [];
    try {
      const data = await API.playgroundFormulas();
      supported = data.supported;
    } catch (err) {
      view.innerHTML = '<div class="notice error">' + esc(err.message) + "</div>";
      return;
    }
    const options = supported.map(function (f) {
      return '<option value="' + esc(f.id) + '">' + esc(f.name) + "</option>";
    }).join("");

    view.innerHTML =
      '<div class="card">' +
        '<div class="card-header"><h2>Try a formula</h2>' +
          '<div class="spacer"></div><span class="badge amber">Simulated - not real Excel</span></div>' +
        '<div class="grid cols-2">' +
          '<div class="field"><label for="pgFormula">Formula</label><select id="pgFormula">' + options + "</select></div>" +
          '<div class="field"><label for="pgValues">Sample values (comma separated)</label>' +
            '<input type="text" id="pgValues" placeholder="e.g. 10, 20, 30, 40" />' +
            '<small id="pgHint"></small></div>' +
        "</div>" +
        '<button class="btn primary" id="pgRun">' + ICON("playground") + "Run simulation</button>" +
      "</div>" +
      '<div id="pgResult" class="mt-24"></div>';

    const select = view.querySelector("#pgFormula");
    const values = view.querySelector("#pgValues");
    const hint = view.querySelector("#pgHint");

    function syncHint() {
      const found = supported.find(function (f) { return f.id === select.value; });
      hint.textContent = found ? "Example: " + found.example : "";
    }
    select.addEventListener("change", syncHint);
    syncHint();

    view.querySelector("#pgRun").addEventListener("click", async function () {
      const result = view.querySelector("#pgResult");
      result.innerHTML = '<div class="card"><span class="spinner"></span> Running…</div>';
      try {
        const data = await API.playground(select.value, values.value);
        result.innerHTML =
          '<div class="card">' +
            '<div class="card-header"><h3>' + esc(data.name) + " result</h3><span class=\"badge amber\">simulated</span></div>" +
            '<div class="stat"><div class="stat-value">' + esc(data.result) + "</div>" +
              '<div class="stat-label">Calculated output</div></div>' +
            '<div class="timeline mt-16">' + data.steps.map(function (s) {
              return '<div class="timeline-item"><span class="ti-dot"></span><div class="ti-body">' + esc(s) + "</div></div>";
            }).join("") + "</div>" +
            '<div class="notice info mt-16 small-text">' + esc(data.note) + " Formula: <code>" + esc(data.syntax) + "</code></div>" +
          "</div>";
      } catch (err) {
        result.innerHTML = '<div class="notice error">' + esc(err.message) + "</div>";
      }
    });
  }

  /* -------------------------------- Compare ------------------------------ */
  async function compare(view) {
    setHeader("Compare Formulas", "Understand the differences side by side");
    const options = App.state.formulas.map(function (f) {
      return '<option value="' + esc(f.id) + '">' + esc(f.name) + "</option>";
    }).join("");

    const quickChips = App.state.comparisons.map(function (cmp) {
      return '<button class="chip" data-cmp-left="' + esc(cmp.formulas[0]) + '" data-cmp-right="' + esc(cmp.formulas[1]) + '">' +
        esc(cmp.title) + "</button>";
    }).join("");

    view.innerHTML =
      '<div class="card">' +
        '<div class="grid cols-2">' +
          '<div class="field"><label for="cmpLeft">Formula A</label><select id="cmpLeft">' + options + "</select></div>" +
          '<div class="field"><label for="cmpRight">Formula B</label><select id="cmpRight">' + options + "</select></div>" +
        "</div>" +
        '<button class="btn primary" id="cmpRun">' + ICON("compare") + "Compare</button>" +
        '<div class="mt-16"><span class="small-text muted">Popular comparisons: </span><span class="chips">' + quickChips + "</span></div>" +
      "</div>" +
      '<div id="cmpResult" class="mt-24"></div>';

    const left = view.querySelector("#cmpLeft");
    const right = view.querySelector("#cmpRight");
    left.value = "vlookup";
    right.value = "index";

    view.querySelector("#cmpRun").addEventListener("click", run);
    view.querySelectorAll("[data-cmp-left]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        left.value = chip.getAttribute("data-cmp-left");
        right.value = chip.getAttribute("data-cmp-right");
        run();
      });
    });

    async function run() {
      const result = view.querySelector("#cmpResult");
      if (left.value === right.value) { UI.toast("Pick two different formulas", "error"); return; }
      result.innerHTML = '<div class="card"><span class="spinner"></span> Comparing…</div>';
      let data;
      try {
        data = await API.compare(left.value, right.value);
      } catch (err) {
        result.innerHTML = '<div class="notice error">' + esc(err.message) + "</div>";
        return;
      }
      result.innerHTML = renderComparison(data);
    }

    if (App.state.pendingCompare) {
      left.value = App.state.pendingCompare[0];
      right.value = App.state.pendingCompare[1];
      App.state.pendingCompare = null;
      run();
    }
  }

  function renderComparison(data) {
    if (data.comparison) {
      const c = data.comparison;
      return (
        '<div class="card">' +
          '<div class="card-header"><h2>' + esc(c.title) + "</h2></div>" +
          "<p>" + esc(c.purpose) + "</p>" +
          '<div class="compare-grid mt-16">' +
            compareColumn(c.formulas[0], c.syntax_a, c.advantages_a, c.limitations_a, c.example_a) +
            compareColumn(c.formulas[1], c.syntax_b, c.advantages_b, c.limitations_b, c.example_b) +
          "</div>" +
          '<div class="notice success mt-16"><strong>When to use:</strong> ' + esc(c.when_to_use) + "</div>" +
        "</div>"
      );
    }
    const g = data.generated;
    const rows = g.rows.map(function (row) {
      return "<tr><th>" + esc(row.label) + "</th><td>" + esc(row.left) + "</td><td>" + esc(row.right) + "</td></tr>";
    }).join("");
    return (
      '<div class="card">' +
        '<div class="card-header"><h2>' + esc(g.title) + '</h2><span class="badge gray">generated from library data</span></div>' +
        '<div class="table-scroll"><table class="data-table"><thead><tr><th>Attribute</th><th>' +
          esc(data.left.name) + "</th><th>" + esc(data.right.name) + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
        '<div class="notice info mt-16">' + esc(g.note) + "</div>" +
      "</div>"
    );
  }

  function compareColumn(name, syntax, advantages, limitations, example) {
    return (
      '<div class="compare-col"><h3>' + esc(name) + "</h3>" +
        '<pre class="formula-code">' + esc(syntax) + "</pre>" +
        "<h4 class=\"small-text muted mt-16\">Advantages</h4><ul>" + advantages.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
        "<h4 class=\"small-text muted\">Limitations</h4><ul>" + limitations.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
        "<h4 class=\"small-text muted\">Example</h4><pre class=\"formula-code\">" + esc(example) + "</pre>" +
      "</div>"
    );
  }

  /* ------------------------------- Favorites ----------------------------- */
  async function favorites(view) {
    setHeader("Favorites", "Formulas you saved, stored in your browser");
    const map = formulaMap();
    const ids = Store.getFavorites();
    const list = ids.map(function (id) { return map[id]; }).filter(Boolean);

    view.innerHTML =
      '<div class="card">' +
        '<div class="card-header"><h2>Saved formulas</h2>' +
          '<div class="spacer"></div><span class="badge gray">' + list.length + " saved</span></div>" +
        (list.length
          ? '<div class="grid auto">' + list.map(UI.formulaCard).join("") + "</div>"
          : emptyState("No favorites yet", "Tap the star icon on any formula to save it here for quick access.")) +
        '<div class="mt-24"><button class="btn" data-nav="library">' + ICON("library") + "Browse the library</button></div>" +
      "</div>" +
      '<div class="notice info mt-16 small-text">' + ICON("info") +
        " Favorites are stored with localStorage in this browser only. They are not uploaded anywhere.</div>";
  }

  /* ------------------------------- Templates ----------------------------- */
  async function templates(view) {
    setHeader("Templates", "Practical spreadsheets with ready-made formulas");
    const items = App.state.templates;
    view.innerHTML =
      '<div class="grid cols-2">' + items.map(function (t) {
        return (
          '<div class="card">' +
            '<div class="card-header"><span class="category-icon">' + UI.categoryIcon(t.icon) + "</span>" +
              "<h3>" + esc(t.name) + "</h3></div>" +
            "<p>" + esc(t.description) + "</p>" +
            '<p class="small-text muted">Columns: ' + t.columns.map(esc).join(" · ") + "</p>" +
            '<button class="btn small mt-16" data-template="' + esc(t.id) + '">View formulas ' + ICON("arrow") + "</button>" +
            '<div class="hidden" id="tpl-' + esc(t.id) + '">' +
              '<div class="template-formulas">' + t.formulas.map(function (f) {
                return '<div class="template-formula"><span class="tf-label">' + esc(f.label) + '</span><code>' + esc(f.formula) + "</code>" +
                  '<button class="icon-btn" data-copy="' + esc(f.formula) + '" title="Copy">' + ICON("copy") + "</button></div>";
              }).join("") + "</div>" +
              '<h4 class="small-text muted mt-16">How to build it</h4><ol class="small-text muted">' +
                t.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
            "</div>" +
          "</div>"
        );
      }).join("") + "</div>";

    view.querySelectorAll("[data-template]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const panel = view.querySelector("#tpl-" + btn.getAttribute("data-template"));
        const hidden = panel.classList.toggle("hidden");
        btn.innerHTML = (hidden ? "View formulas " : "Hide formulas ") + ICON("arrow");
      });
    });
  }

  /* ------------------------------- Community ----------------------------- */
  async function community(view) {
    setHeader("Community", "A local library of tips and examples");
    const remote = App.state.community;
    const local = Store.getLocalTips();

    function tipCard(tip, isLocal) {
      return (
        '<div class="card">' +
          '<div class="card-header"><span class="badge ' + (tip.type === "example" ? "blue" : "") + '">' + esc(tip.type) + "</span>" +
            "<h3>" + esc(tip.title) + "</h3></div>" +
          "<p>" + esc(tip.body) + "</p>" +
          '<div class="row between"><span class="small-text muted">by ' + esc(tip.author) + "</span>" +
            (isLocal ? '<button class="btn small ghost" data-remove-tip="' + esc(tip.id) + '">' + ICON("trash") + "Remove</button>" : "") +
          "</div>" +
        "</div>"
      );
    }

    view.innerHTML =
      '<div class="notice info">' + ICON("info") +
        " This is a local example library. Nothing is shared online and there is no real community backend; tips you add are saved only in this browser." +
      "</div>" +
      '<div class="card mt-16">' +
        '<div class="card-header"><h2>Share a tip or example</h2></div>' +
        '<div class="field"><label for="cmTitle">Title</label><input type="text" id="cmTitle" maxlength="90" placeholder="e.g. Sum only visible rows" /></div>' +
        '<div class="field"><label for="cmBody">Tip or example</label><textarea id="cmBody" rows="3" maxlength="500" placeholder="Describe the tip and the formula…"></textarea></div>' +
        '<button class="btn primary" id="cmSubmit">' + ICON("plus") + 'Add tip (saved locally)</button>' +
      "</div>" +
      (local.length ? '<h2 class="mt-24">Your local tips</h2><div class="grid cols-2 mt-16">' +
        local.map(function (t) { return tipCard(t, true); }).join("") + "</div>" : "") +
      '<h2 class="mt-24">Example library</h2><div class="grid cols-2 mt-16">' +
        remote.map(function (t) { return tipCard(t, false); }).join("") + "</div>";

    view.querySelector("#cmSubmit").addEventListener("click", function () {
      const title = view.querySelector("#cmTitle").value.trim();
      const body = view.querySelector("#cmBody").value.trim();
      if (!title || !body) { UI.toast("Add a title and a tip first", "error"); return; }
      Store.addLocalTip({
        id: "local-" + Date.now(),
        type: "tip",
        author: "You (local)",
        title: title,
        body: body,
        related: [],
      });
      UI.toast("Tip saved locally", "success");
      App.render();
    });
    view.querySelectorAll("[data-remove-tip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        Store.removeLocalTip(btn.getAttribute("data-remove-tip"));
        App.render();
      });
    });
  }

  /* --------------------------------- Help -------------------------------- */
  async function help(view) {
    setHeader("Help & About", "How to use this application");
    const ver = App.state.health || { version: "-", formula_count: App.state.formulas.length };
    view.innerHTML =
      '<div class="card">' +
        "<h2>How to use the assistant</h2>" +
        "<ol><li>Open <strong>Formula Assistant</strong> from the sidebar.</li>" +
        "<li>Describe your task, e.g. <em>\"Calculate the total of cells A1 to A10\"</em>.</li>" +
        "<li>Review the matched formula, its syntax, explanation and example.</li>" +
        "<li>Use <strong>Copy</strong> to place the formula on your clipboard, or save it as a favorite.</li></ol>" +
        '<div class="notice warn">If the assistant cannot confidently match a question, it says so instead of guessing. Rephrase with more detail and try again.</div>' +
      "</div>" +

      '<div class="grid cols-2 mt-16">' +
        '<div class="card"><h3>Supported features</h3><ul class="small-text muted">' +
          "<li>Rule-based natural language matching (English, Hindi and Marathi keywords)</li>" +
          "<li>" + ver.formula_count + " predefined formulas across 8 categories</li>" +
          "<li>Excel/CSV upload analysis with formula suggestions</li>" +
          "<li>Safe formula playground (simulated results)</li>" +
          "<li>Formula comparison pages</li>" +
          "<li>Favorites and recently viewed stored in localStorage</li>" +
          "<li>Template and community example libraries</li></ul></div>" +
        '<div class="card"><h3>Limitations</h3><ul class="small-text muted">' +
          "<li>No AI or external API - matching is keyword and rule based</li>" +
          "<li>Formula results in the playground are simulated, not executed by Excel</li>" +
          "<li>Uploaded files are analysed in memory and never saved</li>" +
          "<li>No login, database or online community</li></ul></div>" +
      "</div>" +

      '<div class="card mt-16"><h3>Troubleshooting</h3>' +
        '<div class="timeline">' +
          trouble("The assistant says no match", "Use clearer keywords, or include the formula name, e.g. \"SUM of A1:A10\".") +
          trouble("Upload is rejected", "Only .xlsx and .csv up to 5 MB are accepted. Password-protected or corrupt workbooks cannot be read.") +
          trouble("Suggestions look generic", "Make sure row 1 contains clear column headers such as Date, Amount, Region or Status.") +
          trouble("Favorites disappeared", "They live in this browser's localStorage; clearing site data removes them.") +
        "</div></div>" +

      '<div class="card mt-16"><h3>About</h3>' +
        '<div class="detail-grid">' +
          UI.detailBlock("Application", "Excel Formula Assistant") +
          UI.detailBlock("Version", esc(ver.version)) +
          UI.detailBlock("Backend", "Python · FastAPI · Uvicorn") +
          UI.detailBlock("Frontend", "HTML5 · CSS3 · Vanilla JavaScript") +
        "</div>" +
        '<p class="small-text muted mt-16">Runs entirely on your computer. Core features work without an internet connection.</p>' +
      "</div>";
  }

  function trouble(title, body) {
    return '<div class="timeline-item"><span class="ti-dot"></span><div class="ti-body"><strong>' +
      esc(title) + ":</strong> " + esc(body) + "</div></div>";
  }

  window.Pages = {
    dashboard: dashboard,
    assistant: assistant,
    library: library,
    upload: upload,
    playground: playground,
    compare: compare,
    favorites: favorites,
    templates: templates,
    community: community,
    help: help,
    runAssistant: runAssistant,
    setHeader: setHeader,
  };
})();
