// scripts/strip-inline-css.js
// Injected via pake-cli --inject. Hijacks the copy event to drop inline
// style attributes so pasted HTML is clean.
(function () {
  document.addEventListener(
    "copy",
    function (e) {
      var selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      var fragment = selection.getRangeAt(0).cloneContents();
      var tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);

      tempDiv.querySelectorAll("[style]").forEach(function (el) {
        el.removeAttribute("style");
      });

      var cleanHtml = tempDiv.innerHTML;
      var plainText = selection.toString();
      if (!cleanHtml) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      e.clipboardData.clearData();
      e.clipboardData.setData("text/html", cleanHtml);
      e.clipboardData.setData("text/plain", plainText);
    },
    true // capture phase: run before the page's own copy handlers
  );
})();