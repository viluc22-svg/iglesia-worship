import './style.css'
import { songs } from './data'
import type { Song } from './data'

// Interfaces
interface User {
  email: string;
  name: string;
  instrument: string;
  password?: string;
  role: 'user' | 'admin';
}

// DOM Elements
const songGrid = document.querySelector<HTMLDivElement>('#song-grid')!;
const searchInput = document.querySelector<HTMLInputElement>('#search-input')!;
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn');
const songModal = document.querySelector<HTMLDivElement>('#song-modal')!;
const modalClose = document.querySelector<HTMLButtonElement>('#modal-close')!;
const modalTitle = document.querySelector<HTMLHeadingElement>('#modal-title')!;
const modalAuthor = document.querySelector<HTMLParagraphElement>('#modal-author')!;
const modalLyrics = document.querySelector<HTMLDivElement>('#modal-lyrics')!;
const modalBody = document.querySelector<HTMLDivElement>('#modal-body')!;
const progressBar = document.querySelector<HTMLDivElement>('#progress-bar')!;
const progressContainer = document.querySelector<HTMLDivElement>('#progress-container')!;
const currentTimeEl = document.querySelector<HTMLSpanElement>('.time.current')!;
const totalTimeEl = document.querySelector<HTMLSpanElement>('.time.total')!;
const playPauseBtn = document.querySelector<HTMLButtonElement>('#play-pause-btn')!;
const playIcon = document.querySelector<HTMLSpanElement>('#play-icon')!;

// Auth Elements
const authModal = document.querySelector<HTMLDivElement>('#auth-modal')!;
const authTrigger = document.querySelector<HTMLButtonElement>('#login-trigger')!;
const authClose = document.querySelector<HTMLButtonElement>('#auth-close')!;
const authForm = document.querySelector<HTMLFormElement>('#auth-form')!;
const authTabs = document.querySelectorAll<HTMLButtonElement>('.auth-tab');
const registerFields = document.querySelector<HTMLDivElement>('#register-fields')!;
const authSubmit = document.querySelector<HTMLButtonElement>('#auth-submit')!;
const authMessage = document.querySelector<HTMLParagraphElement>('#auth-message')!;

// Admin Elements
const adminDashboard = document.querySelector<HTMLDivElement>('#admin-dashboard')!;
const adminClose = document.querySelector<HTMLButtonElement>('#admin-close')!;
const userListContainer = document.querySelector<HTMLDivElement>('#user-list')!;

// State
let currentFilter = 'all';
let searchQuery = '';
let authMode: 'login' | 'register' = 'login';
let currentUser: User | null = JSON.parse(localStorage.getItem('worship_user') || 'null');
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

// Initialization
function init() {
  updateUserUI();
  renderSongs();
  setupEventListeners();
  
  // Create default admin if not exists
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  if (!users.find(u => u.email === 'admin@worship.com')) {
    users.push({
      email: 'admin@worship.com',
      name: 'Administrador',
      instrument: 'Director',
      password: 'admin',
      role: 'admin'
    });
    localStorage.setItem('worship_users', JSON.stringify(users));
  }
}

function renderSongs() {
  const filteredSongs = songs.filter(song => {
    const matchesFilter = currentFilter === 'all' || song.category === currentFilter;
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          song.lyrics.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  songGrid.innerHTML = filteredSongs.map((song, index) => `
    <div class="song-card" data-id="${song.id}" style="animation: premium-entry 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both;">
      <div>
        <span class="song-category">${song.category}</span>
        <h3>${song.title}</h3>
      </div>
      <p style="margin-bottom: 2rem;">${song.author}</p>
      
      <div class="song-instruments">
        <a href="${song.scores.guitar}" class="inst-btn" title="Guitarra" target="_blank" onclick="event.stopPropagation()">🎸</a>
        <a href="${song.scores.piano}" class="inst-btn" title="Piano" target="_blank" onclick="event.stopPropagation()">🎹</a>
        <a href="${song.scores.bass}" class="inst-btn" title="Bajo" target="_blank" onclick="event.stopPropagation()">🎸_</a>
        <a href="${song.scores.drums}" class="inst-btn" title="Batería" target="_blank" onclick="event.stopPropagation()">🥁</a>
      </div>
    </div>
  `).join('');

  // Add interactions to cards
  const cards = document.querySelectorAll<HTMLDivElement>('.song-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const song = songs.find(s => s.id === id);
      if (song) openSongModal(song);
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - (rect.height / 2)) / 10;
      const rotateY = ((rect.width / 2) - x) / 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-20px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
    });
  });
}

