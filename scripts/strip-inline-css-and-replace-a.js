// scripts/strip-inline-css-and-replace-a.js
// Injected via pake-cli --inject. Hijacks the copy event (capture phase,
// stopImmediatePropagation) so the page's own copy handlers cannot run, then
// rewrites the clipboard with cleaned HTML + matching plain text:
//   1. Strips every inline `style` attribute.
//   2. Replaces every <a> element with a <b> element that wraps the SAME
//      content (child nodes preserved, so the link text survives and renders
//      bold). Nested <a> are handled: we process anchors and replace each with
//      its <b>-wrapped form.
// Both clipboard formats are derived from the same cleaned fragment, so the
// result is consistent across text/html and text/plain.
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

      // 2. Replace every anchor with <b> wrapping the same children.
      //    Because querySelectorAll returns a static NodeList, it is safe to
      //    mutate the DOM while iterating. replaceChild swaps the tag in place,
      //    preserving order and any nested content. If an <a> is nested inside
      //    another <a>, both are still replaced since both are in the snapshot.
      tempDiv.querySelectorAll("a").forEach(function (el) {
        // Also strip the anchor's inline style (harmless if already removed
        // above, but defensive in case a future variant drops step 1).
        el.removeAttribute("style");
        var b = document.createElement("b");
        while (el.firstChild) {
          b.appendChild(el.firstChild);
        }
        el.parentNode.replaceChild(b, el);
      });

      var cleanHtml = tempDiv.innerHTML;
      // Derive plain text from the same cleaned fragment. <b> is purely
      // presentational, so textContent already drops it; the link text is
      // preserved in both clipboard formats.
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
