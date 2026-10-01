(function () {
  var root = document.documentElement;
  var masthead = document.querySelector('.masthead');
  var toggle = document.querySelector('.theme-toggle');
  var choices = [].slice.call(document.querySelectorAll('[data-theme-choice]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function apply(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('ecs-theme', theme); } catch (e) {}
    choices.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.themeChoice === theme));
    });
  }

  var saved = null;
  try { saved = localStorage.getItem('ecs-theme'); } catch (e) {}
  if (saved === 'night' || saved === 'paper') apply(saved);

  function setChoosing(open) {
    masthead.classList.toggle('choosing', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  if (toggle && masthead) {
    toggle.addEventListener('click', function () {
      setChoosing(!masthead.classList.contains('choosing'));
    });
    choices.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.themeChoice);
        setChoosing(false);
        toggle.focus();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && masthead.classList.contains('choosing')) {
        setChoosing(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (masthead.classList.contains('choosing') && !masthead.contains(e.target)) {
        setChoosing(false);
      }
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
