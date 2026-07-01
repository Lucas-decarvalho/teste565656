// --- STATE AND DATA ---

const questions = [
  {
    id: 1,
    title: "Quais dessas marcas de refrigerante você consome com mais frequência?",
    subtitle: "Toque no quadrado e selecione sua marca de preferência",
    options: ["Schin", "Guaraná Antarctica", "Sprite", "Coca-Cola", "Nenhuma das anteriores"],
    reward: 30.00 // Balance goes from 90.00 to 120.00
  },
  {
    id: 2,
    title: "Qual desses serviços de streaming você mais assiste em seu dia a dia?",
    subtitle: "Toque no quadrado e selecione sua marca de preferência",
    options: ["Netflix", "Amazon Prime Video", "Disney+", "HBO Max", "Nenhum dos anteriores"],
    reward: 48.00 // Balance goes from 120.00 to 168.00
  },
  {
    id: 3,
    title: "Qual dessas marcas de celular você escolheria para comprar hoje?",
    subtitle: "Toque no quadrado e selecione sua marca de preferência",
    options: ["Apple (iPhone)", "Samsung", "Xiaomi", "Motorola", "Nenhum dos anteriores"],
    reward: 12.00 // Balance goes from 168.00 to 180.00
  }
];

let appState = {
  currentQuestionIndex: 0,
  balance: 0.00,
  selectedOption: null,
  isRecording: false,
  videoDuration: 60, // 60 seconds (1 minute simulated video)
  videoCurrentTime: 0,
  videoPlaying: false,
  videoInterval: null,
  selectedPixType: 'cpf'
};

// --- DOM ELEMENTS ---
const balanceDisplay = document.getElementById('balance-display');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Screens
const screenIntro = document.getElementById('screen-intro');
const screenQuestionnaire = document.getElementById('screen-questionnaire');
const screenCashout = document.getElementById('screen-cashout');

// Buttons
const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const btnSpinner = document.getElementById('btn-spinner');
const btnArrow = document.getElementById('btn-arrow');
const btnCashoutAction = document.getElementById('btn-cashout-action');

// Question Elements
const questionText = document.getElementById('question-text');
const questionSub = document.getElementById('question-sub');
const choicesContainer = document.getElementById('choices-container');

// HTML5 VSL Video Elements
const vslVideoWrapper = document.getElementById('vsl-video-wrapper');
const vslVideo = document.getElementById('vsl-video');
const videoOverlayPlay = document.getElementById('video-overlay-play');
const videoPlayToggle = document.getElementById('video-play-toggle');
const videoTimeDisplay = document.getElementById('video-time-display');
const videoProgressBar = document.getElementById('video-progress-bar');
const videoProgressContainer = document.getElementById('video-progress-container');
const unlockBadgeStatus = document.getElementById('unlock-badge-status');

// Pix Modal Elements
const pixModal = document.getElementById('pix-modal');
const closeModal = document.getElementById('close-modal');
const pixKeyInput = document.getElementById('pix-key-input');
const btnSubmitPix = document.getElementById('btn-submit-pix');
const pixSpinner = document.getElementById('pix-spinner');
const pixFormFields = document.getElementById('pix-form-fields');
const pixLoadingState = document.getElementById('pix-loading-state');
const pixLoadingTitle = document.getElementById('pix-loading-title');
const pixLoadingSub = document.getElementById('pix-loading-sub');
const pixSuccessState = document.getElementById('pix-success-state');
const btnSuccessClose = document.getElementById('btn-success-close');
const pixTypeCards = document.querySelectorAll('[data-pix-type]');

// --- BALANCE ANIMATION ---

function animateBalance(startValue, endValue, duration = 1200) {
  const startTime = performance.now();
  
  // Add highlight pulse class to header pill
  const pill = document.getElementById('balance-pill');
  balanceDisplay.classList.add('pulse');
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out quad
    const easeProgress = progress * (2 - progress);
    
    const currentValue = startValue + (endValue - startValue) * easeProgress;
    balanceDisplay.textContent = `R$ ${currentValue.toFixed(2).replace('.', ',')}`;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      balanceDisplay.textContent = `R$ ${endValue.toFixed(2).replace('.', ',')}`;
      appState.balance = endValue;
      setTimeout(() => {
        balanceDisplay.classList.remove('pulse');
      }, 200);
    }
  }
  
  requestAnimationFrame(update);
}

