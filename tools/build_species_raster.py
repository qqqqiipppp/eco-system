"""Build the game's species WebP sprites from the approved 1448x1086 PNGs.

Run:  python tools/build_species_raster.py <artwork folder>   (needs Pillow)

Each PNG is cropped to its visible pixels and placed in the game's logical
frame (128x96, drawn here at 2x = 256x192) so that the lowest visible pixel
(feet, trunk base, shell) sits on the same ground line as the SVG art (y=87 of
96 -> 174 of 192), centred horizontally. The game's size and position values
stay untouched; only the picture inside the frame changes. Originals are only
read. The result and each source's SHA-256 go to assets/images/species-raster/manifest.json.
"""
import hashlib, json, sys
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
            box = im.getchannel('A').point(lambda v: 255 if v >= VISIBLE else 0).getbbox()
            part = im.crop(box)
            scale = min((W - 2 * MARGIN) / part.width, (GROUND - MARGIN) / part.height)
            size = (max(1, round(part.width * scale)), max(1, round(part.height * scale)))
            part = part.resize(size, Image.LANCZOS)
            canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            left = (W - size[0]) // 2
            canvas.alpha_composite(part, (left, GROUND - size[1]))
            target = out / f'{sid}.webp'
            canvas.save(target, 'WEBP', quality=86, alpha_quality=90, method=6)
            manifest['species'][sid] = {
                'file': f'{sid}.webp', 'source': f'{folder}/{sid}.png',
                'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sourceSize': list(im.size),
                'visibleBox': list(box), 'placedBox': [left, GROUND - size[1], left + size[0], GROUND],
                'bytes': target.stat().st_size,
            }
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return manifest

def build_motion(frames: Path, sid: str, names, out: Path):
    """Motion frames (python tools/build_species_raster.py --motion <folder> <id> move-0 move-1).

    Every frame of a species reuses the crop box and scale of its approved base
    picture, so the body stays put and only the drawn pose changes. The whole
    canvas is mapped (not re-cropped), so a leg reaching past the base outline
    is kept as long as it fits in the 256x192 frame.
    """
    manifest = json.loads((out / 'manifest.json').read_text(encoding='utf-8'))
    base = manifest['species'][sid]
    (x0, y0, x1, y1), (left, top, right, _) = base['visibleBox'], base['placedBox']
    scale = (right - left) / (x1 - x0)
    motion = base.setdefault('frames', {})
    for name in names:
        src = frames / f'{sid}-{name}.png'
        raw = src.read_bytes()
        im = Image.open(src).convert('RGBA')
        assert list(im.size) == base['sourceSize'], f'{src.name}: canvas must match the base picture'
        whole = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(whole, (round(left - x0 * scale), round(top - y0 * scale)))
        target = out / f'{sid}-{name}.webp'
        canvas.save(target, 'WEBP', quality=86, alpha_quality=90, method=6)
        motion[name] = {'file': target.name, 'source': src.name, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'bytes': target.stat().st_size}
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return motion

if __name__ == '__main__':
    if len(sys.argv) >= 4 and sys.argv[1] == '--motion':
        print(build_motion(Path(sys.argv[2]), sys.argv[3], sys.argv[4:], Path(__file__).resolve().parent.parent / 'assets/images/species-raster'))
        sys.exit()
    if len(sys.argv) < 2: sys.exit(__doc__)
    m = build(Path(sys.argv[1]), Path(__file__).resolve().parent.parent / 'assets/images/species-raster')
    print(len(m['species']), 'sprites,', sum(s['bytes'] for s in m['species'].values()) // 1024, 'KB')
