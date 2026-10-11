# Make the first short in Kdenlive (26.08) — step by step

Your editor: `/home/saif/Music/kdenlive-26.08.1-x86_64.AppImage`

Goal: a 25–30s vertical (1080×1920) faceless short using the script in `FIRST-VIDEO.md`.

---

## 1. Open Kdenlive
- Open your file manager → **Music** → double-click **kdenlive-26.08.1-x86_64.AppImage**.
- Or in a terminal:
  ```
  ~/Music/kdenlive-26.08.1-x86_64.AppImage
  ```
- If it says something about FUSE, run this instead:
  ```
  ~/Music/kdenlive-26.08.1-x86_64.AppImage --appimage-extract-and-run
  ```

## 2. Make a vertical project (1080×1920)
1. **File → New** (Ctrl+N). If a profile list appears, pick any HD profile for now.
2. Open **Project → Project Settings** (or the wrench icon).
3. Set:
   - **Frame size / Width:** `1080`
   - **Height:** `1920`
   - **Frame rate:** `30`
4. Click **Save as profile** → name it `Vertical 1080p` → **OK**.
   (From now on your canvas is phone-shaped.)

## 3. Get background clips
1. Open a browser. Download 4–6 free vertical-ish MP4 clips:
   - **pexels.com** → search `laptop typing`, `writing notebook`, `spreadsheet`, `using phone`
   - **pixabay.com** → same searches
2. Save them to `~/Videos/clips/`.

## 4. Import them
- In Kdenlive, the **Project Bin** is the top-left panel.
- Right-click inside it → **Add Clip** → select your downloaded clips. (Or drag them in.)

## 5. Build the 6 beats on the timeline
The timeline is at the bottom. Video tracks are **V1, V2, V3** (top = higher layer).

1. Drag clip #1 onto **V1**. Grab its right edge and shorten it to ~3 seconds.
2. Drag clip #2 next to it (no gaps), and so on, until you have ~6 clips in a row.
3. **Trim precisely:** press **X** to switch to the Razor tool, click where you want to cut, then **V** to go back to the Select tool.
4. If a clip isn't vertical, select it → **Effects** tab → search **“Position and Zoom”** → double-click to add → set Zoom/Position so it fills the frame (or use **Crop, Scale and Tilt**).

## 6. Add the on-screen text (the hook + beats)
Kdenlive uses **Title Clips** for text.

1. Click the timeline so the playhead is at the start.
2. **Project → Add Title Clip** (or right-click in the timeline → **Add Title Clip**).
3. In the titler:
   - Delete the placeholder, type: `3 SIDE HUSTLES YOU CAN START TODAY WITH $0`
   - Pick a **bold** font, size **~90–110**, align **center**.
   - Set the background to transparent (right panel → background → none/transparent).
   - Click **OK**.
4. The title appears on a **V2** track. Trim it to cover the first ~3 seconds (drag its right edge).
5. **Repeat** for each beat. Put each new title on V2, directly above the matching video clip:

   | Beat | Title text |
   |---|---|
   | 1 | `3 SIDE HUSTLES YOU CAN START TODAY WITH $0` |
   | 2 | `#1 — WRITE A GUIDE OR CHECKLIST` |
   | 3 | `#2 — FREELANCE A SKILL YOU HAVE` |
   | 4 | `#3 — SELL A TEMPLATE YOU ALREADY USE` |
   | 5 | `ALL $0. NO INVENTORY.` |
   | 6 | `FREE 7-DAY PLAN — LINK IN BIO` |

> Tip: make the first title (hook) the biggest and boldest — it decides if people stop scrolling. The on-screen text doubles as your captions, so you don't need separate subtitles.

## 7. Voiceover (pick one)
**Option A — online (natural voice, easiest):**
1. Go to **ttsmaker.com** (free) → paste each line → choose a voice → **Generate** → download each MP3.
2. Import them into the Project Bin and drop them on an **audio track** (A1), lined up with each beat.

**Option B — offline on your PC:**
1. Install a voice engine: `sudo apt install espeak-ng`
2. Generate each line:
   ```
   espeak-ng -w line1.wav "Three side hustles you can start today with zero dollars."
   ```
3. Import the `.wav` files and place them on audio track **A1**.

**Option C — your own voice:** record with your phone voice-memo or a mic, import the file, drop on A1.

> Skip voice entirely and rely on text + music? It still works.

## 8. Music (optional)
1. Download a calm track from **pixabay.com/music** (free).
2. Import → drop on audio track **A2**.
3. Lower it: select the music clip → drag its **volume handle** down, or add the **Volume** effect and set ~15%.

## 9. Export the MP4
1. Click **Render** (top toolbar).
2. Preset: **MP4 (H.264 / AAC)**.
3. Confirm the resolution follows the project (**1080×1920**).
4. Set the output filename (e.g. `short1.mp4`) and folder.
5. Click **Render to File**. Wait — you now have your video.

---

## Then post it
Follow **Parts B, C, D** in `START-HERE.md` (YouTube → TikTok → Instagram), same file everywhere. Pin a comment with your free-guide link.

## Notes
- **Save often:** File → Save (Ctrl+S). Kdenlive project files (`.kdenlive`) are small.
- Want the 6 voiceover lines generated for you? Say the word — I can install the voice tool and produce the audio files for script #3 so you just drag them in.

## Reference guides on your PC
- First script + text beats: `marketing/FIRST-VIDEO.md`
- All 30 scripts: `marketing/SHORT-VIDEO-SCRIPTS.md`
