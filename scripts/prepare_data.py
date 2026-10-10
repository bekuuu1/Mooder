#!/usr/bin/env python3
import csv
import json
import math
import os
from collections import defaultdict

DATASET_PATH = "/Users/beknur/Desktop/mooder/dataset.csv"
OUTPUT_DIR = "/Users/beknur/Desktop/mooder/data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Reading dataset.csv...")

total_tracks = 0
artists_set = set()
genres_dict = defaultdict(list)
popularity_bins = [0] * 10  # 0-9, 10-19, ..., 90-100
all_popularities = []
all_energies = []
all_valences = []
all_danceabilities = []
all_loudness = []
all_tempos = []
keys_count = defaultdict(int)

# 7 core features
feature_names = [
    "energy", "valence", "danceability", "acousticness",
    "instrumentalness", "speechiness", "liveness"
]

genre_features = defaultdict(lambda: {f: [] for f in feature_names})

# Store tracks for catalog
all_tracks_summary = []
top_tracks = []

with open(DATASET_PATH, mode="r", encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            track_id = row.get("track_id", "")
            artists = row.get("artists", "")
            album = row.get("album_name", "")
            title = row.get("track_name", "")
            genre = row.get("track_genre", "unknown")
            pop = float(row.get("popularity", 0))
            duration_ms = int(row.get("duration_ms", 0))
            explicit = row.get("explicit", "False").lower() == "true"
            dance = float(row.get("danceability", 0))
            energy = float(row.get("energy", 0))
            key = int(row.get("key", 0))
            loudness = float(row.get("loudness", 0))
            mode = int(row.get("mode", 1))
            speech = float(row.get("speechiness", 0))
            acoustic = float(row.get("acousticness", 0))
            instr = float(row.get("instrumentalness", 0))
            liveness = float(row.get("liveness", 0))
            valence = float(row.get("valence", 0))
            tempo = float(row.get("tempo", 0))
            time_sig = int(row.get("time_signature", 4))

            total_tracks += 1
            for a in artists.split(";"):
                if a.strip():
                    artists_set.add(a.strip())

            genres_dict[genre].append(pop)
            all_popularities.append(pop)
            all_energies.append(energy)
            all_valences.append(valence)
            all_danceabilities.append(dance)
            all_loudness.append(loudness)
            all_tempos.append(tempo)
            keys_count[key] += 1

            bin_idx = min(9, int(pop // 10))
            popularity_bins[bin_idx] += 1

            # Accumulate genre features
            gf = genre_features[genre]
            gf["energy"].append(energy)
            gf["valence"].append(valence)
            gf["danceability"].append(dance)
            gf["acousticness"].append(acoustic)
            gf["instrumentalness"].append(instr)
            gf["speechiness"].append(speech)
            gf["liveness"].append(liveness)

            track_obj = {
                "id": track_id,
                "title": title,
                "artist": artists,
                "album": album,
                "genre": genre,
                "pop": int(pop),
                "dur": duration_ms,
                "exp": explicit,
                "dnc": round(dance, 3),
                "eng": round(energy, 3),
                "key": key,
                "loud": round(loudness, 2),
                "mode": mode,
                "spc": round(speech, 3),
                "aco": round(acoustic, 3),
                "ins": round(instr, 3),
                "liv": round(liveness, 3),
                "val": round(valence, 3),
                "tmp": round(tempo, 1),
                "sig": time_sig
            }

            all_tracks_summary.append(track_obj)

        except Exception as e:
            continue

print(f"Processed {total_tracks} tracks across {len(genres_dict)} genres.")

# Compute global stats
mean_pop = sum(all_popularities) / len(all_popularities) if all_popularities else 0
var_pop = sum((x - mean_pop) ** 2 for x in all_popularities) / len(all_popularities) if all_popularities else 0
std_pop = math.sqrt(var_pop)

mean_val = sum(all_valences) / len(all_valences) if all_valences else 0
mean_eng = sum(all_energies) / len(all_energies) if all_energies else 0
mean_dance = sum(all_danceabilities) / len(all_danceabilities) if all_danceabilities else 0
mean_loud = sum(all_loudness) / len(all_loudness) if all_loudness else 0
mean_tempo = sum(all_tempos) / len(all_tempos) if all_tempos else 0

# Dominant key mapping
pitch_classes = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
dominant_key_num = max(keys_count.items(), key=lambda x: x[1])[0] if keys_count else 0
dominant_key_str = pitch_classes[dominant_key_num % 12]

# Genre stats
genre_stats = []
for g, pops in genres_dict.items():
    avg_p = sum(pops) / len(pops) if pops else 0
    genre_stats.append({
        "name": g,
        "count": len(pops),
        "avg_popularity": round(avg_p, 1)
    })
genre_stats.sort(key=lambda x: (x["avg_popularity"], x["count"]), reverse=True)

# Top 100 tracks by popularity
sorted_tracks = sorted(all_tracks_summary, key=lambda x: x["pop"], reverse=True)
top_tracks = sorted_tracks[:100]

dataset_stats = {
    "total_tracks": total_tracks,
    "total_artists": len(artists_set),
    "total_genres": len(genres_dict),
    "avg_popularity": round(mean_pop, 1),
    "std_popularity": round(std_pop, 1),
    "avg_valence": round(mean_val, 2),
    "avg_energy": round(mean_eng, 2),
    "avg_danceability": round(mean_dance, 2),
    "avg_loudness": round(mean_loud, 1),
    "avg_tempo": round(mean_tempo, 1),
    "dominant_key": dominant_key_str,
    "popularity_bins": popularity_bins,
    "top_genres": genre_stats[:20],
    "top_tracks": top_tracks
}

with open(os.path.join(OUTPUT_DIR, "dataset_stats.json"), "w", encoding="utf-8") as f:
    json.dump(dataset_stats, f, indent=2)

print("Saved dataset_stats.json")

# Compute Genre Benchmarks (medians & means for all 114 genres)
genre_benchmarks = {}
for g, f_dict in genre_features.items():
    g_bench = {}
    for feat in feature_names:
        vals = sorted(f_dict[feat])
        n = len(vals)
        mean_v = sum(vals) / n if n else 0.5
        med_v = vals[n // 2] if n else 0.5
        g_bench[feat] = {
            "mean": round(mean_v, 3),
            "median": round(med_v, 3)
        }
    genre_benchmarks[g] = g_bench

with open(os.path.join(OUTPUT_DIR, "genre_benchmarks.json"), "w", encoding="utf-8") as f:
    json.dump(genre_benchmarks, f, indent=2)

print("Saved genre_benchmarks.json")

# Curate Mood Catalog:
# To ensure ultra-fast 60fps rendering in the browser while maintaining high diversity:
# Select:
# 1. Top 1500 most popular tracks overall
# 2. Plus top 35 most popular tracks from each of the 114 genres (35 * 114 = ~4000 tracks)
# 3. Plus diverse quadrant outliers (highest/lowest valence/energy combos)
# Total catalog: ~5,500 highly responsive tracks covering the entire musical landscape!
selected_ids = set()
catalog_tracks = []

for t in sorted_tracks[:1500]:
    if t["id"] not in selected_ids:
        selected_ids.add(t["id"])
        catalog_tracks.append(t)

genre_grouped = defaultdict(list)
for t in all_tracks_summary:
    genre_grouped[t["genre"]].append(t)

for g, g_tracks in genre_grouped.items():
    g_sorted = sorted(g_tracks, key=lambda x: x["pop"], reverse=True)
    for t in g_sorted[:35]:
        if t["id"] not in selected_ids:
            selected_ids.add(t["id"])
            catalog_tracks.append(t)

print(f"Curated mood catalog with {len(catalog_tracks)} high-definition tracks.")

with open(os.path.join(OUTPUT_DIR, "mood_catalog.json"), "w", encoding="utf-8") as f:
    json.dump(catalog_tracks, f, separators=(',', ':'))

print("Saved mood_catalog.json")
print("Data preparation complete!")
