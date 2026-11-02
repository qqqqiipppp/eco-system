"""Build the game's species WebP sprites from the approved 1448x1086 PNGs.

Run:  python tools/build_species_raster.py <artwork folder>   (needs Pillow)

Each PNG is cropped to its visible pixels and placed in the game's logical
frame (128x96, drawn here at 2x = 256x192) so that the lowest visible pixel
(feet, trunk base, shell) sits on the same ground line as the SVG art (y=87 of
96 -> 174 of 192), centred horizontally. The game's size and position values
stay untouched; only the picture inside the frame changes. Originals are only
read. The result and each source's SHA-256 go to assets/images/species-raster/manifest.json.
"""
import hashlib, json, re, sys
from pathlib import Path
from PIL import Image

# Final approved files (see each batch's report and asset-manifest.json).
SOURCES = {
    'forest-sprites-8-v3-final': ['bulbul', 'tit', 'chipmunk', 'rabbit', 'frog', 'grasshopper', 'grass', 'mushroom'],
    'forest-sprites-animals-10-v1': ['field-mouse', 'caterpillar', 'aphid', 'snail', 'spider', 'ladybird', 'snake', 'weasel', 'goshawk', 'earthworm'],
    'forest-sprites-batch3-plants-decomposers': ['oak', 'pine', 'hazel', 'raspberry', 'litter-mold', 'soil-bacteria'],
}
W, H, GROUND, MARGIN = 256, 192, 174, 8
VISIBLE = 16  # alpha below this is antialiasing dust, not part of the outline

def build(art: Path, out: Path):
    out.mkdir(parents=True, exist_ok=True)
    manifest = {'frame': [W, H], 'logicalFrame': [128, 96], 'groundY': GROUND, 'species': {}}
    for folder, ids in SOURCES.items():
        for sid in ids:
            src = art / folder / f'{sid}.png'
            raw = src.read_bytes()
            im = Image.open(src).convert('RGBA')
            canvas, box, placed = place(im)
            target = out / f'{sid}.webp'
            canvas.save(target, 'WEBP', quality=86, alpha_quality=90, method=6)
            manifest['species'][sid] = {
                'file': f'{sid}.webp', 'source': f'{folder}/{sid}.png',
                'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sourceSize': list(im.size),
                'visibleBox': box, 'placedBox': placed,
                'bytes': target.stat().st_size,
            }
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return manifest

# Growth stages painted as their own base picture (game stage names).
STAGES = ('nymph', 'sprout', 'mycelium')
STATES = ('move', 'eat', 'sense', 'leaf-turn')
# Animals whose move frames leave the ground (hop or flight; see moveStyles in
# js/ui/species-visuals.js): their move frames are not held to the ground line.
AIRBORNE = {'grasshopper', 'frog', 'rabbit', 'chipmunk', 'weasel', 'tit', 'bulbul', 'goshawk'}
ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / 'js/ui/species-frames.js'

def place(im: Image.Image):
    """A base picture: cropped to its visible pixels, fitted on the ground line."""
    box = im.getchannel('A').point(lambda v: 255 if v >= VISIBLE else 0).getbbox()
    part = im.crop(box)
    scale = min((W - 2 * MARGIN) / part.width, (GROUND - MARGIN) / part.height)
    size = (max(1, round(part.width * scale)), max(1, round(part.height * scale)))
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    left = (W - size[0]) // 2
    canvas.alpha_composite(part.resize(size, Image.LANCZOS), (left, GROUND - size[1]))
    return canvas, list(box), [left, GROUND - size[1], left + size[0], GROUND]

def place_like(im: Image.Image, base):
    """A frame: the whole canvas mapped with its base picture's crop and scale,
    so the body stays put and only the pose changes. A leg reaching past the
    base outline is kept as long as it fits in the 256x192 frame."""
    (x0, y0, x1, y1), (left, top, right, _) = base['visibleBox'], base['placedBox']
    scale = (right - left) / (x1 - x0)
    whole = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(whole, (round(left - x0 * scale), round(top - y0 * scale)))
    return canvas

