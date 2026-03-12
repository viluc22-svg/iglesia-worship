import './style.css'
import { songs } from './data'
import type { Song } from './data'

// Phase 4: Database Integration Imports
import {
  registerUserWithDB,
  createMusicianWithDB,
  updateMusicianWithDB,
  deleteMusicianWithDB,
  initializeDatabaseServices,
} from './services/database/Phase4Integration'
import { Logger } from './utils/logger'

// Phase 4: Chatbot Integration Imports
import { ChatbotWidget } from './services/chatbot/components/ChatbotWidget'
import { usePageContext } from './services/chatbot/hooks/usePageContext'
import { useChatbotStore } from './services/chatbot/store/chatbotStore'
import { ContextManager } from './services/chatbot/services/ContextManager'

// Interfaces
interface User {
  email: string;
  name: string;
  instrument: string;
  password?: string;
  role: 'user' | 'admin';
  lastActive?: number; // timestamp in ms
}

interface SettingsConfig {
  volume: number;
  microphoneId: string;
  speakerId: string;
}

interface AudioDevices {
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
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
const playPauseBtn = document.querySelector<HTMLButtonElement>('#play-btn')!;
const prevBtn = document.querySelector<HTMLButtonElement>('#prev-btn')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next-btn')!;

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
const adminLogout = document.querySelector<HTMLButtonElement>('#admin-logout')!;
const userListContainer = document.querySelector<HTMLDivElement>('#user-list')!;

// State
let currentFilter = 'all';
let searchQuery = '';
let authMode: 'login' | 'register' = 'login';
let currentUser: User | null = JSON.parse(localStorage.getItem('worship_user') || 'null');
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentSongId: string | null = null;
let currentSong: Song | null = null;
let adminSortConfig: { key: 'name' | 'email' | 'instrument'; direction: 'asc' | 'desc' } = { key: 'name', direction: 'asc' };

// Musicians Management State
let musicianSearchQuery: string = '';
let musicianInstrumentFilter: string = 'all';
let musicianFormMode: 'create' | 'edit' = 'create';
let currentEditingMusician: User | null = null;

// Initialization
function init() {
  updateUserUI();
  setupPresenceTracking();
  renderSongs();
// ... (rest of init)
  setupEventListeners();
  
  // Phase 4: Initialize database services
  initializeDatabaseServices();
  Logger.info('App', 'Application initialized with database integration');
  
  // Phase 4: Initialize Chatbot Widget
  initializeChatbot();
  Logger.info('App', 'Chatbot widget initialized');
  
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

// Presence Tracking (Heartbeat)
function setupPresenceTracking() {
  // Update immediately on load
  updatePresence();
  
  // Update every 1 minute
  setInterval(updatePresence, 60000);
  
  // Update on visibility change or user interaction
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updatePresence();
  });
  window.addEventListener('click', () => updatePresence(), { once: false, passive: true });
}

let lastPresenceUpdate = 0;
function updatePresence() {
  if (!currentUser) return;
  const now = Date.now();
  // Prevent flooding: max 1 update every 10 seconds per user locally
  if (now - lastPresenceUpdate < 10000) return;
  
  lastPresenceUpdate = now;
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const userIndex = users.findIndex(u => u.email === currentUser!.email);
  if (userIndex !== -1) {
    users[userIndex].lastActive = now;
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
  // Render lyrics with sync index on non-empty lines only
  let lineIndex = 0;
  modalLyrics.innerHTML = song.lyrics.split('\n').map(line => {
    if (line.trim() === '') return '<br>';
    const el = `<div class="lyric-line" data-line="${lineIndex}">${line}</div>`;
    lineIndex++;
    return el;
  }).join('');
  
  modalBody.scrollTop = 0; // Reset scroll position

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeEventListener('timeupdate', updateProgress);
    currentAudio = null;
  }

  // Preparamos la ruta considerando el BASE_URL de Vite (vital para GitHub Pages)
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
  const audioPath = `${baseUrl}${song.audioUrl.startsWith('/') ? song.audioUrl.substring(1) : song.audioUrl}`;
  
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
  currentAudio.addEventListener('ended', playNextSong);
  
  // Set Hash for History
  location.hash = `#song-${song.id}`;
  currentSongId = song.id;
  currentSong = song;

  // Verificamos si carga correctamente
  currentAudio.addEventListener('canplaythrough', () => {
    console.log(`✅ Audio cargado exitosamente: ${audioPath}`);
  }, { once: true });
  currentAudio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(currentAudio!.duration);
  });

  songModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function playNextSong() {
  if (!currentSongId) return;
  const currentIndex = songs.findIndex(s => s.id === currentSongId);
  const nextIndex = (currentIndex + 1) % songs.length;
  openSongModal(songs[nextIndex]);
  // Auto-play if was playing? 
  // For usability, we just play it
  if (currentAudio) currentAudio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
  }).catch(console.error);
}

function playPreviousSong() {
  if (!currentSongId) return;
  const currentIndex = songs.findIndex(s => s.id === currentSongId);
  const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
  openSongModal(songs[prevIndex]);
  if (currentAudio) currentAudio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
  }).catch(console.error);
}

function closeSongModal() {
  if (currentAudio) {
    currentAudio.pause();
    isPlaying = false;
    updatePlayButton();
  }
  songModal.classList.remove('active');
  document.body.style.overflow = '';
  if (location.hash.startsWith('#song-')) {
    history.back(); // This will trigger hashchange
  }
}

