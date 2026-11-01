"""Build the 2018 BC grizzly density subunit layer from the official GDB zip.

Requires pyogrio, shapely, numpy and pyproj; pass the downloaded zip path.
"""
import hashlib, json, math, pathlib, sys, tempfile, zipfile
import pyogrio.raw
import shapely
from pyproj import Transformer
from shapely.geometry import mapping
from shapely.ops import transform

archive = pathlib.Path(sys.argv[1])
output = pathlib.Path('species-map/data/grizzly-2018.geojson')
source_url = 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/9408c126-7c2b-4db8-b0f2-05f9af8b980c/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_sub_units_spatial.gdb.zip'
with tempfile.TemporaryDirectory() as folder:
    with zipfile.ZipFile(archive) as z:
        z.extractall(folder)
    gdb = next(pathlib.Path(folder).glob('*.gdb'))
    meta, _, geometries, columns = pyogrio.raw.read(gdb, columns=['POPULATION_NAME', 'MU', 'EST_POP_DENSITY_2018'])
    data = dict(zip(meta['fields'], columns))
    project = Transformer.from_crs(meta['crs'], 'EPSG:4326', always_xy=True).transform
    features = []
    for i, wkb in enumerate(geometries):
        density = float(data['EST_POP_DENSITY_2018'][i])
        if not math.isfinite(density) or density <= 0:
            continue
        geom = shapely.from_wkb(wkb).simplify(200, preserve_topology=True)
        geom = shapely.set_precision(transform(project, geom), 0.0001)
        if not geom.is_valid:
            geom = shapely.make_valid(geom)
        features.append({'type':'Feature', 'properties':{'name':str(data['POPULATION_NAME'][i]), 'wmu':str(data['MU'][i]), 'density_2018':round(density, 3)}, 'geometry':mapping(geom)})
    result = {'type':'FeatureCollection', 'source':source_url, 'attribution':'Contains information licensed under the Open Government Licence – British Columbia.', 'features':features}
    output.write_text(json.dumps(result, separators=(',', ':')))
    manifest_path = pathlib.Path('species-map/data/sources.json')
    manifest = json.loads(manifest_path.read_text())
    manifest[output.name] = {'retrieved':'2026-10-31', 'source_urls':[source_url], 'source_sha256':[hashlib.sha256(archive.read_bytes()).hexdigest()], 'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Wrote {len(features)} grizzly density subunits.')