def looks(canvas: Image.Image):
    """Opaque area, lowest opaque row, mean colour and a 12-bin hue mix."""
    rgba, hsv = canvas.tobytes(), canvas.convert('RGB').convert('HSV').tobytes()
    n, rgb, hues, bottom = 0, [0, 0, 0], [0] * 12, 0
    for i in range(W * H):
        if rgba[4 * i + 3] < 128: continue
        n += 1; bottom = i // W
        for c in range(3): rgb[c] += rgba[4 * i + c]
        if hsv[3 * i + 1] > 40: hues[hsv[3 * i] * 12 // 256] += 1
    total = sum(hues) or 1
    return {'area': n, 'bottom': bottom, 'rgb': [v / max(n, 1) for v in rgb], 'hues': [v / total for v in hues]}

def compare(frame: Image.Image, base: Image.Image, airborne: bool):
    """Warnings (Korean, for the person checking the art) where a frame drifts from its base."""
    f, b, notes = looks(frame), looks(base), []
    if not airborne and abs(f['bottom'] - b['bottom']) > 4:
        notes.append(f"발 높이가 기본 그림과 {f['bottom'] - b['bottom']:+d}px 달라요")
    ratio = f['area'] / max(b['area'], 1)
    if not (.6 <= ratio <= 1.8 if airborne else .75 <= ratio <= 1.33):  # spread wings and stretched legs take room
        notes.append(f'몸 크기가 기본 그림의 {ratio:.0%}예요')
    hue = sum(abs(x - y) for x, y in zip(f['hues'], b['hues'])) / 2
    tint = sum((x - y) ** 2 for x, y in zip(f['rgb'], b['rgb'])) ** .5
    if hue > .2 or tint > 20:
        notes.append(f'색이 기본 그림과 달라 보여요 (색 섞임 차이 {hue:.2f}, 평균 색 차이 {tint:.0f})')
    return notes

NAME = re.compile(r'^(?P<id>[a-z-]+?)(?:-(?P<stage>' + '|'.join(STAGES) + r'))?(?:-(?P<state>' + '|'.join(STATES) + r')-(?P<n>\d+))?\.png$')

def approved(folder: Path):
    """Every PNG under the folder, or only the final files its asset-manifest.json
    names (its "assets" list when there is one, so drafts listed elsewhere in
    it stay out; otherwise any PNG name in it)."""
    files = sorted(folder.rglob('*.png'))
    listed = folder / 'asset-manifest.json'
    if listed.exists():
        data, names = json.loads(listed.read_text(encoding='utf-8')), set()
        def walk(v):
            if isinstance(v, str) and v.lower().endswith('.png'): names.add(Path(v).name)
            elif isinstance(v, dict): [walk(x) for x in v.values()]
            elif isinstance(v, list): [walk(x) for x in v]
        walk([a.get('file') for a in data['assets']] if isinstance(data, dict) and isinstance(data.get('assets'), list) else data)
        if names: files = [f for f in files if f.name in names]
    return files

def import_art(folder: Path, out: Path, registry: Path = REGISTRY):
    """Bring a whole delivery in (python tools/build_species_raster.py --import <folder>).

    Names: <id>-<state>-<n>.png (frame), <id>-<stage>.png (growth-stage base),
    <id>-<stage>-<state>-<n>.png (that stage's frame). A growth stage is drawn
    on the same canvas as the grown picture, at its own size and on the same
    ground, so it takes the grown picture's crop and scale too (a sprout stays
    smaller than the grown grass); its frames share that. Writes the WebP files, records them in
    manifest.json and regenerates js/ui/species-frames.js. Returns a report.
    """
    manifest = json.loads((out / 'manifest.json').read_text(encoding='utf-8'))
    species, stages = manifest['species'], manifest.setdefault('stages', {})
    report = {'added': [], 'warnings': {}, 'skipped': {}}
    ids = sorted(species, key=len, reverse=True)
    parsed = []
    for src in approved(folder):
        m = NAME.match(src.name)
        sid = next((i for i in ids if m and (m['id'] == i)), None)
        if not m or not sid:
            report['skipped'][src.name] = '이름 규칙에 맞지 않거나 모르는 생물이에요'; continue
        parsed.append((0 if m['stage'] and not m['state'] else 1, src, sid, m['stage'], m['state'], m['n']))
    for _, src, sid, stage, state, n in sorted(parsed, key=lambda p: (p[0], p[1].name)):
        raw = src.read_bytes()
        im = Image.open(src).convert('RGBA')
        key = f'{sid}:{stage}' if stage else sid
        if stage and not state:
            grown = species[sid]
            if list(im.size) != grown['sourceSize']:
                report['skipped'][src.name] = f"캔버스가 기본 그림({grown['sourceSize'][0]}x{grown['sourceSize'][1]})과 달라요"; continue
            canvas, name = place_like(im, grown), f'{sid}-{stage}.webp'
            stages[key] = {**stages.get(key, {}), 'file': name, 'source': src.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
                           'sourceSize': list(im.size), 'visibleBox': grown['visibleBox'], 'placedBox': grown['placedBox']}
            entry = stages[key]
        else:
            base = stages.get(key) if stage else species[sid]
            if not base:
                report['skipped'][src.name] = f'{stage} 기본 그림이 아직 없어요'; continue
            if list(im.size) != base['sourceSize']:
                report['skipped'][src.name] = f"캔버스가 기본 그림({base['sourceSize'][0]}x{base['sourceSize'][1]})과 달라요"; continue
            canvas = place_like(im, base)
            name = f"{key.replace(':', '-')}-{state}-{n}.webp"
            notes = compare(canvas, Image.open(out / base['file']).convert('RGBA'), state == 'move' and sid in AIRBORNE)
            if notes: report['warnings'][src.name] = notes
            entry = base.setdefault('frames', {})[f'{state}-{n}'] = {'file': name, 'source': src.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'checks': notes}
        canvas.save(out / name, 'WEBP', quality=86, alpha_quality=90, method=6)
        entry['bytes'] = (out / name).stat().st_size
        report['added'].append(name)
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    write_registry(manifest, registry)
    return report

def frame_counts(frames):
    """state -> number of frames 0..n-1 in a row (a gap ends the run)."""
    counts = {}
    for state in STATES:
        n = 0
        while f'{state}-{n}' in frames: n += 1
        if n: counts[state] = n
    return counts

def write_registry(manifest, registry: Path):
    painted = {sid: frame_counts(s.get('frames', {})) for sid, s in manifest['species'].items()}
    painted.update({key: frame_counts(s.get('frames', {})) for key, s in manifest.get('stages', {}).items()})
    painted = {k: v for k, v in sorted(painted.items()) if v}
    registry.write_text('// Painted pictures on hand, written by tools/build_species_raster.py --import\n'
        '// from assets/images/species-raster/manifest.json. Do not edit by hand: put the\n'
        '// pictures in and run the tool (docs/SPECIES_MOTION_SPEC.md).\n'
        f'export const paintedFrames={json.dumps(painted, separators=(",", ":"))};\n'
        f'export const paintedStages={json.dumps(sorted(manifest.get("stages", {})), separators=(",", ":"))};\n', encoding='utf-8')

if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == '--import':
        out = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / 'assets/images/species-raster'
        r = import_art(Path(sys.argv[2]), out, Path(sys.argv[4]) if len(sys.argv) > 4 else REGISTRY)
        print(f"넣은 그림 {len(r['added'])}장")
        for name, notes in r['warnings'].items(): print(f'  확인 필요 {name}: ' + ' / '.join(notes))
        for name, why in r['skipped'].items(): print(f'  건너뜀 {name}: {why}')
        sys.exit()
    if len(sys.argv) < 2: sys.exit(__doc__)
    m = build(Path(sys.argv[1]), ROOT / 'assets/images/species-raster')
    print(len(m['species']), 'sprites,', sum(s['bytes'] for s in m['species'].values()) // 1024, 'KB')