// History Handling
window.addEventListener('hashchange', () => {
  const hash = location.hash;
  if (!hash) {
    // Close everything
    songModal.classList.remove('active');
    adminDashboard.classList.add('hidden');
    authModal.classList.remove('active');
    const musiciansPanel = document.querySelector('#musicians-panel');
    const settingsPanel = document.querySelector('#settings-panel');
    if (musiciansPanel) musiciansPanel.classList.add('hidden');
    if (settingsPanel) settingsPanel.classList.add('hidden');
    document.body.style.overflow = '';
    if (currentAudio) currentAudio.pause();
  } else if (hash.startsWith('#song-')) {
    const id = hash.replace('#song-', '');
    const song = songs.find(s => s.id === id);
    if (song && !songModal.classList.contains('active')) {
      openSongModal(song);
    }
  } else if (hash === '#admin') {
    if (currentUser && currentUser.role === 'admin' && adminDashboard.classList.contains('hidden')) {
      openAdminDashboard();
    } else if (!currentUser || currentUser.role !== 'admin') {
      history.replaceState(null, '', '/');
    }
  } else if (hash === '#musicians') {
    const musiciansPanel = document.querySelector('#musicians-panel');
    if (currentUser && currentUser.role === 'admin' && musiciansPanel?.classList.contains('hidden')) {
      openMusiciansPanel();
    } else if (!currentUser || currentUser.role !== 'admin') {
      history.replaceState(null, '', '/');
    }
  } else if (hash === '#settings') {
    const settingsPanel = document.querySelector('#settings-panel');
    if (currentUser && settingsPanel?.classList.contains('hidden')) {
      openSettingsPanel();
    } else if (!currentUser) {
      toggleAuthModal(true);
      history.replaceState(null, '', '/');
    }
  } else if (hash === '#auth') {
    if (!authModal.classList.contains('active')) {
      toggleAuthModal(true);
    }
  }
});

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
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
  playPauseBtn.title = isPlaying ? 'Pausar' : 'Reproducir';
}

function updateProgress() {
  if (!currentAudio) return;
  const { duration, currentTime } = currentAudio;
  const progressPercent = (currentTime / duration) * 100;
  progressBar.style.width = `${progressPercent}%`;
  currentTimeEl.textContent = formatTime(currentTime);

  // Active lyric line highlight - with 2.5s lookahead to feel "in sync"
  if (duration > 0) {
    const lyricLines = modalLyrics.querySelectorAll<HTMLElement>('.lyric-line');
    const totalLines = lyricLines.length;
    if (totalLines > 0) {
      // Use lyricsStartAt to skip the intro — lyrics only start advancing after it ends
      const introOffset = (currentSong && currentSong.lyricsStartAt) ? currentSong.lyricsStartAt : 0;
      const lyricsDuration = Math.max(1, duration - introOffset);
      const lyricsElapsed = Math.max(0, currentTime - introOffset);
      const progress = Math.min(lyricsElapsed / lyricsDuration, 1);
      const activeIndex = Math.min(Math.floor(progress * totalLines), totalLines - 1);
      lyricLines.forEach((el, i) => {
        el.classList.toggle('lyric-active', i === activeIndex);
        el.classList.toggle('lyric-past', i < activeIndex);
      });
      // Snap-scroll the active line into center view (no smooth lag)
      const activeLine = lyricLines[activeIndex];
      if (activeLine) {
        const lineTop = activeLine.offsetTop;
        const lineH = activeLine.offsetHeight;
        const containerH = modalBody.clientHeight;
        const target = lineTop - containerH / 2 + lineH / 2;
        modalBody.scrollTop = Math.max(0, target);
      }
    }
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
    location.hash = '#auth';
  } else {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
    authMessage.textContent = '';
    authForm.reset();
    if (location.hash === '#auth') {
      history.back();
    }
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
    btnIcon.textContent = currentUser.role === 'admin' ? '🛡️' : '👤';
    if (currentUser.role === 'admin') {
      authTrigger.title = "Panel de Administración";
    } else {
      authTrigger.title = "Cerrar Sesión";
    }
  } else {
    btnText.textContent = 'Iniciar Sesión';
    btnIcon.textContent = '👤';
    authTrigger.title = "Iniciar sesión o registrarse";
  }
}

async function handleAuthSubmit(e: Event) {
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
      Logger.info('Auth', 'User logged in', { email });
      setTimeout(() => {
        toggleAuthModal(false);
        updateUserUI();
      }, 1000);
    } else {
      showMessage('Correo o contraseña incorrectos', 'error');
      Logger.warn('Auth', 'Login failed - invalid credentials', { email });
    }
  } else {
    const name = (document.querySelector('#auth-name') as HTMLInputElement).value;
    const instrument = (document.querySelector('#auth-instrument') as HTMLSelectElement).value;
    
    // Use database integration for registration
    const result = await registerUserWithDB({
      email,
      name,
      instrument,
      password,
    });

    if (result.success && result.user) {
      // Convert musician to user format for compatibility
      currentUser = {
        email: result.user.email,
        name: result.user.nombre,
        instrument: result.user.instrumento,
        password: result.user.contraseña,
        role: result.user.rol,
      };
      
      // Also save to legacy localStorage for compatibility
      users.push(currentUser);
      localStorage.setItem('worship_users', JSON.stringify(users));
      localStorage.setItem('worship_user', JSON.stringify(currentUser));
      
      showMessage('Cuenta creada con éxito', 'success');
      Logger.info('Auth', 'User registered successfully', { email });
      setTimeout(() => {
        toggleAuthModal(false);
        updateUserUI();
      }, 1000);
    } else {
      showMessage(result.message, 'error');
      Logger.warn('Auth', 'Registration failed', { email, message: result.message });
    }
  }
}

