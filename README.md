# Mooder — Music Intelligence Platform

**Mooder** is an interactive audio telemetry and music discovery web application analyzing 114,000 Spotify tracks across 114 distinct genres. It combines acoustic vector exploration, mood mapping, procedural Web Audio synthesis, and real-time playlist generation.

---

## 🌟 Key Features

1. **Overview Dashboard (`index.html`)**
   - High-level telemetry for 114,000 tracks, 29,858 artists, and 114 genres.
   - Playable Top Hit Tracks leaderboard with procedural audio previews.
   - Most Popular Genres breakdown with animated progress meters.

2. **Music DNA Analyzer (`music-dna.html`)**
   - Instant track search with real-time autocomplete across the catalog.
   - Interactive vinyl record player with audio scrubbing and Web Audio API harmonic synthesis.
   - 5-Axis Acoustic Radar Polygon comparing track vectors against genre benchmarks.
   - 5 core acoustic meters: Energy, Valence, Danceability, Acousticness, and Instrumentalness.
   - Cosine-similarity recommendation engine finding acoustically matched tracks.

3. **Mood Explorer (`mood-explorer.html`)**
   - Interactive 2D Cartesian Quadrant point cloud mapping Energy vs. Valence.
   - 4 emotional quadrants: Intense, Happy & Energetic, Calm & Sad, and Peaceful & Positive.
   - Smooth canvas pan, zoom, and hover HUD tooltips.
   - Acoustic Inspector drawer displaying nearest acoustic neighbors and direct playlist actions.

4. **Playlist Generator (`playlist-generator.html`)**
   - 6 mood atmosphere presets (Happy, Chill, Energetic, Melancholic, Focus, Workout).
   - Fine-tuning sliders for Energy, Valence (Mood), and Danceability.
   - Instant 25-track curated playlist generation with audio preview and CSV export.

---

## 🚀 Quick Start

Run a local HTTP server from the project directory:

```bash
# Python 3
python3 -m http.server 3000
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📁 Project Structure

```
mooder/
├── index.html                # Overview Dashboard
├── music-dna.html            # Music DNA Analyzer
├── mood-explorer.html        # 2D Mood Explorer Plane
├── playlist-generator.html   # Mood Playlist Generator
├── css/
│   └── mooder.css            # Obsidian Sonic Intelligence design system
├── js/
│   ├── mooder-audio.js       # Web Audio API procedural harmonic synth
│   └── mooder-shared.js      # Global data loader, command palette (⌘K), & storage
├── data/
│   ├── dataset_stats.json    # Precomputed global telemetry & top tracks
│   ├── genre_benchmarks.json # 7D acoustic medians for 114 genres
│   └── mood_catalog.json     # Fast-indexed 3,500+ tracks catalog
├── scripts/
│   └── prepare_data.py       # Python pipeline processing dataset.csv
├── dataset.csv               # 114,000 Spotify tracks dataset
└── .agents/                  # Stitch Design & Agent Skills
```

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, Tailwind CSS, Obsidian Sonic Intelligence dark theme
- **Audio Engine**: Web Audio API (procedural harmonic pad & bass synthesizer)
- **Data Visualizations**: HTML5 2D Canvas (Mood Plane) & SVG (Radar Polygons)
- **Data Processing**: Python 3 (pandas, numpy)
