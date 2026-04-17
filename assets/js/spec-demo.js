/**
 * Specificity weight demo — interactive OTP-style display
 * Cycles through CSS selectors, showing their specificity weight.
 */

const STEPS = [
  { selector: '*', weight: [0, 0, 0] },
  { selector: 'p', weight: [0, 0, 1] },
  { selector: '.card', weight: [0, 1, 0] },
  { selector: '.card p', weight: [0, 1, 1] },
  { selector: '.card .title', weight: [0, 2, 0] },
  { selector: '#main .card', weight: [1, 1, 0] },
  { selector: '#main .card p', weight: [1, 1, 1] },
];

const demo = document.querySelector('.js-spec-demo');

if (demo) {
  const selectorEl = demo.querySelector('.js-spec-selector');
  const digits = Array.from(demo.querySelectorAll('.js-spec-digit'));
  const prevBtn = demo.querySelector('.js-spec-prev');
  const nextBtn = demo.querySelector('.js-spec-next');
  const counterEl = demo.querySelector('.js-spec-counter');
  let step = 0;

  function render() {
    const { selector, weight } = STEPS[step];

    selectorEl.classList.add('is-fading');
    setTimeout(() => {
      selectorEl.textContent = selector;
      selectorEl.classList.remove('is-fading');
    }, 150);

    digits.forEach((digit, i) => {
      const val = weight[i];
      digit.textContent = val;
      digit.classList.toggle('spec-digit--zero', val === 0);
      digit.classList.toggle('spec-digit--lit', val > 0);
    });

    if (counterEl) {
      counterEl.textContent = `${step + 1}\u2009/\u2009${STEPS.length}`;
    }
  }

  function advance(delta) {
    step = (step + delta + STEPS.length) % STEPS.length;
    render();
  }

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    advance(-1);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    advance(1);
  });

  render();
}