function showMessage(text: string, type: 'error' | 'success') {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

// Admin Logic
function openAdminDashboard() {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  
  // Calculate Stats
  const totalUsers = users.length;
  const instrumentCounts: Record<string, number> = {};
  
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  let onlineCount = 0;

  users.forEach(u => {
    instrumentCounts[u.instrument] = (instrumentCounts[u.instrument] || 0) + 1;
    // Check if user is online
    if (u.lastActive && (now - u.lastActive) < FIVE_MINUTES_MS) {
      onlineCount++;
    }
  });

  // Render Stats with Icons
  const statsContainer = document.querySelector('#admin-stats')!;
  statsContainer.innerHTML = `
    <div class="stat-card" style="border-color: rgba(16, 185, 129, 0.4);">
      <div class="stat-icon" style="text-shadow: 0 0 15px #10b981;">🟢</div>
      <span class="stat-value" style="color: #10b981;">${onlineCount}</span>
      <span class="stat-label">Conectados</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <span class="stat-value">${totalUsers}</span>
      <span class="stat-label">Miembros</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎤</div>
      <span class="stat-value">${instrumentCounts['Voz'] || 0}</span>
      <span class="stat-label">Voces</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎸</div>
      <span class="stat-value">${users.filter(u => u.instrument !== 'Voz').length}</span>
      <span class="stat-label">Inst.</span>
    </div>
  `;

  renderAdminUserList();

  adminDashboard.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  location.hash = '#admin';
}

function renderAdminUserList() {
  let users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  users.sort((a, b) => {
    let valA = a[adminSortConfig.key] || '';
    let valB = b[adminSortConfig.key] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return adminSortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return adminSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Render User List with staggered animation and online indicator
  userListContainer.innerHTML = users.map((user, index) => {
    const isOnline = user.lastActive && (now - user.lastActive) < FIVE_MINUTES_MS;
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusTitle = isOnline ? 'En línea ahora' : 'Desconectado';
    
    return `
    <div class="user-item" style="animation-delay: ${index * 0.05}s">
      <div class="u-info">
        <div class="status-dot ${statusClass}" title="${statusTitle}"></div>
        <span class="u-name">${user.name}</span>
      </div>
      <span class="u-email">${user.email}</span>
      <div class="u-instrument-wrapper">
        <span class="u-instrument">${user.instrument}</span>
      </div>
      <div class="u-actions">
        ${user.role !== 'admin' ? `
          <button class="u-delete-btn" onclick="deleteUser('${user.email}')" title="Eliminar miembro">🗑️</button>
        ` : '<span style="opacity: 0.3">🛡️</span>'}
      </div>
    </div>
  `}).join('');

  document.querySelectorAll('.admin-sort-btn').forEach(btn => {
    const sortKey = btn.getAttribute('data-sort');
    const iconSpan = btn.querySelector('.sort-icon') as HTMLSpanElement;
    if (iconSpan) {
      if (sortKey === adminSortConfig.key) {
        btn.classList.add('active');
        iconSpan.textContent = adminSortConfig.direction === 'asc' ? '↑' : '↓';
      } else {
        btn.classList.remove('active');
        iconSpan.textContent = '';
      }
    }
  });
}

function closeAdminDashboard() {
  adminDashboard.classList.add('hidden');
  document.body.style.overflow = ''; // Restore scrolling
  if (location.hash === '#admin') {
    history.back();
  }
}

// @ts-ignore - Exporting to global scope for the onclick handler
window.deleteUser = (email: string) => {
  if (confirm(`¿Estás seguro de eliminar a ${email}?`)) {
    let users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
    users = users.filter(u => u.email !== email);
    localStorage.setItem('worship_users', JSON.stringify(users));
    openAdminDashboard(); // Refresh
  }
};

function handleFooterDashboardClick(e: Event) {
  e.preventDefault();
  
  if (currentUser && currentUser.role === 'admin') {
    openAdminDashboard();
  } else {
    toggleAuthModal(true);
  }
}
function handleFooterAdminLoginClick(e: Event) {
  e.preventDefault();
  toggleAuthModal(true);
}

// Deprecated: This function is no longer used
// function handleFooterPlaceholderClick(e: Event, featureName: string) {
//   e.preventDefault();
//   
//   // Check if it's the Musicians Management link
//   if (featureName === 'Gestión de Músicos') {
//     openMusiciansPanel();
//     return;
//   }
//   
//   alert(`La funcionalidad de ${featureName} estará disponible próximamente`);
// }

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
  adminClose.addEventListener('click', closeAdminDashboard);
  if (adminLogout) {
    adminLogout.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        currentUser = null;
        localStorage.removeItem('worship_user');
        updateUserUI();
        closeAdminDashboard();
        showMessage('Sesión cerrada correctamente', 'success');
      }
    });
  }
  
  prevBtn.addEventListener('click', playPreviousSong);
  nextBtn.addEventListener('click', playNextSong);

  window.addEventListener('click', (e) => {
    if (e.target === songModal) closeSongModal();
    if (e.target === adminDashboard) closeAdminDashboard();
    if (e.target === authModal) {
      toggleAuthModal(false); // Use toggleAuthModal to handle hash
    }
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

  document.querySelectorAll('.admin-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sortKey = btn.getAttribute('data-sort') as 'name' | 'email' | 'instrument';
      if (!sortKey) return;

      if (adminSortConfig.key === sortKey) {
        // Toggle direction
        adminSortConfig.direction = adminSortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // New sort key, default to asc
        adminSortConfig.key = sortKey;
        adminSortConfig.direction = 'asc';
      }
      renderAdminUserList();
    });
  });

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

  // Footer links event listeners
  const footerDashboardLink = document.querySelector('#footer-dashboard-link');
  const footerManageLink = document.querySelector('#footer-manage-link');
  const footerConfigLink = document.querySelector('#footer-config-link');
  const adminTriggerLogin = document.querySelector('#admin-trigger-login');

  if (footerDashboardLink) {
    footerDashboardLink.addEventListener('click', handleFooterDashboardClick);
  } else {
    console.warn('Footer dashboard link element not found');
  }

  if (adminTriggerLogin) {
    adminTriggerLogin.addEventListener('click', handleFooterAdminLoginClick);
  } else {
    console.warn('Admin trigger login element not found');
  }

  if (footerManageLink) {
    footerManageLink.addEventListener('click', (e) => {
      e.preventDefault();
      openMusiciansPanel();
    });
  } else {
    console.warn('Footer manage link element not found');
  }

  if (footerConfigLink) {
    footerConfigLink.addEventListener('click', (e) => {
      e.preventDefault();
      openSettingsPanel();
    });
  } else {
    console.warn('Footer config link element not found');
  }
  
  // Settings Panel Event Listeners
  const settingsCloseBtn = document.querySelector<HTMLButtonElement>('.settings-close-btn');
  const settingsOverlay = document.querySelector<HTMLDivElement>('.settings-overlay');
  const settingsSaveBtn = document.querySelector<HTMLButtonElement>('#settings-save-btn');
  const volumeSlider = document.querySelector<HTMLInputElement>('#volume-slider');
  const microphoneSelect = document.querySelector<HTMLSelectElement>('#microphone-select');
  const speakerSelect = document.querySelector<HTMLSelectElement>('#speaker-select');
  const testMicrophoneBtn = document.querySelector<HTMLButtonElement>('#test-microphone-btn');
  const testSpeakerBtn = document.querySelector<HTMLButtonElement>('#test-speaker-btn');

  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', closeSettingsPanel);
  }

  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', closeSettingsPanel);
  }

  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', closeSettingsPanel);
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', handleVolumeChange);
  }

  if (microphoneSelect) {
    microphoneSelect.addEventListener('change', (e) => handleDeviceSelection(e, 'microphone'));
  }

  if (speakerSelect) {
    speakerSelect.addEventListener('change', (e) => handleDeviceSelection(e, 'speaker'));
  }

  if (testMicrophoneBtn) {
    testMicrophoneBtn.addEventListener('click', () => testAudioDevice('microphone'));
  }

  if (testSpeakerBtn) {
    testSpeakerBtn.addEventListener('click', () => testAudioDevice('speaker'));
  }
  
  // Admin Musicians Button
  const adminMusiciansBtn = document.querySelector('#admin-musicians-btn');
  if (adminMusiciansBtn) {
    adminMusiciansBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Close admin dashboard first
      const adminDashboard = document.querySelector('#admin-dashboard');
      if (adminDashboard) {
        adminDashboard.classList.add('hidden');
      }
      // Open musicians panel
      openMusiciansPanel();
    });
  }
  
  // Musicians Panel Event Listeners
  const musiciansClose = document.querySelector('#musicians-close');
  const musiciansAddBtn = document.querySelector('#musicians-add-btn');
  const musiciansSearch = document.querySelector('#musicians-search');
  const musicianFormModal = document.querySelector('#musician-form-modal');
  const musicianForm = document.querySelector('#musician-form');
  const musicianFormClose = document.querySelector('#musician-form-close');
  const musicianFormCancel = document.querySelector('#musician-form-cancel');
  
  if (musiciansClose) {
    musiciansClose.addEventListener('click', closeMusiciansPanel);
  }
  
  if (musiciansAddBtn) {
    musiciansAddBtn.addEventListener('click', () => openMusicianForm('create'));
  }
  
  if (musiciansSearch) {
    musiciansSearch.addEventListener('input', handleMusicianSearch);
  }
  
  // Filter buttons
  document.querySelectorAll('.musician-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const instrument = btn.getAttribute('data-instrument') || 'all';
      handleInstrumentFilter(instrument);
    });
  });
  
  // Form modal events
  if (musicianForm) {
    musicianForm.addEventListener('submit', handleMusicianFormSubmit);
  }
  
  if (musicianFormClose) {
    musicianFormClose.addEventListener('click', closeMusicianForm);
  }
  
  if (musicianFormCancel) {
    musicianFormCancel.addEventListener('click', closeMusicianForm);
  }
  
  // Close modal on background click
  if (musicianFormModal) {
    musicianFormModal.addEventListener('click', (e) => {
      if (e.target === musicianFormModal) {
        closeMusicianForm();
      }
    });
  }
  
  // Delegate events for edit/delete buttons (dynamic content)
  const musiciansList = document.querySelector('#musicians-list');
  if (musiciansList) {
    musiciansList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle edit button
      if (target.classList.contains('u-edit-btn') || target.closest('.u-edit-btn')) {
        const btn = target.classList.contains('u-edit-btn') ? target : target.closest('.u-edit-btn');
        const email = btn?.getAttribute('data-email');
        if (email) openMusicianForm('edit', email);
      }
      
      // Handle delete button
      if (target.classList.contains('u-delete-btn') || target.closest('.u-delete-btn')) {
        const btn = target.classList.contains('u-delete-btn') ? target : target.closest('.u-delete-btn');
        const email = btn?.getAttribute('data-email');
        if (email) handleDeleteMusician(email);
      }
    });
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
      const settingsPanel = document.querySelector('#settings-panel');
      const musiciansPanel = document.querySelector('#musicians-panel');
      const musicianFormModal = document.querySelector('#musician-form-modal');
      
      if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
        closeSettingsPanel();
      } else if (musicianFormModal?.classList.contains('active')) {
        closeMusicianForm();
      } else if (musiciansPanel && !musiciansPanel.classList.contains('hidden')) {
        closeMusiciansPanel();
      }
    }
  });
}

