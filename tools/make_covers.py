#!/usr/bin/env python3
import json, os, zipfile
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "covers")
os.makedirs(OUT, exist_ok=True)
import subprocess
P = json.loads(subprocess.check_output(["node", "-e", "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.PRODUCTS))", os.path.join(ROOT, "assets", "products.js")]))

W, H = 800, 450
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
def F(p, s): return ImageFont.truetype(p, s)

CB = (64, 92, 736, 392)  # content box


def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def base():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    top, bot = (26, 31, 42), (12, 15, 21)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bot, y / H))
    for x in range(0, W, 26):
        for y in range(0, H, 26):
            d.point((x, y), fill=(38, 44, 56))
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.ellipse([-180, -250, 470, 270], fill=(247, 147, 26, 26))
    od.ellipse([540, 300, 940, 580], fill=(56, 189, 248, 14))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    return img


def window(fname):
    img = base()
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([58, 62, 762, 420], radius=16, fill=(0, 0, 0, 120))
    img = Image.alpha_composite(img.convert("RGBA"), sh).convert("RGB")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([48, 44, 752, 404], radius=14, fill=(18, 21, 28), outline=(40, 46, 58))
    d.rounded_rectangle([48, 44, 752, 80], radius=14, fill=(31, 35, 45))
    d.rectangle([48, 66, 752, 80], fill=(31, 35, 45))
    for i, c in enumerate([(244, 91, 91), (245, 196, 81), (74, 208, 122)]):
        cx = 70 + i * 20
        d.ellipse([cx - 5, 57, cx + 5, 67], fill=c)
    d.text((124, 55), fname, font=F(FR, 15), fill=(150, 161, 176))
    return img, d


def fit_text(d, text, font, maxw):
    if d.textlength(text, font=font) <= maxw:
        return text
    while text and d.textlength(text + "\u2026", font=font) > maxw:
        text = text[:-1]
    return text + "\u2026"


def cover_xlsx(path):
    img, d = window(os.path.basename(path))
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i >= 8: break
        rows.append([("" if c is None else str(c)) for c in r[:5]])
    x0, y0, x1, y1 = CB
    d.rounded_rectangle([x0 - 4, y0 - 4, x1 + 4, y1 + 4], radius=8, fill=(244, 246, 249))
    rh = 26
    numw = 34
    ncols = 5
    cw = (x1 - x0 - numw) / ncols
    fh, fc = F(FB, 14), F(FR, 14)
    for ri, row in enumerate(rows):
        yy = y0 + ri * rh
        d.rectangle([x0, yy, x0 + numw, yy + rh], fill=(226, 232, 240))
        d.text((x0 + 9, yy + 5), str(ri + 1), font=fc, fill=(100, 116, 139))
        for ci in range(ncols):
            cx = x0 + numw + ci * cw
            cell = row[ci] if ci < len(row) else ""
            if ri == 0:
                d.rectangle([cx, yy, cx + cw, yy + rh], fill=(247, 147, 26))
                d.text((cx + 8, yy + 5), fit_text(d, cell, fh, cw - 16), font=fh, fill=(32, 20, 0))
            else:
                if ri % 2 == 1:
                    d.rectangle([cx, yy, cx + cw, yy + rh], fill=(248, 250, 252))
                d.text((cx + 8, yy + 5), fit_text(d, cell, fc, cw - 16), font=fc, fill=(30, 36, 48))
            d.line([(cx, yy), (cx, yy + rh)], fill=(210, 217, 226))
        d.line([(x0, yy + rh), (x1, yy + rh)], fill=(226, 232, 240))
    return img