function openSongModal(song: Song) {
  modalTitle.textContent = song.title;
  modalAuthor.textContent = `Autor: ${song.author}`;
  modalLyrics.innerHTML = song.lyrics.split('\n').map(line => line.trim() === '' ? '<br>' : `<div>${line}</div>`).join('');
  
  modalBody.scrollTop = 0; // Reset scroll position

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeEventListener('timeupdate', updateProgress);
    currentAudio = null;
  }

  // Intentamos con la ruta relativa que Vite maneja automáticamente desde public/
  const audioPath = song.audioUrl;
  console.log(`🎵 Intentando reproducir: ${audioPath}`);
  
  currentAudio = new Audio(audioPath);
  isPlaying = false;
  updatePlayButton();

  const handleError = (e: any) => {
    const error = e.target.error;
    console.error(`❌ Error de audio (${error ? error.code : 'Desconocido'}):`, error);
    console.warn(`No se pudo cargar: ${audioPath}. Iniciando modo demo.`);
    
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      currentAudio.load();
      if (isPlaying) currentAudio.play().catch(console.error);
    }
  };

  currentAudio.addEventListener('error', handleError, { once: true });
  currentAudio.addEventListener('timeupdate', updateProgress);
  
  // Verificamos si carga correctamente
  currentAudio.addEventListener('canplaythrough', () => {
    console.log(`✅ Audio cargado exitosamente: ${audioPath}`);
  }, { once: true });
  currentAudio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(currentAudio!.duration);
  });
  currentAudio.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayButton();
  });

  songModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSongModal() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isPlaying = false;
  songModal.classList.remove('active');
  document.body.style.overflow = '';
}

function togglePlay() {
  if (!currentAudio) return;
  if (isPlaying) {
    currentAudio.pause();
  } else {
    currentAudio.play();
  }
  isPlaying = !isPlaying;
  updatePlayButton();
}

function updatePlayButton() {
  playIcon.textContent = isPlaying ? '⏸' : '▶';
  playPauseBtn.title = isPlaying ? 'Pausar' : 'Reproducir';
}

function updateProgress() {
  if (!currentAudio) return;
  const { duration, currentTime } = currentAudio;
  const progressPercent = (currentTime / duration) * 100;
  progressBar.style.width = `${progressPercent}%`;
  currentTimeEl.textContent = formatTime(currentTime);

  // Advanced Auto-scroll logic: Maintain "current" part in middle of viewport
  if (duration > 0) {
    const scrollHeight = modalBody.scrollHeight - modalBody.clientHeight;
    // Aumentamos el "lead time" a 6 segundos para que baje considerablemente más rápido
    const predictiveTime = Math.min(currentTime + 6, duration);
    const targetScroll = (predictiveTime / duration) * scrollHeight;
    modalBody.scrollTop = targetScroll;
  }
}

function handleLyricsClick(e: MouseEvent) {
  if (!currentAudio || currentAudio.duration === 0) return;
  
  // Estimate song position based on vertical click in the lyrics container
  const rect = modalLyrics.getBoundingClientRect();
  const clickY = e.clientY - rect.top;
  const totalHeight = rect.height;
  
  const percentage = clickY / totalHeight;
  currentAudio.currentTime = percentage * currentAudio.duration;
  
  // Small feedback effect? Maybe later
}

function setProgress(e: MouseEvent) {
  if (!currentAudio) return;
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = currentAudio.duration;
  currentAudio.currentTime = (clickX / width) * duration;
}

function formatTime(time: number) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Authentication Logic
function toggleAuthModal(show: boolean) {
  if (show) {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
    authMessage.textContent = '';
    authForm.reset();
  }
}

