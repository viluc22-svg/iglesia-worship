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
  lastActive?: number; // timestamp in ms
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

// Constants
const INSTRUMENTS = ['Guitarra', 'Piano', 'Bajo', 'Batería', 'Voz', 'Director'] as const;

// Initialization
function init() {
  updateUserUI();
  setupPresenceTracking();
  renderSongs();
// ... (rest of init)
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
    if (musiciansPanel) musiciansPanel.classList.add('hidden');
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

function handleFooterPlaceholderClick(e: Event, featureName: string) {
  e.preventDefault();
  
  // Check if it's the Musicians Management link
  if (featureName === 'Gestión de Músicos') {
    openMusiciansPanel();
    return;
  }
  
  alert(`La funcionalidad de ${featureName} estará disponible próximamente`);
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
    footerConfigLink.addEventListener('click', (e) => handleFooterPlaceholderClick(e, 'Configuración'));
  } else {
    console.warn('Footer config link element not found');
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
      const musiciansPanel = document.querySelector('#musicians-panel');
      const musicianFormModal = document.querySelector('#musician-form-modal');
      
      if (musicianFormModal?.classList.contains('active')) {
        closeMusicianForm();
      } else if (musiciansPanel && !musiciansPanel.classList.contains('hidden')) {
        closeMusiciansPanel();
      }
    }
  });
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
function renderMusiciansList() {
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

// Validate Musician Form Data
function validateMusicianForm(data: { name: string; email: string; instrument: string; password?: string }): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('El correo electrónico no es válido');
  }
  
  // Validate instrument
  if (!data.instrument || !INSTRUMENTS.includes(data.instrument as any)) {
    errors.push('Debe seleccionar un instrumento válido');
  }
  
  // Validate password (only for create mode)
  if (musicianFormMode === 'create') {
    if (!data.password || data.password.length < 4) {
      errors.push('La contraseña debe tener al menos 4 caracteres');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Check if Email is Unique
function isEmailUnique(email: string, excludeEmail?: string): boolean {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  return !users.some(u => u.email === email && u.email !== excludeEmail);
}

// Create Musician
function createMusician(data: { name: string; email: string; instrument: string; password: string }): { success: boolean; message: string } {
  // Validate data
  const validation = validateMusicianForm(data);
  if (!validation.isValid) {
    return { success: false, message: validation.errors.join('. ') };
  }
  
  // Check email uniqueness
  if (!isEmailUnique(data.email)) {
    return { success: false, message: 'Este correo ya está registrado' };
  }
  
  // Create new musician
  const newMusician: User = {
    email: data.email,
    name: data.name,
    instrument: data.instrument,
    password: data.password,
    role: 'user'
  };
  
  // Save to localStorage
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  users.push(newMusician);
  localStorage.setItem('worship_users', JSON.stringify(users));
  
  return { success: true, message: 'Músico creado exitosamente' };
}

// Update Musician
function updateMusician(email: string, data: { name: string; email: string; instrument: string }): { success: boolean; message: string } {
  // Validate data
  const validation = validateMusicianForm(data);
  if (!validation.isValid) {
    return { success: false, message: validation.errors.join('. ') };
  }
  
  // Check email uniqueness (excluding current musician)
  if (!isEmailUnique(data.email, email)) {
    return { success: false, message: 'Este correo ya está en uso por otro músico' };
  }
  
  // Update musician
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex === -1) {
    return { success: false, message: 'Músico no encontrado' };
  }
  
  // Preserve role and password
  users[userIndex] = {
    ...users[userIndex],
    name: data.name,
    email: data.email,
    instrument: data.instrument
  };
  
  localStorage.setItem('worship_users', JSON.stringify(users));
  
  return { success: true, message: 'Músico actualizado exitosamente' };
}

// Delete Musician
function deleteMusicianByEmail(email: string): { success: boolean; message: string } {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const user = users.find(u => u.email === email);
  
  // Prevent deleting admins
  if (user && user.role === 'admin') {
    return { success: false, message: 'No se puede eliminar un administrador' };
  }
  
  // Filter out the musician
  const updatedUsers = users.filter(u => u.email !== email);
  localStorage.setItem('worship_users', JSON.stringify(updatedUsers));
  
  return { success: true, message: 'Músico eliminado exitosamente' };
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
function handleMusicianFormSubmit(e: Event) {
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
    result = createMusician(data);
  } else {
    const originalEmail = currentEditingMusician?.email || '';
    result = updateMusician(originalEmail, data);
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
function handleDeleteMusician(email: string) {
  const users: User[] = JSON.parse(localStorage.getItem('worship_users') || '[]');
  const musician = users.find(u => u.email === email);
  
  if (!musician) return;
  
  if (confirm(`¿Estás seguro de eliminar a ${musician.name}?`)) {
    const result = deleteMusicianByEmail(email);
    
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

init();