// =====================
// SETTINGS PANEL FUNCTIONS
// =====================

// Default settings
const DEFAULT_SETTINGS: SettingsConfig = {
  volume: 50,
  microphoneId: 'default',
  speakerId: 'default'
};

// Load settings from localStorage
function loadSettings(): SettingsConfig {
  try {
    const saved = localStorage.getItem('worship_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        volume: parsed.volume ?? DEFAULT_SETTINGS.volume,
        microphoneId: parsed.microphoneId ?? DEFAULT_SETTINGS.microphoneId,
        speakerId: parsed.speakerId ?? DEFAULT_SETTINGS.speakerId
      };
    }
  } catch (error) {
    console.warn('Invalid settings JSON in localStorage:', error);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(): void {
  try {
    const volumeSlider = document.querySelector<HTMLInputElement>('#volume-slider');
    const microphoneSelect = document.querySelector<HTMLSelectElement>('#microphone-select');
    const speakerSelect = document.querySelector<HTMLSelectElement>('#speaker-select');

    const settings: SettingsConfig = {
      volume: volumeSlider ? parseInt(volumeSlider.value) : DEFAULT_SETTINGS.volume,
      microphoneId: microphoneSelect ? microphoneSelect.value : DEFAULT_SETTINGS.microphoneId,
      speakerId: speakerSelect ? speakerSelect.value : DEFAULT_SETTINGS.speakerId
    };

    localStorage.setItem('worship_settings', JSON.stringify(settings));
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
      } else if (error.name === 'SecurityError') {
        console.warn('localStorage not available in private mode');
      }
    }
  }
}

