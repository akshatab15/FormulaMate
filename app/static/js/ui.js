/* Shared UI helpers: icons, escaping, toasts, clipboard and formula rendering. */
(function () {
  "use strict";

  const ICONS = {
    dashboard: '<path d="M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 11h8V3h-8z"/>',
    assistant: '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
    library: '<path d="M4 4h6v16H4zM12 4h8v16h-8z"/><path d="M6 8h2M6 12h2M6 16h2M14 8h4M14 12h4"/>',
    upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
    playground: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4A2 2 0 0019 18l-5-9V3"/>',
    compare: '<path d="M7 4v16M17 4v16M3 8h4M17 16h4"/><path d="M7 12l-4-4M7 12l-4 4M17 12l4-4M17 12l4 4"/>',
    favorites: '<path d="M12 3l2.7 6.2 6.3.6-4.8 4.2 1.4 6.5L12 17.9 6.4 20.5l1.4-6.5L3 9.8l6.3-.6z"/>',
    templates: '<path d="M4 4h16v4H4zM4 10h7v10H4zM13 10h7v10h-7z"/>',
    community: '<path d="M4 5h16v11H7l-3 3z"/><path d="M8 9h8M8 12h5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.5"/><path d="M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 19h8"/>',
    type: '<path d="M4 6V4h16v2M12 4v16M8 20h8"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    branch: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 6h6a4 4 0 014 4M6 8v8"/>',
    star: '<path d="M12 3l2.7 6.2 6.3.6-4.8 4.2 1.4 6.5L12 17.9 6.4 20.5l1.4-6.5L3 9.8l6.3-.6z"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13h10l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS.info;
    return (
      '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>"
    );
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toast(message, type) {
    const wrap = document.getElementById("toasts");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(function () { el.remove(); }, 320);
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext !== false) {
      return navigator.clipboard.writeText(text).then(
        function () { toast("Copied: " + text, "success"); },
        function () { fallbackCopy(text); }
      );
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); toast("Copied: " + text, "success"); }
    catch (err) { toast("Copy failed - please copy manually", "error"); }
    area.remove();
  }

  function categoryIcon(name) {
    return icon(name || "calc");
  }

  function categoryName(categories, id) {
    const found = (categories || []).find(function (c) { return c.id === id; });
    return found ? found.name : id;
  }

  function formulaCard(formula) {
    const fav = Store.isFavorite(formula.id);
    return (
      '<article class="formula-card" data-open="' + esc(formula.id) + '">' +
        '<div class="fc-top">' +
          '<span class="fc-name">' + esc(formula.name) + "</span>" +
          '<span class="badge gray">' + esc(formula.category) + "</span>" +
          '<span class="fc-actions">' +
            '<button class="icon-btn fav' + (fav ? " fav-on" : "") + '" data-fav="' + esc(formula.id) + '" title="Toggle favorite">' +
              icon("star") + "</button>" +
          "</span>" +
        "</div>" +
        "<p>" + esc(formula.description) + "</p>" +
        '<div class="fc-example">' + esc(formula.example) + "</div>" +
      "</article>"
    );
  }

  function codeRow(code) {
    return (
      '<div class="code-row">' +
        '<pre class="formula-code">' + esc(code) + "</pre>" +
        '<button class="btn small" data-copy="' + esc(code) + '">' + icon("copy") + "Copy</button>" +
      "</div>"
    );
  }

  function formulaDetail(formula) {
    const fav = Store.isFavorite(formula.id);
    const related = (formula.related || []);
    return (
      '<div class="card">' +
        '<div class="card-header">' +
          "<h2>" + esc(formula.name) + " " + '<span class="badge">' + esc(formula.category) + "</span></h2>" +
          '<div class="spacer"></div>' +
          '<button class="btn small" data-fav="' + esc(formula.id) + '">' + icon("star") + (fav ? "Saved" : "Save") + "</button>" +
        "</div>" +
        "<p>" + esc(formula.description) + "</p>" +
        codeRow(formula.syntax) +
        '<div class="detail-grid mt-16">' +
          detailBlock("Example", '<code class="formula-code inline">' + esc(formula.example) + "</code>") +
          detailBlock("Example output", esc(formula.example_output)) +
          detailBlock("Common use case", esc(formula.use_case)) +
          detailBlock("Related formulas", related.length
            ? related.map(function (r) {
                return '<button class="chip" data-open="' + esc(r) + '">' + esc(r) + "</button>";
              }).join(" ")
            : '<span class="muted">None</span>') +
        "</div>" +
      "</div>"
    );
  }

  function detailBlock(label, body) {
    return '<div class="detail-block"><h4>' + esc(label) + "</h4><p>" + body + "</p></div>";
  }

  window.UI = {
    icon: icon,
    esc: esc,
    toast: toast,
    copyText: copyText,
    categoryIcon: categoryIcon,
    categoryName: categoryName,
    formulaCard: formulaCard,
    formulaDetail: formulaDetail,
    codeRow: codeRow,
    detailBlock: detailBlock,
  };
})();
