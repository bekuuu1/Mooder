/**
 * Mooder - Shared Core Services, Data Loaders & Navigation Utilities
 */

const MooderShared = {
  data: {
    stats: null,
    benchmarks: null,
    catalog: null
  },

  PITCH_CLASSES: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"],

  async loadStats() {
    if (!this.data.stats) {
      const res = await fetch('data/dataset_stats.json');
      this.data.stats = await res.json();
    }
    return this.data.stats;
  },

  async loadBenchmarks() {
    if (!this.data.benchmarks) {
      const res = await fetch('data/genre_benchmarks.json');
      this.data.benchmarks = await res.json();
    }
    return this.data.benchmarks;
  },

  async loadCatalog() {
    if (!this.data.catalog) {
      const res = await fetch('data/mood_catalog.json');
      this.data.catalog = await res.json();
    }
    return this.data.catalog;
  },

  async initGlobalData() {
    try {
      await Promise.all([
        this.loadStats(),
        this.loadBenchmarks(),
        this.loadCatalog()
      ]);
      this.setupCommandPalette();
    } catch (e) {
      console.error('Error loading Mooder datasets:', e);
    }
  },

  formatDuration(ms) {
    if (!ms) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  getKeyName(key, mode) {
    if (key === undefined || key < 0) return 'C Maj';
    const pitch = this.PITCH_CLASSES[key % 12] || 'C';
    const isMajor = mode === 1;
    return `${pitch} ${isMajor ? 'Maj' : 'Min'}`;
  },

  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  },

  // Track Artwork fallback generator (aesthetic gradient art)
  getTrackArtwork(track) {
    // Generate beautiful consistent CSS gradient based on track attributes
    const hue1 = Math.round((track.val || 0.5) * 320);
    const hue2 = Math.round((track.eng || 0.5) * 200 + 120);
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 35%) 0%, hsl(${hue2}, 85%, 20%) 100%)`;
  },

  // Inspected Track persistence
  getInspectedTrack() {
    try {
      const saved = localStorage.getItem('mooder_inspect_track');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default track: Midnight City or first top track
    return {
      id: "trk-midnight-city",
      title: "Midnight City",
      artist: "M83",
      album: "Hurry Up, We're Dreaming",
      genre: "synthpop",
      pop: 89,
      dur: 243000,
      exp: false,
      dnc: 0.70,
      eng: 0.86,
      key: 11, // B
      mode: 1, // Major
      loud: -5.2,
      spc: 0.05,
      aco: 0.04,
      ins: 0.12,
      liv: 0.18,
      val: 0.71,
      tmp: 105.0,
      sig: 4
    };
  },

  setInspectedTrack(track) {
    try {
      localStorage.setItem('mooder_inspect_track', JSON.stringify(track));
    } catch (e) {}
  },

  inspectTrackAndNavigate(track) {
    this.setInspectedTrack(track);
    window.location.href = 'music-dna.html';
  },

  // Saved Playlist persistence
  getSavedPlaylist() {
    try {
      const saved = localStorage.getItem('mooder_playlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  },

  savePlaylist(tracks) {
    try {
      localStorage.setItem('mooder_playlist', JSON.stringify(tracks));
    } catch (e) {}
  },

  addToPlaylist(track) {
    const list = this.getSavedPlaylist();
    if (!list.some(t => t.id === track.id)) {
      list.push(track);
      this.savePlaylist(list);
      this.showToast(`Added "${track.title}" to Mood Playlist`, 'playlist_add_check');
      return true;
    } else {
      this.showToast(`"${track.title}" is already in playlist`, 'info');
      return false;
    }
  },

  removeFromPlaylist(trackId) {
    const list = this.getSavedPlaylist().filter(t => t.id !== trackId);
    this.savePlaylist(list);
    this.showToast('Removed track from playlist', 'delete');
    return list;
  },

  // Toast Notification
  showToast(message, icon = 'check_circle') {
    let toast = document.getElementById('mooder-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mooder-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <span class="material-symbols-outlined text-primary text-metric-md" style="font-variation-settings: 'FILL' 1;">${icon}</span>
      <span class="font-body-md text-on-surface font-medium">${message}</span>
    `;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },

  // Global Command Palette & Search
  setupCommandPalette() {
    // Inject modal if not present
    if (!document.getElementById('cmd-palette-backdrop')) {
      const modal = document.createElement('div');
      modal.id = 'cmd-palette-backdrop';
      modal.className = 'fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-md z-50 items-center justify-center p-4';
      modal.innerHTML = `
        <div class="relative w-full max-w-2xl bg-surface-container rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div class="flex items-center px-4 py-3 border-b border-surface-container-high gap-3">
            <span class="material-symbols-outlined text-primary">search</span>
            <input id="cmd-palette-input" type="text" placeholder="Search 114k tracks, artists, or genres..." 
              class="w-full bg-transparent text-on-surface placeholder:text-outline font-body-lg focus:outline-none" />
            <span class="text-outline text-label-code bg-surface-container-high px-2 py-0.5 rounded">ESC</span>
          </div>
          <div id="cmd-palette-results" class="flex-1 overflow-y-auto p-2 flex flex-col gap-1 divide-y divide-surface-container-high/40">
            <div class="p-6 text-center text-outline text-body-sm">Type to search the Spotify 114k audio library...</div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const input = document.getElementById('cmd-palette-input');
      const resultsContainer = document.getElementById('cmd-palette-results');

      // Key listeners
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        } else if (e.key === 'Escape') {
          this.closeCommandPalette();
        }
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeCommandPalette();
      });

      // Hook up top search inputs if on page
      document.querySelectorAll('input[placeholder*="Search"]').forEach(inp => {
        if (inp.id !== 'cmd-palette-input' && inp.id !== 'dna-search') {
          inp.addEventListener('focus', () => this.openCommandPalette());
        }
      });

      input.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          resultsContainer.innerHTML = `<div class="p-6 text-center text-outline text-body-sm">Type to search the Spotify 114k audio library...</div>`;
          return;
        }
        if (!this.data.catalog) return;

        const matches = this.data.catalog.filter(t => 
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.genre.toLowerCase().includes(query)
        ).slice(0, 15);

        if (matches.length === 0) {
          resultsContainer.innerHTML = `<div class="p-6 text-center text-outline text-body-sm">No tracks found matching "${query}"</div>`;
          return;
        }

        resultsContainer.innerHTML = matches.map(t => `
          <div class="cmd-result-item flex items-center justify-between p-2.5 rounded hover:bg-surface-container-high cursor-pointer transition-colors" data-id="${t.id}">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white shrink-0" style="background: ${this.getTrackArtwork(t)}">
                <span class="material-symbols-outlined text-sm">music_note</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-body-md text-on-surface font-semibold truncate">${t.title}</span>
                <span class="font-body-sm text-outline truncate">${t.artist} • <span class="text-primary">${t.genre}</span></span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="font-label-code text-xs px-2 py-0.5 rounded bg-surface-container-lowest text-secondary-fixed">Val ${(t.val).toFixed(2)}</span>
              <span class="font-label-code text-xs px-2 py-0.5 rounded bg-surface-container-lowest text-primary">Eng ${(t.eng).toFixed(2)}</span>
              <button class="cmd-inspect-btn px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-medium hover:brightness-110 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">graphic_eq</span> Inspect
              </button>
            </div>
          </div>
        `).join('');

        resultsContainer.querySelectorAll('.cmd-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const trackId = item.getAttribute('data-id');
            const track = this.data.catalog.find(t => t.id === trackId);
            if (track) {
              this.inspectTrackAndNavigate(track);
            }
          });
        });
      });
    }
  },

  openCommandPalette() {
    const modal = document.getElementById('cmd-palette-backdrop');
    if (modal) {
      modal.classList.add('open');
      const input = document.getElementById('cmd-palette-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  closeCommandPalette() {
    const modal = document.getElementById('cmd-palette-backdrop');
    if (modal) modal.classList.remove('open');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MooderShared.initGlobalData();
});
