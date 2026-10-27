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

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    m = build(Path(sys.argv[1]), Path(__file__).resolve().parent.parent / 'assets/images/species-raster')
    print(len(m['species']), 'sprites,', sum(s['bytes'] for s in m['species'].values()) // 1024, 'KB')
