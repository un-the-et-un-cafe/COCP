/* Progressive enhancement for the static directory. Optional; core content is in HTML. */
(function () {
  'use strict';
  var root = document.documentElement;
  var list = document.getElementById('listing-list');
  if (!list) return;
  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var countEl = document.getElementById('result-count');
  var emptyEl = document.getElementById('empty-state');
  var offlineEl = document.getElementById('offline-note');
  var form = document.querySelector('form[role="search"]');
  var input = form && form.querySelector('input[name="q"]');
  var chips = document.querySelectorAll('.chips a');
  var params = new URLSearchParams(location.search);
  var q = (params.get('q') || '').trim().toLowerCase();
  var cat = params.get('c') || 'all';
  var locale = root.lang || 'fr';

  function setChip(active) {
    chips.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var m = /[?&]c=([^&]+)/.exec(href);
      var c = m ? m[1] : 'all';
      if (c === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function apply() {
    var visible = 0;
    cards.forEach(function (card) {
      var text = (card.getAttribute('data-search') || '').toLowerCase();
      var cats = (card.getAttribute('data-cats') || '').split(/\s+/);
      var inCat = cat === 'all' || cats.indexOf(cat) !== -1;
      var inQ = !q || text.indexOf(q) !== -1;
      var show = inCat && inQ;
      card.hidden = !show;
      if (show) visible++;
    });
    if (countEl) {
      var tpl = countEl.getAttribute('data-tpl') || '{n}';
      countEl.textContent = tpl.replace('{n}', String(visible));
    }
    if (emptyEl) {
      if (visible === 0) emptyEl.setAttribute('data-show', '');
      else emptyEl.removeAttribute('data-show');
    }
  }

  if (input && q) input.value = params.get('q') || '';
  setChip(cat);
  apply();

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      q = (input.value || '').trim().toLowerCase();
      var next = new URL(location.href);
      if (q) next.searchParams.set('q', input.value.trim());
      else next.searchParams.delete('q');
      history.replaceState(null, '', next);
      apply();
    });
    if (input) {
      input.addEventListener('input', function () {
        q = (input.value || '').trim().toLowerCase();
        apply();
      });
    }
  }

  chips.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var href = a.getAttribute('href') || '';
      var m = /[?&]c=([^&]+)/.exec(href);
      cat = m ? m[1] : 'all';
      var next = new URL(location.href);
      if (cat === 'all') next.searchParams.delete('c');
      else next.searchParams.set('c', cat);
      history.replaceState(null, '', next);
      setChip(cat);
      apply();
    });
  });

  function relativeLabel(iso) {
    if (!iso || typeof Intl === 'undefined' || !Intl.RelativeTimeFormat) return null;
    var then = Date.parse(iso);
    if (!Number.isFinite(then)) return null;
    var diffSec = Math.round((then - Date.now()) / 1000);
    var rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    var abs = Math.abs(diffSec);
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    return rtf.format(Math.round(diffSec / 86400), 'day');
  }

  cards.forEach(function (card) {
    var badge = card.querySelector('[data-checked]');
    if (!badge) return;
    var iso = badge.getAttribute('data-checked');
    var expired = badge.getAttribute('data-expired') === '1';
    var rel = relativeLabel(iso);
    if (!rel) return;
    var labelEl = badge.querySelector('[data-rel]');
    if (labelEl) labelEl.textContent = expired ? rel : rel;
  });

  function showOffline(fromCache) {
    if (!offlineEl) return;
    if (!navigator.onLine || fromCache) offlineEl.setAttribute('data-show', '');
    else offlineEl.removeAttribute('data-show');
  }
  showOffline(false);
  window.addEventListener('online', function () { showOffline(false); });
  window.addEventListener('offline', function () { showOffline(true); });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
