// ===== Pomodoro Timer App =====

// --- DOM Elements ---
const el = {
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
  progressRing: document.getElementById('progressRing'),
  btnStart: document.getElementById('btnStart'),
  btnStartText: document.querySelector('#btnStart .btn-text'),
  btnReset: document.getElementById('btnReset'),
  btnPin: document.getElementById('btnPin'),
  btnSettings: document.getElementById('btnSettings'),
  phaseTabs: document.querySelectorAll('.phase-tab'),
  timerContainer: document.querySelector('.timer-container'),
  sessionDots: document.getElementById('sessionDots'),
  sessionCount: document.getElementById('sessionCount'),
  settingsOverlay: document.getElementById('settingsOverlay'),
  settingWork: document.getElementById('settingWork'),
  settingShortBreak: document.getElementById('settingShortBreak'),
  settingLongBreak: document.getElementById('settingLongBreak'),
  settingLongBreakInterval: document.getElementById('settingLongBreakInterval'),
  settingSound: document.getElementById('settingSound'),
  settingNotification: document.getElementById('settingNotification'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  btnCloseSettings: document.getElementById('btnCloseSettings'),
  toast: document.getElementById('toast'),
};

// --- Constants ---
const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.49

// --- State ---
const state = {
  phase: 'work',           // 'work' | 'shortBreak' | 'longBreak'
  status: 'idle',          // 'idle' | 'running' | 'paused'
  totalSeconds: 0,
  remainingSeconds: 0,
  completedToday: 0,
  isPinned: false,
  timerInterval: null,
};

// --- Settings (defaults) ---
const settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  notificationEnabled: true,
};

// --- Audio ---
let audioCtx = null;

function playSound() {
  if (!settings.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Pleasant three-note chime
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      g.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.4);
      o.start(now + i * 0.15);
      o.stop(now + i * 0.15 + 0.4);
    });
  } catch (e) {
    // Audio not available
  }
}

// --- Notification ---
async function sendNotification(title, body) {
  if (!settings.notificationEnabled) return;
  try {
    if (window.pomodoro) {
      await window.pomodoro.showNotification(title, body);
    }
  } catch (e) {
    // Not available
  }
}

// --- Load/Save Settings ---
function loadSettings() {
  try {
    const saved = localStorage.getItem('pomodoro-settings');
    if (saved) {
      Object.assign(settings, JSON.parse(saved));
    }
  } catch (e) { /* use defaults */ }
  syncSettingsToInputs();
}

function saveSettings() {
  syncSettingsFromInputs();
  localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  resetTimer();
}

function syncSettingsToInputs() {
  el.settingWork.value = settings.workDuration;
  el.settingShortBreak.value = settings.shortBreakDuration;
  el.settingLongBreak.value = settings.longBreakDuration;
  el.settingLongBreakInterval.value = settings.longBreakInterval;
  el.settingSound.checked = settings.soundEnabled;
  el.settingNotification.checked = settings.notificationEnabled;
}

function syncSettingsFromInputs() {
  settings.workDuration = Math.max(1, Math.min(120, parseInt(el.settingWork.value) || 25));
  settings.shortBreakDuration = Math.max(1, Math.min(30, parseInt(el.settingShortBreak.value) || 5));
  settings.longBreakDuration = Math.max(1, Math.min(60, parseInt(el.settingLongBreak.value) || 15));
  settings.longBreakInterval = Math.max(2, Math.min(8, parseInt(el.settingLongBreakInterval.value) || 4));
  settings.soundEnabled = el.settingSound.checked;
  settings.notificationEnabled = el.settingNotification.checked;
}

// --- Daily Stats ---
function loadTodayStats() {
  const today = new Date().toDateString();
  try {
    const stats = JSON.parse(localStorage.getItem('pomodoro-stats') || '{}');
    if (stats.date === today) {
      state.completedToday = stats.count || 0;
    } else {
      state.completedToday = 0;
    }
  } catch (e) {
    state.completedToday = 0;
  }
  updateSessionDisplay();
}

function saveTodayStats() {
  const today = new Date().toDateString();
  localStorage.setItem('pomodoro-stats', JSON.stringify({
    date: today,
    count: state.completedToday,
  }));
}

function incrementCompleted() {
  state.completedToday++;
  saveTodayStats();
  updateSessionDisplay();
  showToast(`🎉 太棒了！今天已完成 ${state.completedToday} 个番茄`);
}

// --- Timer Logic ---
function getPhaseDuration() {
  switch (state.phase) {
    case 'work': return settings.workDuration;
    case 'shortBreak': return settings.shortBreakDuration;
    case 'longBreak': return settings.longBreakDuration;
    default: return 25;
  }
}

function resetTimer() {
  stopTimer();
  state.status = 'idle';
  state.totalSeconds = getPhaseDuration() * 60;
  state.remainingSeconds = state.totalSeconds;
  updateDisplay();
  updateProgressRing();
  updateButtonState();
  el.timerContainer.classList.remove('finished');
}

function startTimer() {
  if (state.status === 'running') return;

  if (state.status === 'paused') {
    // Resume
    state.status = 'running';
  } else {
    // Fresh start
    state.totalSeconds = getPhaseDuration() * 60;
    state.remainingSeconds = state.totalSeconds;
    state.status = 'running';
    el.timerContainer.classList.remove('finished');
  }

  state.timerInterval = setInterval(tick, 1000);
  updateButtonState();
  updateDisplay();
}