// --- SCREEN TRANSITIONS ---

function transitionScreen(fromScreen, toScreen, callback) {
  fromScreen.classList.remove('visible');
  setTimeout(() => {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
    // Trigger reflow
    toScreen.getBoundingClientRect();
    toScreen.classList.add('visible');
    if (callback) callback();
  }, 400);
}

// --- QUESTION BUILDER ---

function loadQuestion(index) {
  const q = questions[index];
  questionText.textContent = q.title;
  questionSub.textContent = q.subtitle;
  
  // Clear previous options
  choicesContainer.innerHTML = '';
  appState.selectedOption = null;
  btnNext.disabled = true;
  
  // Create modern choice cards
  q.options.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.innerHTML = `
      <div class="choice-left">
        <div class="choice-radio"></div>
        <span class="choice-text">${opt}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // Clear previous selection
      const active = choicesContainer.querySelector('.choice-card.selected');
      if (active) active.classList.remove('selected');
      
      // Select current
      card.classList.add('selected');
      appState.selectedOption = opt;
      btnNext.disabled = false;
    });
    
    choicesContainer.appendChild(card);
  });
  
  // Update progress bar
  const totalQuestions = questions.length;
  const percentage = (index / totalQuestions) * 100;
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `Pergunta ${index + 1} de ${totalQuestions}`;
}

// --- CONFETTI SYSTEM ---

function startConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  
  const colors = ['#ff0000', '#0066ff', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
  const pieceCount = 80;
  
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    
    // Randomize properties
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const scale = 0.5 + Math.random() * 0.8;
    const rotate = Math.random() * 360;
    
    piece.style.backgroundColor = color;
    piece.style.left = `${left}%`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.transform = `rotate(${rotate}deg) scale(${scale})`;
    
    container.appendChild(piece);
  }
}

// --- HTML5 VSL VIDEO PLAYER CONTROL ---

// Format seconds into MM:SS
function formatTime(secs) {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

let vslUnlocked = false;

let isSimulatedPlayback = false;
let simulatedInterval = null;
let simulatedDuration = 60; // Default simulated length (60s)
let simulatedCurrentTime = 0;

// Play / Pause Toggle
function toggleVslPlay() {
  if (isSimulatedPlayback) {
    runSimulatedVslToggle();
    return;
  }

  if (vslVideo.paused) {
    vslVideo.play().catch(err => {
      console.warn("Real video playback failed, falling back to simulated playback:", err);
      isSimulatedPlayback = true;
      runSimulatedVslToggle();
    });
  } else {
    vslVideo.pause();
  }
}

function runSimulatedVslToggle() {
  if (appState.videoPlaying) {
    // Pause simulation
    appState.videoPlaying = false;
    videoPlayToggle.textContent = '▶';
    videoOverlayPlay.style.opacity = '1';
    videoOverlayPlay.style.pointerEvents = 'all';
    clearInterval(simulatedInterval);
  } else {
    // Play simulation
    appState.videoPlaying = true;
    videoPlayToggle.textContent = '⏸';
    videoOverlayPlay.style.opacity = '0';
    videoOverlayPlay.style.pointerEvents = 'none';
    
    // Set simulated duration based on video duration if available, else default to 60
    if (!isNaN(vslVideo.duration) && vslVideo.duration > 0 && vslVideo.duration !== Infinity) {
      simulatedDuration = vslVideo.duration;
    }
    
    simulatedInterval = setInterval(() => {
      simulatedCurrentTime += 1;
      
      // Update progress bar non-linearly
      const actualProgress = Math.min(simulatedCurrentTime / simulatedDuration, 1);
      const displayProgress = Math.pow(actualProgress, 0.45);
      videoProgressBar.style.width = `${displayProgress * 100}%`;
      
      // Update Time label
      videoTimeDisplay.textContent = `${formatTime(simulatedCurrentTime)} / ${formatTime(simulatedDuration)}`;
      
      // Check trigger
      const triggerTime = Math.min(simulatedDuration * 0.9, simulatedDuration - 8);
      if (simulatedCurrentTime >= triggerTime && !vslUnlocked) {
        unlockCashoutButton();
      }

      if (simulatedCurrentTime >= simulatedDuration) {
        appState.videoPlaying = false;
        videoPlayToggle.textContent = '▶';
        videoOverlayPlay.style.opacity = '1';
        videoOverlayPlay.style.pointerEvents = 'all';
        clearInterval(simulatedInterval);
      }
    }, 200); // 5 seconds of video time per real-world second (a 60s video plays in 12s!)
  }
}

// Listen for loading errors
vslVideo.addEventListener('error', () => {
  console.warn("Video loading error detected, fallback enabled.");
  isSimulatedPlayback = true;
});

// Listen to video state changes
vslVideo.addEventListener('play', () => {
  videoPlayToggle.textContent = '⏸';
  videoOverlayPlay.style.opacity = '0';
  videoOverlayPlay.style.pointerEvents = 'none';
});

vslVideo.addEventListener('pause', () => {
  videoPlayToggle.textContent = '▶';
  // Only show overlay again if it hasn't finished
  if (vslVideo.currentTime < vslVideo.duration) {
    videoOverlayPlay.style.opacity = '1';
    videoOverlayPlay.style.pointerEvents = 'all';
  }
});

vslVideo.addEventListener('timeupdate', () => {
  if (isNaN(vslVideo.duration)) return;
  
  // Non-linear progress bar (starts fast, slows down)
  // actualProgress goes from 0 to 1
  const actualProgress = vslVideo.currentTime / vslVideo.duration;
  // Math.pow(x, 0.45) shoots up quickly at the start (e.g. 10% video time = 45% progress bar width)
  const displayProgress = Math.pow(actualProgress, 0.45);
  const progressPct = displayProgress * 100;
  videoProgressBar.style.width = `${progressPct}%`;
  
  // Update Time label (displays real playback progress)
  videoTimeDisplay.textContent = `${formatTime(vslVideo.currentTime)} / ${formatTime(vslVideo.duration)}`;
  
  // Almost finished condition: 90% or 8 seconds remaining (whichever is earlier)
  const triggerTime = Math.min(vslVideo.duration * 0.9, vslVideo.duration - 8);
  
  if (vslVideo.currentTime >= triggerTime && !vslUnlocked) {
    unlockCashoutButton();
  }
});

vslVideo.addEventListener('loadedmetadata', () => {
  videoTimeDisplay.textContent = `0:00 / ${formatTime(vslVideo.duration)}`;
});

vslVideo.addEventListener('ended', () => {
  videoPlayToggle.textContent = '▶';
  videoOverlayPlay.style.opacity = '1';
  videoOverlayPlay.style.pointerEvents = 'all';
});

// Click wrapper to toggle play
vslVideo.addEventListener('click', toggleVslPlay);
videoOverlayPlay.addEventListener('click', toggleVslPlay);

// Click play-pause overlay icon
videoPlayToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleVslPlay();
});

// Secret skip-to-end shortcut for testing and configuration
function skipToVslEnd() {
  console.log("VSL skipped to near end for testing.");
  if (isSimulatedPlayback) {
    simulatedCurrentTime = simulatedDuration - 4;
  } else {
    if (!isNaN(vslVideo.duration) && vslVideo.duration > 0) {
      vslVideo.currentTime = vslVideo.duration - 4;
    }
  }
}

// Double click player or click on lock badge to skip
vslVideo.addEventListener('dblclick', skipToVslEnd);
videoOverlayPlay.addEventListener('dblclick', skipToVslEnd);
unlockBadgeStatus.style.cursor = 'pointer';
unlockBadgeStatus.addEventListener('click', (e) => {
  e.stopPropagation();
  skipToVslEnd();
});

function unlockCashoutButton() {
  vslUnlocked = true;
  
  // Show button with slideUpFadeIn transition
  btnCashoutAction.classList.remove('vsl-btn-hidden');
  btnCashoutAction.classList.add('vsl-btn-visible');
  btnCashoutAction.disabled = false;
  
  // Glow green styling
  btnCashoutAction.style.background = 'linear-gradient(135deg, var(--accent-green) 0%, #27ae60 100%)';
  btnCashoutAction.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.4)';
  
  // Update lock status text
  unlockBadgeStatus.textContent = 'Liberado ✅';
  unlockBadgeStatus.style.color = 'var(--accent-green)';
  
  // Smoothly scroll to bring the cashout button into view
  setTimeout(() => {
    btnCashoutAction.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// --- EVENT LISTENERS ---

// Intro page Start button
btnStart.addEventListener('click', () => {
  transitionScreen(screenIntro, screenQuestionnaire, () => {
    // Show progress bar
    progressContainer.style.display = 'block';
    loadQuestion(0);
    // Animate initial balance to 90
    animateBalance(0.00, 90.00);
  });
});

// Questionnaire Next button
btnNext.addEventListener('click', () => {
  // Show spinner
  btnSpinner.style.display = 'block';
  btnArrow.style.display = 'none';
  btnNext.disabled = true;
  
  // Disable option selection during transition
  const cards = choicesContainer.querySelectorAll('.choice-card');
  cards.forEach(c => c.style.pointerEvents = 'none');
  
  const currentQ = questions[appState.currentQuestionIndex];
  const oldBalance = appState.balance;
  const newBalance = oldBalance + currentQ.reward;
  
  // Wait 1.2s to simulate processing
  setTimeout(() => {
    // Hide spinner
    btnSpinner.style.display = 'none';
    btnArrow.style.display = 'inline-block';
    
    // Transition
    if (appState.currentQuestionIndex < questions.length - 1) {
      appState.currentQuestionIndex++;
      
      // Load next question
      loadQuestion(appState.currentQuestionIndex);
      
      // Update balance
      animateBalance(oldBalance, newBalance);
    } else {
      // Last question completed! Go to cashout
      progressContainer.style.display = 'none';
      transitionScreen(screenQuestionnaire, screenCashout, () => {
        animateBalance(oldBalance, newBalance);
        startConfetti();
      });
    }
  }, 1200);
});

// Cashout Action (Opens Modal)
btnCashoutAction.addEventListener('click', () => {
  pixModal.style.display = 'flex';
  // Fade in modal
  setTimeout(() => {
    pixModal.style.opacity = '1';
  }, 10);
});

// Modal close action
function closePixModal() {
  pixModal.style.opacity = '0';
  setTimeout(() => {
    pixModal.style.display = 'none';
    // Reset modal states if finished
    if (pixSuccessState.style.display === 'flex') {
      pixSuccessState.style.display = 'none';
      pixFormFields.style.display = 'flex';
      pixKeyInput.value = '';
    }
  }, 300);
}

closeModal.addEventListener('click', closePixModal);
btnSuccessClose.addEventListener('click', closePixModal);

// Close modal when clicking background
pixModal.addEventListener('click', (e) => {
  if (e.target === pixModal) {
    closePixModal();
  }
});

// Pix Type selector cards
pixTypeCards.forEach(card => {
  card.addEventListener('click', () => {
    // Remove active
    pixTypeCards.forEach(c => c.classList.remove('selected'));
    
    // Select current
    card.classList.add('selected');
    const pixType = card.getAttribute('data-pix-type');
    appState.selectedPixType = pixType;
    
    // Update placeholder
    if (pixType === 'cpf') {
      pixKeyInput.placeholder = '000.000.000-00';
      pixKeyInput.type = 'text';
    } else if (pixType === 'phone') {
      pixKeyInput.placeholder = '(11) 99999-9999';
      pixKeyInput.type = 'tel';
    } else if (pixType === 'email') {
      pixKeyInput.placeholder = 'seu@email.com';
      pixKeyInput.type = 'email';
    } else {
      pixKeyInput.placeholder = 'Chave aleatória gerada pelo banco';
      pixKeyInput.type = 'text';
    }
    
    pixKeyInput.focus();
  });
});

// Pix Submit Form
btnSubmitPix.addEventListener('click', () => {
  const keyValue = pixKeyInput.value.trim();
  
  if (!keyValue) {
    pixKeyInput.style.borderColor = 'red';
    setTimeout(() => {
      pixKeyInput.style.borderColor = 'var(--card-border)';
    }, 2000);
    return;
  }
  
  // Show spinner, disable buttons
  pixSpinner.style.display = 'block';
  btnSubmitPix.disabled = true;
  
  setTimeout(() => {
    // Hide form, show loading transfer state
    pixFormFields.style.display = 'none';
    pixLoadingState.style.display = 'flex';
    
    // Step 1: Processing
    setTimeout(() => {
      pixLoadingTitle.textContent = 'Enviando PIX...';
      pixLoadingSub.textContent = 'Aguardando resposta do Banco Central';
      
      // Step 2: Approved
      setTimeout(() => {
        pixLoadingState.style.display = 'none';
        pixSuccessState.style.display = 'flex';
        // Celebrate!
        startConfetti();
      }, 1500);
      
    }, 1500);
    
  }, 1000);
});