// Detect audio devices
async function detectAudioDevices(): Promise<AudioDevices> {
  const result: AudioDevices = {
    microphones: [],
    speakers: []
  };

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    devices.forEach(device => {
      if (device.kind === 'audioinput') {
        result.microphones.push(device);
      } else if (device.kind === 'audiooutput') {
        result.speakers.push(device);
      }
    });
  } catch (error) {
    console.error('Error enumerating devices:', error);
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        console.warn('Audio permissions not granted');
      }
    }
  }

  return result;
}

// Populate device selectors
async function populateDeviceSelectors(): Promise<void> {
  const devices = await detectAudioDevices();
  const microphoneSelect = document.querySelector<HTMLSelectElement>('#microphone-select');
  const speakerSelect = document.querySelector<HTMLSelectElement>('#speaker-select');

  if (microphoneSelect) {
    // Clear existing options except default
    microphoneSelect.innerHTML = '<option value="default">Dispositivo por defecto</option>';
    
    if (devices.microphones.length === 0) {
      const option = document.createElement('option');
      option.value = 'none';
      option.textContent = 'No hay dispositivos disponibles';
      option.disabled = true;
      microphoneSelect.appendChild(option);
    } else {
      devices.microphones.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Micrófono ${device.deviceId.substring(0, 5)}`;
        microphoneSelect.appendChild(option);
      });
    }
  }

  if (speakerSelect) {
    // Clear existing options except default
    speakerSelect.innerHTML = '<option value="default">Dispositivo por defecto</option>';
    
    if (devices.speakers.length === 0) {
      const option = document.createElement('option');
      option.value = 'none';
      option.textContent = 'No hay dispositivos disponibles';
      option.disabled = true;
      speakerSelect.appendChild(option);
    } else {
      devices.speakers.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Altavoz ${device.deviceId.substring(0, 5)}`;
        speakerSelect.appendChild(option);
      });
    }
  }
}

// Handle volume change
function handleVolumeChange(event: Event): void {
  const slider = event.target as HTMLInputElement;
  const value = parseInt(slider.value);
  const volumeValue = document.querySelector<HTMLSpanElement>('#volume-value');
  
  if (volumeValue) {
    volumeValue.textContent = `${value}%`;
  }
  
  // Save immediately
  saveSettings();
}

// Handle device selection
function handleDeviceSelection(_event: Event, _deviceType: 'microphone' | 'speaker'): void {
  // Save immediately
  saveSettings();
}

