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
const userListContainer = document.querySelector<HTMLDivElement>('#user-list')!;

// State
let currentFilter = 'all';
let searchQuery = '';
let authMode: 'login' | 'register' = 'login';
let currentUser: User | null = JSON.parse(localStorage.getItem('worship_user') || 'null');
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;
let currentSongId: string | null = null;

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
    authModal.classList.remove('active'); // Changed from hidden to remove('active')
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
      history.replaceState(null, '', '/'); // Clear hash if not authorized
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
  users.forEach(u => {
    instrumentCounts[u.instrument] = (instrumentCounts[u.instrument] || 0) + 1;
  });

  // Render Stats with Icons
  const statsContainer = document.querySelector('#admin-stats')!;
  statsContainer.innerHTML = `
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

  // Render User List with staggered animation
  userListContainer.innerHTML = users.map((user, index) => `
    <div class="user-item" style="animation-delay: ${index * 0.1}s">
      <div class="u-info">
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
  `).join('');

  adminDashboard.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  location.hash = '#admin';
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
