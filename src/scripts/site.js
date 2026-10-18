(function () {
  var root = document.documentElement;
  var themeButton = document.querySelector('.theme-button');
  var printButton = document.querySelector('.print-button');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isNight() {
    return root.dataset.theme === 'night';
  }

  // The two theme icons swap in CSS off [data-theme]; the script only flips the
  // attribute, stores the choice and keeps the button's name honest.
  function nameThemeButton() {
    var label = isNight() ? 'Switch to paper theme' : 'Switch to night theme';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
  }

  var saved = null;
  try { saved = localStorage.getItem('ecs-theme'); } catch (e) {}
  if (saved === 'night' || saved === 'paper') root.dataset.theme = saved;

  if (themeButton) {
    nameThemeButton();
    themeButton.addEventListener('click', function () {
      root.dataset.theme = isNight() ? 'paper' : 'night';
      try { localStorage.setItem('ecs-theme', root.dataset.theme); } catch (e) {}
      nameThemeButton();
    });
  }

  if (printButton) {
    printButton.addEventListener('click', function () {
      window.print();
    });
  }

  [].slice.call(document.querySelectorAll('.cards')).forEach(function (cards) {
    var section = cards.closest('section');
    var next = section && section.querySelector('.scroller-next');
    var prev = section && section.querySelector('.scroller-prev');
    if (!next && !prev) return;

    function atEnd() {
      return cards.scrollLeft >= cards.scrollWidth - cards.clientWidth - 8;
    }
    function atStart() {
      return cards.scrollLeft <= 8;
    }
    function go(dir) {
      var target;
      if (dir > 0) target = atEnd() ? 0 : cards.scrollLeft + Math.round(cards.clientWidth * 0.8);
      else target = atStart() ? cards.scrollWidth - cards.clientWidth : cards.scrollLeft - Math.round(cards.clientWidth * 0.8);
      cards.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (next) next.addEventListener('click', function () { go(1); });
    if (prev) prev.addEventListener('click', function () { go(-1); });
  });
})();
