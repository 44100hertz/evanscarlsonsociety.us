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

  var next = document.querySelector('.scroller-next');
  var cards = document.querySelector('.cards');
  if (next && cards) {
    next.addEventListener('click', function () {
      var atEnd = cards.scrollLeft >= cards.scrollWidth - cards.clientWidth - 8;
      if (atEnd) {
        cards.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        cards.scrollBy({ left: Math.round(cards.clientWidth * 0.8), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }
})();