def cover_docx(path):
    img, d = window(os.path.basename(path))
    import docx
    doc = docx.Document(path)
    title = None
    paras = []
    for para in doc.paragraphs:
        t = (para.text or "").strip()
        if not t: continue
        nm = (para.style.name or "").lower() if para.style else ""
        if nm.startswith(("heading", "title")) and title is None:
            title = t
        else:
            paras.append(t)
        if len(paras) >= 7: break
    x0, y0, x1, y1 = CB
    d.rounded_rectangle([x0, y0 - 6, x1, y1 + 6], radius=8, fill=(250, 251, 253))
    d.rectangle([x0, y0 - 6, x0 + 6, y1 + 6], fill=(247, 147, 26))
    px = x0 + 34
    py = y0 + 12
    if title:
        t = fit_text(d, title, F(FB, 22), x1 - px - 24)
        d.text((px, py), t, font=F(FB, 22), fill=(24, 28, 38))
        py += 40
    f = F(FR, 14)
    for p in paras:
        words = p.split()
        line = ""
        for w in words:
            if d.textlength(line + " " + w, font=f) > x1 - px - 24:
                d.text((px, py), line, font=f, fill=(90, 100, 116)); py += 21; line = w
                if py > y1 - 20: break
            else:
                line = (line + " " + w).strip()
        if line and py <= y1 - 20:
            d.text((px, py), line, font=f, fill=(90, 100, 116)); py += 21
        if py > y1 - 20: break
    return img


def cover_pptx(path):
    img, d = window(os.path.basename(path))
    from pptx import Presentation
    prs = Presentation(path)
    title = ""; body = []
    for slide in prs.slides:
        for sh in slide.shapes:
            if not sh.has_text_frame: continue
            t = sh.text_frame.text.strip()
            if not t: continue
            lines = [l.strip() for l in t.split("\n") if l.strip()]
            if not title:
                title = lines[0]; lines = lines[1:]
            body += lines
        break
    x0, y0, x1, y1 = CB
    d.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(14, 17, 24))
    d.rectangle([x0, y0, x1, y0 + 8], fill=(247, 147, 26))
    px = x0 + 34
    py = y0 + 40
    d.text((px, py), fit_text(d, title or "Untitled", F(FB, 27), x1 - px - 30), font=F(FB, 27), fill=(240, 243, 248))
    py += 56
    f = F(FR, 16)
    for b in body[:6]:
        d.ellipse([px, py + 6, px + 7, py + 13], fill=(247, 147, 26))
        d.text((px + 20, py), fit_text(d, b, f, x1 - px - 40), font=f, fill=(190, 198, 210))
        py += 32
    return img