// Test audio device
async function testAudioDevice(deviceType: 'microphone' | 'speaker'): Promise<void> {
  const messageElement = deviceType === 'microphone' 
    ? document.querySelector<HTMLDivElement>('#microphone-message')
    : document.querySelector<HTMLDivElement>('#speaker-message');

  if (!messageElement) return;

  try {
    messageElement.textContent = 'Reproduciendo sonido de prueba...';
    messageElement.classList.remove('error', 'success');

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for test tone (440 Hz)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';
    
    // Set volume to 30% to avoid loud noise
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    // Wait for sound to finish
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    messageElement.textContent = '✓ Sonido de prueba reproducido correctamente';
    messageElement.classList.add('success');
  } catch (error) {
    console.error('Error testing audio device:', error);
    messageElement.textContent = '✗ Error al reproducir sonido de prueba';
    messageElement.classList.add('error');
  }
}

// Open Settings Panel
async function openSettingsPanel(): Promise<void> {
  if (!currentUser) {
    toggleAuthModal(true);
    return;
  }

  const settingsPanel = document.querySelector<HTMLDivElement>('#settings-panel');
  if (!settingsPanel) return;

  // Load settings
  const settings = loadSettings();
  
  // Update controls with loaded settings
  const volumeSlider = document.querySelector<HTMLInputElement>('#volume-slider');
  const volumeValue = document.querySelector<HTMLSpanElement>('#volume-value');
  const microphoneSelect = document.querySelector<HTMLSelectElement>('#microphone-select');
  const speakerSelect = document.querySelector<HTMLSelectElement>('#speaker-select');

  if (volumeSlider) {
    volumeSlider.value = settings.volume.toString();
  }
  if (volumeValue) {
    volumeValue.textContent = `${settings.volume}%`;
  }
  if (microphoneSelect) {
    microphoneSelect.value = settings.microphoneId;
  }
  if (speakerSelect) {
    speakerSelect.value = settings.speakerId;
  }

  // Detect and populate devices
  await populateDeviceSelectors();

  // Show panel
  settingsPanel.classList.remove('hidden');
  settingsPanel.classList.add('visible');
  document.body.style.overflow = 'hidden';
  location.hash = '#settings';
}

// Close Settings Panel
function closeSettingsPanel(): void {
  const settingsPanel = document.querySelector<HTMLDivElement>('#settings-panel');
  if (!settingsPanel) return;

  // Save settings
  saveSettings();

  // Hide panel
  settingsPanel.classList.add('hidden');
  settingsPanel.classList.remove('visible');
  document.body.style.overflow = '';
  
  // Restore previous hash
  if (location.hash === '#settings') {
    location.hash = '';
  }
}

// =====================
// MUSICIANS MANAGEMENT FUNCTIONS
// =====================

// Render Musicians Statistics
function renderMusicianStats() {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const musicians = users.filter(u => u.role === 'user');
  
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  
  const totalMusicians = musicians.length;
  let onlineCount = 0;
  const instrumentCounts: Record<string, number> = {};
  
  musicians.forEach(m => {
    // Count online musicians
    if (m.lastActive && (now - m.lastActive) < FIVE_MINUTES_MS) {
      onlineCount++;
    }
    
    // Count by instrument
    instrumentCounts[m.instrument] = (instrumentCounts[m.instrument] || 0) + 1;
  });
  
  const voicesCount = instrumentCounts['Voz'] || 0;
  const instrumentsCount = totalMusicians - voicesCount;
  
  const statsContainer = document.querySelector('#musicians-stats')!;
  statsContainer.innerHTML = `
    <div class="stat-card" style="border-color: rgba(16, 185, 129, 0.4);">
      <div class="stat-icon" style="text-shadow: 0 0 15px #10b981;">🟢</div>
      <span class="stat-value" style="color: #10b981;">${onlineCount}</span>
      <span class="stat-label">Conectados</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <span class="stat-value">${totalMusicians}</span>
      <span class="stat-label">Total Músicos</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎤</div>
      <span class="stat-value">${voicesCount}</span>
      <span class="stat-label">Voces</span>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎸</div>
      <span class="stat-value">${instrumentsCount}</span>
      <span class="stat-label">Instrumentos</span>
    </div>
  `;
}

// Get Filtered Musicians
function getFilteredMusicians(): User[] {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  let musicians = users.filter(u => u.role === 'user');
  
  // Apply search filter
  if (musicianSearchQuery.trim()) {
    const query = musicianSearchQuery.toLowerCase();
    musicians = musicians.filter(m => 
      m.name.toLowerCase().includes(query)
    );
  }
  
  // Apply instrument filter
  if (musicianInstrumentFilter !== 'all') {
    musicians = musicians.filter(m => m.instrument === musicianInstrumentFilter);
  }
  
  return musicians;
}

