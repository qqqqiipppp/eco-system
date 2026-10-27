"""Draw data/forest-spaces.js anchors and ground line over the forest picture
for review: python tools/forest-anchor-overlay.py out.png  (needs Pillow)."""
import re, sys
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parent.parent
src = (root / 'data/forest-spaces.js').read_text(encoding='utf-8')
art = re.search(r"source:'([^']+)'", src).group(1)
im = Image.open(root / art).convert('RGB').resize((1200, 470))
d = ImageDraw.Draw(im)
ground = [tuple(map(float, p)) for p in re.findall(r'\[([\d.]+),(\d+)\]', src.split('groundContour=')[1].split(';')[0])]
d.line([(x * 1200, y) for x, y in ground], fill=(255, 230, 0), width=2)
for m in re.finditer(r"\{id:'([\w-]+)'[^}]*?zone:'(\w+)',x:(\d+),y:(\d+),rx:(\d+),ry:(\d+)", src):
    name, zone, x, y, rx, ry = m.group(1), m.group(2), *map(int, m.groups()[2:])
    color = {'canopy': (0, 90, 255), 'trunk': (230, 0, 0)}.get(zone, (160, 0, 160))
    d.ellipse([x - rx, y - ry, x + rx, y + ry], outline=color, width=2)
    d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=color)
    if zone in ('canopy', 'trunk'): d.text((x + 6, y - 12), name, fill=(0, 0, 0))
im.save(sys.argv[1] if len(sys.argv) > 1 else 'forest-anchors.png')