function switchAuthMode(mode: 'login' | 'register') {
  authMode = mode;
  authTabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-type') === mode);
  });
  registerFields.classList.toggle('hidden', mode === 'login');
  authSubmit.textContent = mode === 'login' ? 'Entrar' : 'Registrarse';
}

function updateUserUI() {
  const btnText = authTrigger.querySelector('.btn-text')!;
  const btnIcon = authTrigger.querySelector('.btn-icon')!;
  
  if (currentUser) {
    btnText.textContent = currentUser.name;
    btnIcon.textContent = '🏠'; // Or instrument icon
    if (currentUser.role === 'admin') {
      authTrigger.title = "Haz clic para ver el panel de administración";
    }
  } else {
    btnText.textContent = 'Iniciar Sesión';
    btnIcon.textContent = '👤';
    authTrigger.title = "";
  }
}

function handleAuthSubmit(e: Event) {
  e.preventDefault();
  const email = (document.querySelector('#auth-email') as HTMLInputElement).value;
  const password = (document.querySelector('#auth-password') as HTMLInputElement).value;
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');

  if (authMode === 'login') {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem('worship_user', JSON.stringify(user));
      showMessage('¡Bienvenido de nuevo!', 'success');
      setTimeout(() => {
        toggleAuthModal(false);
        updateUserUI();
      }, 1000);
    } else {
      showMessage('Correo o contraseña incorrectos', 'error');
    }
  } else {
    const name = (document.querySelector('#auth-name') as HTMLInputElement).value;
    const instrument = (document.querySelector('#auth-instrument') as HTMLSelectElement).value;
    
    if (users.find(u => u.email === email)) {
      showMessage('Este correo ya está registrado', 'error');
      return;
    }

    const newUser: User = { email, name, instrument, password, role: 'user' };
    users.push(newUser);
    localStorage.setItem('worship_users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('worship_user', JSON.stringify(newUser));
    
    showMessage('Cuenta creada con éxito', 'success');
    setTimeout(() => {
      toggleAuthModal(false);
      updateUserUI();
    }, 1000);
  }
}

function showMessage(text: string, type: 'error' | 'success') {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

// Admin Logic
function openAdminDashboard() {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  userListContainer.innerHTML = users.map(user => `
    <div class="user-item">
      <span>${user.name}</span>
      <span>${user.email}</span>
      <span>${user.instrument}</span>
    </div>
  `).join('');
  adminDashboard.classList.remove('hidden');
}

function setupEventListeners() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    renderSongs();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-category') || 'all';
      renderSongs();
    });
  });

  modalClose.addEventListener('click', closeSongModal);
  window.addEventListener('click', (e) => {
    if (e.target === songModal) closeSongModal();
    if (e.target === authModal) toggleAuthModal(false);
    if (e.target === adminDashboard) adminDashboard.classList.add('hidden');
  });

  authTrigger.addEventListener('click', () => {
    if (currentUser && currentUser.role === 'admin') {
      openAdminDashboard();
    } else if (!currentUser) {
      toggleAuthModal(true);
    } else {
      // Logout logic? Or profile? User said "who registers", implied admin check.
      // Let's make it so clicking while logged in as admin opens dashboard.
      // If regular user, maybe just show message or logout.
      if (confirm('¿Deseas cerrar sesión?')) {
        currentUser = null;
        localStorage.removeItem('worship_user');
        updateUserUI();
      }
    }
  });

  authClose.addEventListener('click', () => toggleAuthModal(false));
  
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type') as 'login' | 'register';
      switchAuthMode(type);
    });
  });

  authForm.addEventListener('submit', handleAuthSubmit);
  adminClose.addEventListener('click', () => adminDashboard.classList.add('hidden'));

  playPauseBtn.addEventListener('click', togglePlay);
  progressContainer.addEventListener('click', setProgress);
  modalLyrics.addEventListener('click', handleLyricsClick);
  
  const adminFooterTrigger = document.querySelector('#admin-trigger-footer');
  if (adminFooterTrigger) {
    adminFooterTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentUser && currentUser.role === 'admin') {
        openAdminDashboard();
      } else {
        alert('Debes iniciar sesión como administrador para acceder al panel.');
        toggleAuthModal(true);
      }
    });
  }
}

init();
