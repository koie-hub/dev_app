(() => {
  const el = {
    count: document.getElementById('count'),
    inc: document.getElementById('increment'),
    dec: document.getElementById('decrement'),
    reset: document.getElementById('reset'),
    step: document.getElementById('step'),
    initial: document.getElementById('initial'),
    apply: document.getElementById('applySettings'),
    persist: document.getElementById('persist'),
  };

  const LS_KEY = 'counter-app:v2';

  const state = {
    value: 0,
    step: 10,
    initial: 0,
    persist: true,
  };

  function clamp(n) {
    // Keep within safe range to avoid overflow visuals
    const MAX = Number.MAX_SAFE_INTEGER;
    const MIN = Number.MIN_SAFE_INTEGER;
    return Math.min(MAX, Math.max(MIN, n));
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.value === 'number') state.value = saved.value;
      if (typeof saved.step === 'number') state.step = saved.step;
      if (typeof saved.initial === 'number') state.initial = saved.initial;
      if (typeof saved.persist === 'boolean') state.persist = saved.persist;
    } catch {}
  }

  function save() {
    try {
      if (!state.persist) return;
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }

  function render() {
    el.count.textContent = String(state.value);
    el.step.value = String(state.step);
    el.initial.value = String(state.initial);
    el.persist.checked = state.persist;
    // Update button labels to reflect current step
    const s = String(state.step);
    el.inc.textContent = `＋${s}`;
    el.dec.textContent = `−${s}`;
    el.inc.setAttribute('aria-label', `${s} 増やす`);
    el.dec.setAttribute('aria-label', `${s} 減らす`);
  }

  function setValue(v) {
    state.value = clamp(v);
    render();
    save();
  }

  // Initialize
  load();
  render();

  // Events
  el.inc.addEventListener('click', () => setValue(state.value + state.step));
  el.dec.addEventListener('click', () => setValue(state.value - state.step));
  el.reset.addEventListener('click', () => setValue(state.initial));

  el.apply.addEventListener('click', () => {
    const step = parseInt(el.step.value, 10);
    const initial = parseInt(el.initial.value, 10);
    state.step = Number.isFinite(step) && step > 0 ? step : 1;
    state.initial = Number.isFinite(initial) ? initial : 0;
    state.persist = !!el.persist.checked;
    save();
    render();
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === '+') setValue(state.value + state.step);
    if (e.key === '-') setValue(state.value - state.step);
    if (e.key.toLowerCase() === 'r') setValue(state.initial);
  });
})();