function pauseTimer() {
  stopTimer();
  state.status = 'paused';
  updateButtonState();
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function tick() {
  if (state.remainingSeconds <= 0) {
    timerComplete();
    return;
  }
  state.remainingSeconds--;
  updateDisplay();
  updateProgressRing();
}

function timerComplete() {
  stopTimer();
  state.status = 'idle';
  el.timerContainer.classList.add('finished');

  if (state.phase === 'work') {
    incrementCompleted();
    // Determine next phase
    if (state.completedToday % settings.longBreakInterval === 0) {
      setPhase('longBreak');
      sendNotification('工作完成！', '该来一次长休息了，放松一下吧 ☕');
    } else {
      setPhase('shortBreak');
      sendNotification('工作完成！', '休息一下，马上回来 💪');
    }
  } else {
    // Break finished
    setPhase('work');
    sendNotification('休息结束！', '准备好开始下一个番茄了吗？🎯');
  }

  playSound();
  resetTimer();
  showToast(getPhaseName(state.phase) + ' 开始！');
}

function setPhase(phase) {
  state.phase = phase;
  // Update phase tabs
  el.phaseTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.phase === phase);
  });
  // Update timer container class
  el.timerContainer.className = 'timer-container phase-' + phase;
  resetTimer();
}

function getPhaseName(phase) {
  switch (phase) {
    case 'work': return '工作时间';
    case 'shortBreak': return '短休息';
    case 'longBreak': return '长休息';
    default: return '';
  }
}

// --- Display Updates ---
function updateDisplay() {
  const mins = Math.floor(state.remainingSeconds / 60);
  const secs = state.remainingSeconds % 60;
  el.minutes.textContent = String(mins).padStart(2, '0');
  el.seconds.textContent = String(secs).padStart(2, '0');
}

function updateProgressRing() {
  const fraction = state.totalSeconds > 0
    ? 1 - (state.remainingSeconds / state.totalSeconds)
    : 1;
  const offset = RING_CIRCUMFERENCE * fraction;
  el.progressRing.style.strokeDashoffset = offset;
}

function updateButtonState() {
  switch (state.status) {
    case 'idle':
      el.btnStartText.textContent = '开始';
      el.btnStart.classList.remove('running');
      el.btnStart.disabled = false;
      el.btnReset.disabled = true;
      break;
    case 'running':
      el.btnStartText.textContent = '暂停';
      el.btnStart.classList.add('running');
      el.btnStart.disabled = false;
      el.btnReset.disabled = false;
      break;
    case 'paused':
      el.btnStartText.textContent = '继续';
      el.btnStart.classList.remove('running');
      el.btnStart.disabled = false;
      el.btnReset.disabled = false;
      break;
  }
}

function updateSessionDisplay() {
  const dots = el.sessionDots.querySelectorAll('.dot');
  const completedInSet = state.completedToday % settings.longBreakInterval;

  dots.forEach((dot, i) => {
    dot.classList.toggle('completed', i < completedInSet);
  });

  el.sessionCount.textContent = state.completedToday;
}

// --- Toast ---
let toastTimeout = null;
function showToast(message) {
  if (toastTimeout) clearTimeout(toastTimeout);
  el.toast.textContent = message;
  el.toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    el.toast.classList.remove('show');
  }, 2500);
}

// --- Event Handlers ---
el.btnStart.addEventListener('click', () => {
  if (state.status === 'running') {
    pauseTimer();
  } else {
    startTimer();
  }
});

el.btnReset.addEventListener('click', () => {
  resetTimer();
});

el.btnPin.addEventListener('click', async () => {
  state.isPinned = !state.isPinned;
  el.btnPin.classList.toggle('active', state.isPinned);
  try {
    if (window.pomodoro) {
      await window.pomodoro.setAlwaysOnTop(state.isPinned);
    }
  } catch (e) { /* not available */ }
  showToast(state.isPinned ? '窗口已置顶 📌' : '窗口已取消置顶');
});

el.btnSettings.addEventListener('click', () => {
  syncSettingsToInputs();
  el.settingsOverlay.classList.add('visible');
});

el.btnCloseSettings.addEventListener('click', () => {
  el.settingsOverlay.classList.remove('visible');
});

el.settingsOverlay.addEventListener('click', (e) => {
  if (e.target === el.settingsOverlay) {
    el.settingsOverlay.classList.remove('visible');
  }
});

el.btnSaveSettings.addEventListener('click', () => {
  saveSettings();
  el.settingsOverlay.classList.remove('visible');
  updateSessionDisplay(); // refresh dots in case interval changed
  showToast('设置已保存 ✅');
});

// Phase tab clicks
el.phaseTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (state.status === 'running') {
      if (!confirm('切换阶段会重置当前计时，确定吗？')) return;
    }
    setPhase(tab.dataset.phase);
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // Don't capture when typing in inputs

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (state.status === 'running') {
        pauseTimer();
      } else {
        startTimer();
      }
      break;
    case 'KeyR':
      if (!e.ctrlKey && !e.metaKey) {
        resetTimer();
      }
      break;
  }
});

// --- Init ---
function init() {
  loadSettings();
  loadTodayStats();
  el.progressRing.style.strokeDasharray = RING_CIRCUMFERENCE;
  el.progressRing.style.strokeDashoffset = 0;
  setPhase('work');
}

init();