RUN_OUTPUT = {
    "csv-report-tool": [
        "python csv_report.py sample-sales.csv",
        "Reading sample-sales.csv \u2026 1,240 rows",
        "",
        "column      type     unique",
        "date        date        118",
        "region      text          4",
        "units       int         198",
        "revenue     float     1,240",
        "",
        "Wrote report.md  \u2713",
    ],
    "bulk-file-organizer": [
        "python organize.py ~/Downloads",
        "Scanning ~/Downloads \u2026 143 files",
        "",
        "Images/        62 files",
        "Documents/     28 files",
        "Spreadsheets/   9 files",
        "Archives/      14 files",
        "Audio/          7 files",
        "",
        "Organised 143 files into 5 folders  \u2713",
    ],
    "duplicate-file-finder": [
        "python find_duplicates.py ~/Pictures",
        "Scanning 2,184 files \u2026",
        "",
        "12 groups of duplicates found",
        "  IMG_2043.jpg = IMG_2043 (1).jpg",
        "  IMG_2051.jpg = IMG_2051 (1).jpg",
        "  holiday.png  = holiday (copy).png",
        "",
        "2.4 GB reclaimable  \u2713",
    ],
    "csv-to-excel-converter": [
        "python csv_to_excel.py data.csv",
        "Loaded data.csv \u2014 8,320 rows",
        "",
        "Writing data.xlsx \u2026",
        "  Sheet1   8,320 rows \u00d7 12 cols",
        "",
        "Saved data.xlsx  \u2713",
    ],
    "expense-csv-analyzer": [
        "python analyze_expenses.py 2026.csv",
        "Analysing 642 transactions \u2026",
        "",
        "Groceries      $  6,214",
        "Transport      $  1,880",
        "Rent           $ 18,000",
        "Dining         $  2,341",
        "",
        "Total spend    $ 30,127",
    ],
    "pdf-toolkit": [
        "python pdf_toolkit.py merge a.pdf b.pdf",
        "Opened a.pdf (12 pages)",
        "Opened b.pdf  (7 pages)",
        "",
        "Merging \u2026",
        "Wrote merged.pdf \u2014 19 pages  \u2713",
    ],
    "image-batch-resizer": [
        "python resize_images.py photos/ 1200",
        "Found 86 images",
        "",
        "Resizing by width \u2192 1200 px",
        "  photos/out/   86 files",
        "",
        "Done in 3.2s  \u2713",
    ],
    "qr-code-generator": [
        "python make_qr.py 'https://mysite.com'",
        "Encoding \u2026 error-correction M",
        "",
        "Wrote qr.png \u2014 512\u00d7512  \u2713",
        "Scan with any phone camera to open it.",
    ],
    "secure-password-generator": [
        "python gen_password.py --count 3 -l 16",
        "Generating 3 passwords \u2026",
        "",
        "k7#Pq2Lm9Xr4Tz1w",
        "Vh8$Bn3Yd6Wq0Ks5",
        "Rj2!Fm7Cv1Zp9Lx4",
        "",
        "Copy one and keep it safe  \u2713",
    ],
    "batch-file-renamer": [
        "python rename.py --prefix trip_###",
        "Renaming 24 files \u2026",
        "",
        "DSC0001.jpg  \u2192  trip_001.jpg",
        "DSC0002.jpg  \u2192  trip_002.jpg",
        "DSC0003.jpg  \u2192  trip_003.jpg",
        "\u2026 21 more",
        "",
        "Renamed 24 files  \u2713",
    ],
    "simple-web-scraper": [
        "python scrape.py news.example.com",
        "Fetching page \u2026 200 OK",
        "",
        "1. Markets rally on rate news",
        "2. New battery breaks record",
        "3. City opens river park",
        "4. Team wins championship",
        "",
        "Saved 42 items \u2192 items.csv  \u2713",
    ],
    "csv-data-cleaner": [
        "python clean_csv.py messy.csv",
        "Loaded messy.csv \u2014 5,100 rows",
        "",
        "Trimmed whitespace   1,204 cells",
        "Removed duplicates      312 rows",
        "Filled blank cells       58",
        "",
        "Saved messy_clean.csv  \u2713",
    ],
    "recipe-scaler-py": [
        "python scale_recipe.py cake.txt -s 6",
        "Recipe for 4 \u2192 scaled to 6",
        "",
        "Flour       300 g  \u2192  450 g",
        "Sugar       200 g  \u2192  300 g",
        "Butter      180 g  \u2192  270 g",
        "Eggs          3    \u2192  4.5",
        "",
        "Scaled recipe saved  \u2713",
    ],
    "flashcard-quiz": [
        "python quiz.py spanish.csv",
        "Question 1 / 20",
        "",
        "  Como se dice 'house'?",
        "  > casa",
        "  Correct!  \u2713    1 / 1",
        "",
        "Score so far: 100%",
    ],
    "grade-calculator-py": [
        "python grade_calc.py class.csv",
        "Loaded 38 students \u2026",
        "",
        "Average     82.4   (B)",
        "Highest     98     (A)",
        "Lowest      61     (D)",
        "Pass rate   92%",
        "",
        "Saved grades.csv  \u2713",
    ],
    "random-group-generator": [
        "python make_groups.py team.txt -g 3",
        "Loaded 15 names \u2192 3 groups",
        "",
        "Group A: Ava, Ben, Mia, Leo, Zoe",
        "Group B: Sam, Nora, Kai, Ivy, Tom",
        "Group C: Eli, Ruby, Max, Ana, Jon",
        "",
        "Groups saved  \u2713",
    ],
    "packing-list-generator": [
        "python packing_list.py beach 5",
        "Building list for 5 days \u2026",
        "",
        "[x] Sunscreen    [x] Swimwear",
        "[x] 5 t-shirts   [x] Shorts",
        "[x] Passport     [x] Charger",
        "",
        "24 items \u2192 packing_list.txt  \u2713",
    ],
    "interval-timer": [
        "python interval_timer.py 30 10",
        "Work 30s / Rest 10s \u2014 8 rounds",
        "",
        "  WORK   00:30",
        "  REST   00:10",
        "  \u2026",
        "Round 8 / 8 complete  \u2713",
    ],
    "images-to-pdf": [
        "python images_to_pdf.py scans/",
        "Found 43 images",
        "",
        "Adding to PDF \u2026",
        "  page 43 / 43",
        "",
        "Wrote scans.pdf \u2014 43 pages  \u2713",
    ],
    "pdf-to-text": [
        "python pdf_to_text.py report.pdf",
        "Opened report.pdf (19 pages)",
        "Extracting text \u2026",
        "",
        "Wrote report.txt \u2014 24,180 chars",
        "First line: 'Quarterly Summary'  \u2713",
    ],
    "grocery-list-builder": [
        "python grocery_list.py dinner.txt",
        "Parsing recipe ingredients \u2026",
        "",
        "Produce:  onion, garlic, tomato",
        "Dairy:    butter, parmesan",
        "Pantry:   pasta, olive oil",
        "Meat:     beef mince",
        "",
        "12 items \u2192 grocery.txt  \u2713",
    ],
}


