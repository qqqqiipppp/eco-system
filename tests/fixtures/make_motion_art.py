"""Stand-in motion art for tests: a delivery folder as GPT would hand it over,
made from the game's own base pictures mapped back onto the 1448x1086 source
canvas (so the frames line up exactly like real ones). A few files are wrong
on purpose to check the import warnings.

python tests/fixtures/make_motion_art.py <species-raster folder> <out folder>
"""
import json, sys
from pathlib import Path
from PIL import Image

raster, out = Path(sys.argv[1]), Path(sys.argv[2])
manifest = json.loads((raster / 'manifest.json').read_text(encoding='utf-8'))

def source_like(sid, dy=0, scale_by=1, tint=None):
    """The base picture back on its source canvas; dy moves it down, in source px."""
    s = manifest['species'][sid]
    (x0, y0, x1, _), (left, top, right, _) = s['visibleBox'], s['placedBox']
    scale = (right - left) / (x1 - x0)
    im = Image.open(raster / s['file']).convert('RGBA')
    big = im.resize((round(im.width / scale * scale_by), round(im.height / scale * scale_by)), Image.LANCZOS)
    if tint:
        r, g, b, a = big.split()
        big = Image.merge('RGBA', (r.point(lambda v: v // 3), g.point(lambda v: v // 3), b.point(lambda v: min(255, v + 140)), a))
    canvas = Image.new('RGBA', tuple(s['sourceSize']), (0, 0, 0, 0))
    canvas.alpha_composite(big, (round(x0 - left / scale), round(y0 - top / scale + dy)))
    return canvas

def save(im, name):
    folder = out / name.split('-')[0]
    folder.mkdir(parents=True, exist_ok=True)
    im.save(folder / name)

for n, dy in enumerate([0, -10, -60, -30]): save(source_like('frog', dy), f'frog-move-{n}.png')          # hop: leaves the ground
for n in range(4): save(source_like('bulbul', -20 * n), f'bulbul-move-{n}.png')                          # wingbeat
for n, dy in enumerate([0, -10, -40, -20]): save(source_like('weasel', dy), f'weasel-move-{n}.png')     # bound
for n in range(3): save(source_like('bulbul'), f'bulbul-eat-{n}.png')
nymph = source_like('grasshopper').resize((900, 675))                                                    # its own canvas
save(nymph, 'grasshopper-nymph.png')
for n in range(2): save(nymph, f'grasshopper-nymph-eat-{n}.png')
save(source_like('rabbit', tint=True), 'rabbit-eat-0.png')                                               # wrong colour
save(source_like('rabbit', scale_by=.5), 'rabbit-eat-1.png')                                             # wrong size
save(source_like('chipmunk', dy=120), 'chipmunk-eat-0.png')                                              # feet below the ground line
save(Image.new('RGBA', (1024, 1024)), 'snake-move-0.png')                                                # wrong canvas
save(source_like('frog'), 'frog-move-0-draft.png')                                                       # not a final name
print(out)
