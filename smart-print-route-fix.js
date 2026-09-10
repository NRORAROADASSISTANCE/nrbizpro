// NR BizPro — Services > Smart Print navigation fix
(function () {
  'use strict';

  var TARGET = '/smart-print.html';

  function isSmartPrintTarget(el) {
    if (!el) return false;
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    var href = (el.getAttribute && el.getAttribute('href')) || '';
    var data = (el.getAttribute && (el.getAttribute('data-feature') || el.getAttribute('data-action') || el.getAttribute('data-tab'))) || '';
    return /smart\s*print/.test(text) || /smart[-_ ]print/.test(href + ' ' + data);
  }

  document.addEventListener('click', function (event) {
    var el = event.target && event.target.closest
      ? event.target.closest('a,button,[role="button"],[data-feature],[data-action],[data-tab]')
      : null;
    if (!el || !isSmartPrintTarget(el)) return;

    // Do not hijack the dedicated Smart Print page's own controls.
    if (location.pathname === TARGET) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    window.location.assign(TARGET);
  }, true);
})();
