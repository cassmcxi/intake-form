// ── CONFIG ──────────────────────────────────────────────
// Replace this with your Formspree form ID after you sign up at formspree.io
// Go to: formspree.io → New Form → copy the ID from the endpoint URL
const FORMSPREE_ID = 'mgopqkjj';

// ── STATE ────────────────────────────────────────────────
const screens = [
  'screen-welcome',
  'q1', 'q2', 'q3', 'q4', 'q5',
  'q6', 'q7', 'q8', 'q9', 'q10',
  'q11', 'q12', 'q13', 'q14', 'q15',
  'q-final'
];

const TOTAL_QUESTIONS = 15; // welcome and final don't count
let currentIndex = 0;

// ── NAVIGATION ───────────────────────────────────────────

function startForm() {
  goToIndex(1);
}

function nextScreen() {
  goToIndex(currentIndex + 1);
}

function prevScreen() {
  if (currentIndex > 0) {
    goToIndex(currentIndex - 1);
  }
}

function showScreen(id) {
  const idx = screens.indexOf(id);
  if (idx !== -1) goToIndex(idx);
}

function goToIndex(newIndex) {
  if (newIndex < 0 || newIndex >= screens.length) return;

  const current = document.getElementById(screens[currentIndex]);
  const next    = document.getElementById(screens[newIndex]);

  if (!current || !next) return;

  // Slide out current
  current.classList.remove('active');
  current.classList.add('exit');

  // Remove exit class after animation completes
  current.addEventListener('transitionend', () => {
    current.classList.remove('exit');
  }, { once: true });

  // Slide in next
  next.classList.add('active');

  currentIndex = newIndex;
  updateProgress();
}

// ── PROGRESS BAR ─────────────────────────────────────────

function updateProgress() {
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('step-label');

  // Welcome = 0, q1–q15 = 1–15, q-final = 16
  if (currentIndex === 0) {
    fill.style.width = '0%';
    label.textContent = '0 / 15';
    return;
  }

  const questionNumber = currentIndex; // 1-based for q1–q15, 16 for final
  const displayNum     = Math.min(questionNumber, TOTAL_QUESTIONS);
  const pct            = (questionNumber / (TOTAL_QUESTIONS + 1)) * 100;

  fill.style.width  = `${pct}%`;
  label.textContent = `${displayNum} / ${TOTAL_QUESTIONS}`;
}

// ── PILL SELECTION ────────────────────────────────────────

document.addEventListener('click', function(e) {
  const pill = e.target.closest('.pill');
  if (!pill) return;

  const grid = pill.closest('.pill-grid');
  if (!grid) return;

  const type = grid.dataset.type; // 'single' or 'multi'

  if (type === 'single') {
    // Deselect all in this group
    grid.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
  } else {
    // Multi-select: toggle this pill
    pill.classList.toggle('selected');
  }
});

// ── COLLECT ALL ANSWERS ───────────────────────────────────

function collectAnswers() {
  const data = {};

  // Text inputs
  const textFields = {
    'name':        document.getElementById('q1-name'),
    'business':    document.getElementById('q1-biz'),
    'audience':    document.getElementById('q5-audience'),
    'inspiration': document.getElementById('q7-inspo'),
    'vibe':        document.getElementById('q8-vibe'),
    'extra-notes': document.getElementById('q-extra'),
  };

  for (const [key, el] of Object.entries(textFields)) {
    if (el) data[key] = el.value.trim();
  }

  // Pill selections
  document.querySelectorAll('.pill-grid').forEach(grid => {
    const name     = grid.dataset.name;
    const type     = grid.dataset.type;
    const selected = [...grid.querySelectorAll('.pill.selected')]
                       .map(p => p.dataset.value);

    if (type === 'single') {
      data[name] = selected[0] || '';
    } else {
      data[name] = selected.join(', ');
    }
  });

  return data;
}

// ── SUBMIT ────────────────────────────────────────────────

async function handleSubmit() {
  const btn = document.getElementById('submit-btn');

  // Disable button while submitting
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending...';

  const answers = collectAnswers();

  // Format the email nicely
  const formatted = {
    'Client Name':        answers.name        || '—',
    'Business Name':      answers.business    || '—',
    'Project Type':       answers['project-type']   || '—',
    'Platform':           answers.platform    || '—',
    'Primary Goal':       answers['primary-goal']   || '—',
    'Target Audience':    answers.audience    || '—',
    'Brand Assets':       answers['brand-assets']   || '—',
    'Design Inspiration': answers.inspiration || '—',
    'Brand Vibe':         answers.vibe        || '—',
    'Pages Needed':       answers.pages       || '—',
    'Copy Status':        answers['copy-status']    || '—',
    'Media Status':       answers['media-status']   || '—',
    'Domain':             answers.domain      || '—',
    'Integrations':       answers.integrations || '—',
    'Budget':             answers.budget      || '—',
    'Timeline':           answers.timeline    || '—',
    'Extra Notes':        answers['extra-notes'] || '—',
  };

  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatted),
    });

    if (response.ok) {
      showThankYou();
    } else {
      showError();
    }
  } catch (err) {
    showError();
  }
}

function showThankYou() {
  const current = document.getElementById(screens[currentIndex]);
  current.classList.remove('active');
  current.classList.add('exit');

  const thanks = document.getElementById('screen-thanks');
  thanks.classList.add('active');

  // Hide progress + step counter
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('step-label').textContent = '';
}

function showError() {
  const current = document.getElementById(screens[currentIndex]);
  current.classList.remove('active');
  current.classList.add('exit');

  const error = document.getElementById('screen-error');
  error.classList.add('active');

  // Re-enable submit in case they go back
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Send to Cass ✦';
  }
}

// ── KEYBOARD NAV ──────────────────────────────────────────
// Press Enter to advance (except on textareas)
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  if (e.target.tagName === 'TEXTAREA') return;
  if (currentIndex === 0) {
    startForm();
  } else if (currentIndex < screens.length - 1) {
    nextScreen();
  }
});