def cover_script(pid, path):
    img, d = window(os.path.basename(path))
    lines = RUN_OUTPUT.get(pid)
    x0, y0, x1, y1 = CB
    d.rounded_rectangle([x0, y0, x1, y1], radius=8, fill=(9, 12, 17))
    fm = F(FM, 14)
    fb = F(FB, 14)
    maxw = x1 - x0 - 48
    if not lines:
        return cover_zipcode(path)
    yy = y0 + 12
    for i, ln in enumerate(lines):
        if i == 0:
            d.text((x0 + 12, yy), "\u25b6", font=fb, fill=(247, 147, 26))
            d.text((x0 + 34, yy), fit_text(d, ln, fb, maxw), font=fb, fill=(150, 235, 170))
        elif ln.startswith("\u2713") or ln.endswith("\u2713"):
            d.text((x0 + 34, yy), fit_text(d, ln, fm, maxw), font=fm, fill=(247, 180, 90))
        elif i == 1 and "\u2026" in ln:
            d.text((x0 + 34, yy), fit_text(d, ln, fm, maxw), font=fm, fill=(120, 132, 150))
        else:
            d.text((x0 + 34, yy), fit_text(d, ln, fm, maxw), font=fm, fill=(184, 196, 214))
        yy += 20
        if yy > y1 - 8:
            break
    return img


def cover_zipcode(path):
    img, d = window(os.path.basename(path))
    import zipfile
    z = zipfile.ZipFile(path)
    names = [n for n in z.namelist() if not n.endswith("/") and "__MACOSX" not in n]
    py = [n for n in names if n.endswith(".py")]
    lines = []
    if py:
        try:
            with z.open(py[0]) as fh:
                lines = fh.read().decode("utf-8", "replace").splitlines()[:18]
        except Exception:
            lines = []
    x0, y0, x1, y1 = CB
    d.rounded_rectangle([x0, y0, x1, y1], radius=8, fill=(13, 16, 22))
    fm = F(FM, 14)
    fn = F(FM, 13)
    yy = y0 + 10
    for i, ln in enumerate(lines):
        d.text((x0 + 12, yy), str(i + 1).rjust(2), font=fn, fill=(80, 89, 104))
        d.text((x0 + 42, yy), fit_text(d, ln.rstrip(), fm, x1 - x0 - 56), font=fm, fill=(176, 196, 220))
        yy += 19
        if yy > y1 - 16: break
    return img


def cover_html(pid):
    img, d = window(pid + ".html")
    src = os.path.join(ROOT, "previews", "img", pid + ".png")
    shot = Image.open(src).convert("RGB")
    x0, y0, x1, y1 = CB
    cw, ch = x1 - x0, y1 - y0
    fit = ImageOps.fit(shot, (cw, ch), method=Image.LANCZOS, centering=(0.5, 0.0))
    img.paste(fit, (x0, y0))
    d.rectangle([x0, y0, x1, y1], outline=(40, 46, 58))
    return img


def make(p):
    ext = p["file"].rsplit(".", 1)[-1].lower()
    fp = os.path.join(ROOT, p["file"])
    try:
        if ext == "html": return cover_html(p["id"])
        if ext == "xlsx": return cover_xlsx(fp)
        if ext == "docx": return cover_docx(fp)
        if ext == "pptx": return cover_pptx(fp)
        if ext == "zip": return cover_script(p["id"], fp)
    except Exception as e:
        print("FAIL", p["id"], e)
        return None
    return None


n = 0
for p in P:
    im = make(p)
    if im is None:
        continue
    im.save(os.path.join(OUT, p["id"] + ".jpg"), "JPEG", quality=84, optimize=True)
    n += 1
print("covers written:", n, "of", len(P))
