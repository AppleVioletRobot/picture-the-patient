(() => {
  const data = window.PTP_DATA;
  const stripsEl = document.querySelector('#strips');
  const generateAllBtn = document.querySelector('#generate-all');
  const patientNumberEl = document.querySelector('#patient-number');
  const reflectionEl = document.querySelector('#reflection-text');

  let patientNumber = 0;
  const currentIndexes = new Map();

  function randomIndex(length, previous) {
    if (length <= 1) return 0;
    let next = Math.floor(Math.random() * length);
    while (next === previous) next = Math.floor(Math.random() * length);
    return next;
  }

  function setStrip(strip, textEl) {
    const previous = currentIndexes.get(strip.id);
    const next = randomIndex(strip.fragments.length, previous);
    currentIndexes.set(strip.id, next);
    textEl.textContent = strip.fragments[next];
  }

  function makeStrip(strip) {
    const row = document.createElement('article');
    row.className = 'strip';
    row.dataset.strip = strip.id;

    const label = document.createElement('div');
    label.className = 'strip-label';
    label.textContent = strip.label;

    const text = document.createElement('p');
    text.className = 'strip-text';

    const reroll = document.createElement('button');
    reroll.type = 'button';
    reroll.className = 'reroll';
    reroll.setAttribute('aria-label', `Change ${strip.label}`);
    reroll.title = `Change ${strip.label}`;
    reroll.textContent = '↻';
    reroll.addEventListener('click', () => {
      setStrip(strip, text);
      reflectionEl.textContent = data.reflections[Math.floor(Math.random() * data.reflections.length)];
    });

    row.append(label, text, reroll);
    setStrip(strip, text);
    return row;
  }

  function picturePatient() {
    patientNumber += 1;
    patientNumberEl.textContent = String(patientNumber).padStart(3, '0');

    data.strips.forEach(strip => {
      const textEl = document.querySelector(`[data-strip="${strip.id}"] .strip-text`);
      setStrip(strip, textEl);
    });

    reflectionEl.textContent = data.reflections[Math.floor(Math.random() * data.reflections.length)];
  }

  data.strips.forEach(strip => stripsEl.appendChild(makeStrip(strip)));
  patientNumber = 1;
  patientNumberEl.textContent = '001';

  generateAllBtn.addEventListener('click', picturePatient);
})();