// Render Musicians List
async function renderMusiciansList() {
  const musicians = getFilteredMusicians();
  
  // Sort alphabetically by name
  musicians.sort((a, b) => a.name.localeCompare(b.name));
  
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  
  const listContainer = document.querySelector('#musicians-list')!;
  
  if (musicians.length === 0) {
    listContainer.innerHTML = `
      <div class="musicians-empty">
        <div class="musicians-empty-icon">🎵</div>
        <div class="musicians-empty-text">No se encontraron músicos</div>
        <div class="musicians-empty-subtext">Intenta ajustar los filtros de búsqueda</div>
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = musicians.map((musician, index) => {
    const isOnline = musician.lastActive && (now - musician.lastActive) < FIVE_MINUTES_MS;
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusTitle = isOnline ? 'En línea ahora' : 'Desconectado';
    
    return `
      <div class="musician-item" role="listitem" style="animation-delay: ${index * 0.05}s">
        <div class="u-info">
          <div class="status-dot ${statusClass}" title="${statusTitle}" aria-label="${statusTitle}"></div>
          <span class="u-name">${musician.name}</span>
        </div>
        <span class="u-email">${musician.email}</span>
        <div class="u-instrument-wrapper">
          <span class="u-instrument" data-instrument="${musician.instrument}">${musician.instrument}</span>
        </div>
        <div class="u-actions">
          <button class="u-edit-btn" data-email="${musician.email}" title="Editar músico" aria-label="Editar ${musician.name}">✏️</button>
          <button class="u-delete-btn" data-email="${musician.email}" title="Eliminar músico" aria-label="Eliminar ${musician.name}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Handle Musician Search
function handleMusicianSearch(e: Event) {
  const input = e.target as HTMLInputElement;
  musicianSearchQuery = input.value;
  renderMusiciansList();
}

// Handle Instrument Filter
function handleInstrumentFilter(instrument: string) {
  musicianInstrumentFilter = instrument;
  
  // Update active button and aria-pressed
  document.querySelectorAll('.musician-filter-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-instrument') === instrument;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  
  renderMusiciansList();
}

// Create Musician
async function createMusician(data: { name: string; email: string; instrument: string; password: string }): Promise<{ success: boolean; message: string }> {
  // Use database integration
  const result = await createMusicianWithDB(data);
  
  if (result.success && result.musician) {
    // Also save to legacy localStorage for compatibility
    const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
    const newUser: User = {
      email: result.musician.email,
      name: result.musician.nombre,
      instrument: result.musician.instrumento,
      password: result.musician.contraseña,
      role: result.musician.rol,
    };
    users.push(newUser);
    localStorage.setItem('worship_users', JSON.stringify(users));
  }
  
  return {
    success: result.success,
    message: result.message,
  };
}

// Update Musician
async function updateMusician(email: string, data: { name: string; email: string; instrument: string }): Promise<{ success: boolean; message: string }> {
  // Use database integration
  const result = await updateMusicianWithDB(email, data);
  
  if (result.success && result.musician) {
    // Also update legacy localStorage for compatibility
    const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        name: result.musician.nombre,
        email: result.musician.email,
        instrument: result.musician.instrumento,
      };
      localStorage.setItem('worship_users', JSON.stringify(users));
    }
  }
  
  return {
    success: result.success,
    message: result.message,
  };
}

// Delete Musician
async function deleteMusicianByEmail(email: string): Promise<{ success: boolean; message: string }> {
  // Use database integration
  const result = await deleteMusicianWithDB(email);
  
  if (result.success) {
    // Also delete from legacy localStorage for compatibility
    const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
    const updatedUsers = users.filter(u => u.email !== email);
    localStorage.setItem('worship_users', JSON.stringify(updatedUsers));
  }
  
  return {
    success: result.success,
    message: result.message,
  };
}

// Open Musician Form
function openMusicianForm(mode: 'create' | 'edit', email?: string) {
  musicianFormMode = mode;
  
  const modal = document.querySelector('#musician-form-modal')!;
  const form = document.querySelector('#musician-form') as HTMLFormElement;
  const title = document.querySelector('#musician-form-title')!;
  const passwordGroup = document.querySelector('#musician-password-group') as HTMLDivElement;
  const passwordInput = document.querySelector('#musician-password-input') as HTMLInputElement;
  
  // Reset form
  form.reset();
  showMusicianFormMessage('', 'success');
  
  if (mode === 'create') {
    title.textContent = 'Agregar Músico';
    passwordGroup.style.display = 'block';
    passwordInput.required = true;
    currentEditingMusician = null;
  } else {
    title.textContent = 'Editar Músico';
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
    
    // Load musician data
    if (email) {
      const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
      const musician = users.find(u => u.email === email);
      
      if (musician) {
        currentEditingMusician = musician;
        (document.querySelector('#musician-name-input') as HTMLInputElement).value = musician.name;
        (document.querySelector('#musician-email-input') as HTMLInputElement).value = musician.email;
        (document.querySelector('#musician-instrument-select') as HTMLSelectElement).value = musician.instrument;
      }
    }
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close Musician Form
function closeMusicianForm() {
  const modal = document.querySelector('#musician-form-modal')!;
  const form = document.querySelector('#musician-form') as HTMLFormElement;
  
  modal.classList.remove('active');
  document.body.style.overflow = '';
  form.reset();
  currentEditingMusician = null;
  showMusicianFormMessage('', 'success');
}

// Handle Musician Form Submit
async function handleMusicianFormSubmit(e: Event) {
  e.preventDefault();
  
  const nameInput = document.querySelector('#musician-name-input') as HTMLInputElement;
  const emailInput = document.querySelector('#musician-email-input') as HTMLInputElement;
  const instrumentSelect = document.querySelector('#musician-instrument-select') as HTMLSelectElement;
  const passwordInput = document.querySelector('#musician-password-input') as HTMLInputElement;
  
  const data = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    instrument: instrumentSelect.value,
    password: passwordInput.value
  };
  
  let result: { success: boolean; message: string };
  
  if (musicianFormMode === 'create') {
    result = await createMusician(data);
  } else {
    const originalEmail = currentEditingMusician?.email || '';
    result = await updateMusician(originalEmail, data);
  }
  
  if (result.success) {
    showMusicianFormMessage(result.message, 'success');
    setTimeout(() => {
      closeMusicianForm();
      renderMusicianStats();
      renderMusiciansList();
    }, 1000);
  } else {
    showMusicianFormMessage(result.message, 'error');
  }
}

// Show Musician Form Message
function showMusicianFormMessage(text: string, type: 'error' | 'success') {
  const message = document.querySelector('#musician-form-message')!;
  message.textContent = text;
  message.className = `auth-message ${type}`;
  
  if (text) {
    setTimeout(() => {
      message.textContent = '';
      message.className = 'auth-message';
    }, 3000);
  }
}

// Handle Delete Musician
async function handleDeleteMusician(email: string) {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const musician = users.find(u => u.email === email);
  
  if (!musician) return;
  
  if (confirm(`¿Estás seguro de eliminar a ${musician.name}?`)) {
    const result = await deleteMusicianByEmail(email);
    
    if (result.success) {
      renderMusicianStats();
      renderMusiciansList();
      // Show success message briefly
      const tempMessage = document.createElement('div');
      tempMessage.textContent = result.message;
      tempMessage.style.cssText = 'position: fixed; top: 2rem; right: 2rem; background: #10b981; color: white; padding: 1rem 2rem; border-radius: 12px; z-index: 9999; animation: premium-entry 0.5s ease;';
      document.body.appendChild(tempMessage);
      setTimeout(() => tempMessage.remove(), 2000);
    }
  }
}

// Open Musicians Panel
function openMusiciansPanel() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Debes iniciar sesión como administrador para acceder a la gestión de músicos.');
    return;
  }
  
  // Reset filters
  musicianSearchQuery = '';
  musicianInstrumentFilter = 'all';
  
  // Reset search input
  const searchInput = document.querySelector('#musicians-search') as HTMLInputElement;
  if (searchInput) searchInput.value = '';
  
  // Reset filter buttons
  document.querySelectorAll('.musician-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-instrument') === 'all');
  });
  
  // Render content
  renderMusicianStats();
  renderMusiciansList();
  
  // Show panel
  const panel = document.querySelector('#musicians-panel')!;
  panel.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  location.hash = '#musicians';
}

