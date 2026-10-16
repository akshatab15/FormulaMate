/* API client for the Excel Formula Assistant backend. */
(function () {
  "use strict";

  async function request(path, options) {
    let response;
    try {
      response = await fetch(path, options);
    } catch (err) {
      throw new Error("Cannot reach the server. Is the backend running?");
    }
    let payload = null;
    const text = await response.text();
    if (text) {
      try { payload = JSON.parse(text); } catch (err) { payload = null; }
    }
    if (!response.ok) {
      const detail = payload && payload.detail ? payload.detail : "Request failed (" + response.status + ")";
      throw new Error(typeof detail === "string" ? detail : "Request failed");
    }
    return payload;
  }

  window.API = {
    health: () => request("/api/health"),
    categories: () => request("/api/categories"),
    formulas: (category) =>
      request("/api/formulas" + (category ? "?category=" + encodeURIComponent(category) : "")),
    formula: (id) => request("/api/formulas/" + encodeURIComponent(id)),
    comparisons: () => request("/api/comparisons"),
    templates: () => request("/api/templates"),
    community: () => request("/api/community"),

    search: (query) =>
      request("/api/assistant/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query }),
      }),

    compare: (left, right) =>
      request("/api/assistant/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ left: left, right: right }),
      }),

    playgroundFormulas: () => request("/api/playground/formulas"),

    playground: (formulaId, values) =>
      request("/api/assistant/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula_id: formulaId, values: values }),
      }),

    analyzeFile: (file) => {
      const form = new FormData();
      form.append("file", file);
      return request("/api/files/analyze", { method: "POST", body: form });
    },
  };
})();
