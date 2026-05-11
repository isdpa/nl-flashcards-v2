/* ------------------------------
   Correctif iPhone : hauteur réelle du viewport
--------------------------------*/

function updateViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);

/* ------------------------------
   Variables globales
--------------------------------*/

let allCards = [];
let queue = [];
let correctCount = 0;
let totalCount = 0;
let isFlipped = false;
let showContext = false;

/* ------------------------------
   Initialisation
--------------------------------*/

async function init() {
  try {
    const res = await fetch('data/irreguliers_full.json');
    const data = await res.json();
    allCards = data.cards || [];
    startSession(allCards);
  } catch (e) {
    setError('Impossible de charger les données. Servez le site via HTTP.');
  }
}

/* ------------------------------
   Session
--------------------------------*/

function startSession(cards) {
  if (cards.length === 0) {
    setError('Aucune carte disponible.');
    return;
  }

  queue = shuffle([...cards]);
  correctCount = 0;
  totalCount = cards.length;
  isFlipped = false;

  document.getElementById('completion').classList.add('hidden');
  document.getElementById('card').classList.remove('hidden');
  document.getElementById('answer-btns').classList.add('hidden');

  updateScoreDisplay(0, cards.length, cards.length);
  showCard(queue[0]);
  updateViewportHeight();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------
   Affichage des cartes
--------------------------------*/

function showCard(card) {
  const cardEl = document.getElementById('card');

  cardEl.style.transition = 'none';
  cardEl.classList.remove('flipped');
  void cardEl.offsetHeight;
  cardEl.style.transition = '';

  isFlipped = false;
  document.getElementById('answer-btns').classList.remove('hidden');
  document.getElementById('skip-btn').classList.remove('hidden');
  document.getElementById('incorrect-btn').classList.add('hidden');
  document.getElementById('correct-btn').classList.add('hidden');

  // Face avant
  document.getElementById('word-nl').textContent = card.nl;
  document.getElementById('word-fr-front').textContent = card.fr;

  // Face arrière
  document.getElementById('word-nl-back').textContent = card.nl;
  document.getElementById('conj-preterit').textContent = card.preterit || '–';
  document.getElementById('conj-participe').textContent = card.participe_passe || '–';

  ['badge-front', 'badge-back'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = 'verbe';
    el.style.background = '#3b82f6';
  });

  const ctxEl = document.getElementById('context-box');
  if (card.context_nl) {
    document.getElementById('context-nl').textContent = card.context_nl;
    document.getElementById('context-fr').textContent = card.context_fr || '';
    ctxEl.classList.toggle('hidden', !showContext);
  } else {
    ctxEl.classList.add('hidden');
  }

  updateViewportHeight();
}

function flip() {
  if (queue.length === 0 || isFlipped) return;
  isFlipped = true;
  document.getElementById('skip-btn').classList.add('hidden');
  document.getElementById('card').classList.add('flipped');
  setTimeout(() => {
    document.getElementById('incorrect-btn').classList.remove('hidden');
    document.getElementById('correct-btn').classList.remove('hidden');
  }, 280);
  updateViewportHeight();
}

/* ------------------------------
   Réponses
--------------------------------*/

function skipCard() {
  if (isFlipped || queue.length === 0) return;
  queue.shift();
  correctCount++;
  updateScoreDisplay(correctCount, queue.length, totalCount);
  if (queue.length === 0) showCompletion();
  else showCard(queue[0]);
}

function markCorrect() {
  if (!isFlipped || queue.length === 0) return;
  queue.shift();
  correctCount++;
  updateScoreDisplay(correctCount, queue.length, totalCount);
  if (queue.length === 0) showCompletion();
  else showCard(queue[0]);
}

function markIncorrect() {
  if (!isFlipped || queue.length === 0) return;
  const card = queue.shift();
  if (queue.length > 0) {
    const pos = Math.floor(Math.random() * queue.length) + 1;
    queue.splice(pos, 0, card);
  } else {
    queue.push(card);
  }
  showCard(queue[0]);
}

function updateScoreDisplay(correct, remaining, total) {
  document.getElementById('score-correct').textContent = correct;
  document.getElementById('score-remaining').textContent = remaining;
  const pct = total > 0 ? (correct / total) * 100 : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
}

/* ------------------------------
   Fin de session
--------------------------------*/

function showCompletion() {
  document.getElementById('card').classList.add('hidden');
  document.getElementById('answer-btns').classList.add('hidden');
  document.getElementById('completion').classList.remove('hidden');
  updateViewportHeight();
}

/* ------------------------------
   Contexte
--------------------------------*/

function toggleContext() {
  showContext = document.getElementById('show-context').checked;
  if (queue.length === 0) return;
  const card = queue[0];
  if (card.context_nl) {
    document.getElementById('context-box').classList.toggle('hidden', !showContext);
  }
}

/* ------------------------------
   Erreur
--------------------------------*/

function setError(msg) {
  document.getElementById('word-nl').textContent = msg;
}

/* ------------------------------
   Événements
--------------------------------*/

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('card').addEventListener('click', flip);
  document.getElementById('skip-btn').addEventListener('click', skipCard);
  document.getElementById('correct-btn').addEventListener('click', markCorrect);
  document.getElementById('incorrect-btn').addEventListener('click', markIncorrect);
  document.getElementById('show-context').addEventListener('change', toggleContext);
  document.getElementById('restart-btn').addEventListener('click', () => startSession(allCards));

  document.addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowRight' && isFlipped) markCorrect();
    else if (e.key === 'ArrowLeft'  && isFlipped) markIncorrect();
  });

  init();
});