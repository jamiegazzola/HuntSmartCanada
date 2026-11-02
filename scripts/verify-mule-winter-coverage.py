#!/usr/bin/env python3
"""Confirm the combined mule layer retains both former black-tail winter layers."""
from pathlib import Path
from PIL import Image, ImageChops

root = Path('species-map/data')
base = Image.open(root / 'winter-mule_deer.png').convert('RGBA')
for name in ('winter-columbian-blacktail-island.png', 'winter-sitka-blacktail.png'):
    subset = Image.open(root / name).convert('RGBA')
    if subset.size != base.size:
        raise AssertionError(f'{name} uses a different raster grid')
    if ImageChops.subtract(subset.getchannel('A'), base.getchannel('A')).getbbox():
        raise AssertionError(f'{name} contains winter pixels missing from the mule layer')
print('Mule winter layer contains all mapped Columbian and Sitka winter pixels.')
