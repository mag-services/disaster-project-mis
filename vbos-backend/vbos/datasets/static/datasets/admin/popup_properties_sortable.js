/* global Sortable */
(function () {
  function initRoots() {
    document.querySelectorAll(".vbos-popup-prop-sortable-root").forEach(function (root) {
      if (root.dataset.vbSortInit) return;
      var ul = root.querySelector(".vbos-popup-prop-sortable");
      if (!ul || typeof Sortable === "undefined") return;
      root.dataset.vbSortInit = "1";
      Sortable.create(ul, {
        animation: 150,
        handle: ".vbos-popup-prop-handle",
        ghostClass: "vbos-popup-prop-ghost",
        chosenClass: "vbos-popup-prop-chosen",
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRoots);
  } else {
    initRoots();
  }
})();
