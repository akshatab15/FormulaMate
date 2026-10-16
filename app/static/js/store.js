/* localStorage-backed preferences: favorites, recently viewed, local tips. */
(function () {
  "use strict";

  const FAV_KEY = "efa.favorites";
  const RECENT_KEY = "efa.recent";
  const TIPS_KEY = "efa.localTips";
  const MAX_RECENT = 8;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* storage may be unavailable - preferences simply will not persist */
    }
  }

  window.Store = {
    getFavorites: () => read(FAV_KEY, []),
    isFavorite: (id) => read(FAV_KEY, []).indexOf(id) !== -1,
    toggleFavorite: function (id) {
      const favorites = read(FAV_KEY, []);
      const index = favorites.indexOf(id);
      if (index === -1) {
        favorites.push(id);
      } else {
        favorites.splice(index, 1);
      }
      write(FAV_KEY, favorites);
      return index === -1;
    },
    removeFavorite: function (id) {
      write(FAV_KEY, read(FAV_KEY, []).filter((x) => x !== id));
    },

    getRecent: () => read(RECENT_KEY, []),
    addRecent: function (id) {
      const recent = read(RECENT_KEY, []).filter((x) => x !== id);
      recent.unshift(id);
      write(RECENT_KEY, recent.slice(0, MAX_RECENT));
    },
    clearRecent: () => write(RECENT_KEY, []),

    getLocalTips: () => read(TIPS_KEY, []),
    addLocalTip: function (tip) {
      const tips = read(TIPS_KEY, []);
      tips.unshift(tip);
      write(TIPS_KEY, tips);
      return tips;
    },
    removeLocalTip: function (id) {
      write(TIPS_KEY, read(TIPS_KEY, []).filter((x) => x.id !== id));
    },
  };
})();