// Close Musicians Panel
function closeMusiciansPanel() {
  const panel = document.querySelector('#musicians-panel')!;
  panel.classList.add('hidden');
  document.body.style.overflow = '';
  
  // Reset filters
  musicianSearchQuery = '';
  musicianInstrumentFilter = 'all';
  
  if (location.hash === '#musicians') {
    history.back();
  }
}

/**
 * Inicializa el widget del chatbot
 * - Crea el contenedor del chatbot
 * - Renderiza el componente ChatbotWidget
 * - Configura la detección de cambios de página
 * - Detecta el rol del usuario actual
 * 
 * Requisitos: 4.1, 4.2, 4.3, 4.4
 */
function initializeChatbot() {
  try {
    // Crear contenedor para el chatbot si no existe
    let chatbotContainer = document.querySelector('#chatbot-container');
    if (!chatbotContainer) {
      chatbotContainer = document.createElement('div');
      chatbotContainer.id = 'chatbot-container';
      document.body.appendChild(chatbotContainer);
    }

    // Inicializar el ContextManager para detectar el rol del usuario
    const contextManager = new ContextManager();
    const userRole = contextManager.getUserRole();
    
    // Actualizar el store con el rol del usuario
    const store = useChatbotStore.getState();
    store.setUserRole(userRole);
    
    // Inicializar la detección de cambios de página
    // El hook usePageContext se ejecutará cuando se monte el componente
    // Por ahora, detectamos la página inicial
    const initialPage = getPageFromHash();
    store.updatePageContext(initialPage);
    
    // Renderizar el ChatbotWidget
    // Nota: ChatbotWidget es un componente React, pero como estamos en vanilla JS,
    // lo renderizamos directamente en el contenedor
    const widget = document.createElement('div');
    widget.id = 'chatbot-widget-root';
    chatbotContainer.appendChild(widget);
    
    // Importar React y ReactDOM para renderizar el componente
    // Esto se hace dinámicamente para evitar dependencias circulares
    import('react').then((React) => {
      import('react-dom/client').then((ReactDOM) => {
        const root = ReactDOM.createRoot(widget);
        root.render(React.createElement(ChatbotWidget));
        
        // Iniciar la detección de cambios de página
        usePageContext();
        
        Logger.info('Chatbot', 'Widget initialized and rendered successfully');
      });
    }).catch((error) => {
      console.warn('Failed to initialize React-based ChatbotWidget:', error);
      Logger.warn('Chatbot', 'React initialization failed, chatbot may not be available');
    });
  } catch (error) {
    console.error('Error initializing chatbot:', error);
    Logger.error('Chatbot', 'Failed to initialize chatbot widget', error);
  }
}

/**
 * Obtiene el nombre de la página basado en el hash actual
 * (Duplicado de usePageContext para uso en vanilla JS)
 */
function getPageFromHash(): string {
  const ROUTE_PAGE_MAP: Record<string, string> = {
    '/': 'home',
    '/musicians': 'musicians-page',
    '/audio': 'audio-settings',
    '/services': 'worship-services',
    '/admin': 'admin-panel',
    '/database': 'database-page',
    '/settings': 'settings-page',
    '/profile': 'profile-page',
  };

  const hash = window.location.hash.replace('#', '') || '/';
  
  if (ROUTE_PAGE_MAP[hash]) {
    return ROUTE_PAGE_MAP[hash];
  }

  for (const [route, page] of Object.entries(ROUTE_PAGE_MAP)) {
    if (hash.startsWith(route) && route !== '/') {
      return page;
    }
  }

  return 'home';
}

init();
