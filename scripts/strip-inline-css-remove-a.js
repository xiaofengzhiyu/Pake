// scripts/strip-inline-css.js
// Injected via pake-cli --inject. Hijacks the copy event (capture phase,
// stopImmediatePropagation) so the page's own copy handlers cannot run, then
// rewrites the clipboard with cleaned HTML + matching plain text:
//   1. Strips every inline `style` attribute.
//   2. Removes every <a> element TOGETHER WITH its wrapped content (the whole
//      node goes away, not just the tag).
// Both clipboard formats are derived from the same cleaned fragment, so link
// text disappears from both text/html and text/plain.
(function () {
  document.addEventListener(
    "copy",
    function (e) {
      var selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      var fragment = selection.getRangeAt(0).cloneContents();
      var tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);

      // 1. Drop all inline style attributes.
      tempDiv.querySelectorAll("[style]").forEach(function (el) {
        el.removeAttribute("style");
      });

      // 2. Remove every anchor element AND its wrapped content entirely.
      //    el.remove() deletes the node plus its subtree; we do NOT replace it
      //    with the text, so the link text is gone from the clipboard too.
      tempDiv.querySelectorAll("a").forEach(function (el) {
        el.remove();
      });

      var cleanHtml = tempDiv.innerHTML;
      // Derive plain text from the SAME cleaned fragment so an <a> we just
      // removed does not resurface as text. selection.toString() would still
      // carry the link text because it has no tag structure.
      var plainText = tempDiv.textContent;
      if (!cleanHtml) return;

      // Must prevent default or the browser overwrites the clipboard after the
      // event ends.
      e.preventDefault();
      // Stop the page's own copy scripts (e.g. math/quill copy enhancers) from
      // running after us.
      e.stopImmediatePropagation();

      e.clipboardData.clearData();
      e.clipboardData.setData("text/html", cleanHtml);
      e.clipboardData.setData("text/plain", plainText);
    },
    true // capture phase: run before the page's own copy handlers
  );
})();
