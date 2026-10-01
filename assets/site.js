(function () {
  var root = document.documentElement;
  var masthead = document.querySelector('.masthead');
  var toggle = document.querySelector('.theme-toggle');
  var choices = [].slice.call(document.querySelectorAll('[data-theme-choice]'));

  function apply(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('ecs-theme', theme); } catch (e) {}
    choices.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.themeChoice === theme));
    });
  }

  var saved = null;
  try { saved = localStorage.getItem('ecs-theme'); } catch (e) {}
  apply(saved === 'night' ? 'night' : 'paper');

  function close() {
    masthead.classList.remove('choosing');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && masthead) {
    toggle.addEventListener('click', function () {
      var open = masthead.classList.toggle('choosing');
      toggle.setAttribute('aria-expanded', String(open));
    });
    choices.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.themeChoice);
        close();
        toggle.focus();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && masthead.classList.contains('choosing')) {
        close();
        toggle.focus();
      }
    });
  }

  var next = document.querySelector('.scroller-next');
  var cards = document.querySelector('.cards');
  if (next && cards) {
    next.addEventListener('click', function () {
      cards.scrollBy({ left: Math.round(cards.clientWidth * 0.8), behavior: 'smooth' });
    });
  }
})();
