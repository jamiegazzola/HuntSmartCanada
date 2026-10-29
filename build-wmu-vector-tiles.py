from __future__ import annotations

from pathlib import Path
from collections import defaultdict
import json
import math
import re
import shutil

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
INDEX = SITE / "index.html"
RUNTIME = ROOT / "map-vector-runtime.js"
TILE_VERSION = "20261028-v2"
RUNTIME_VERSION = "2026-10-28-vector-v1"
MIN_ZOOM = 3
MAX_ZOOM = 9
EXTENT = 4096
SOURCE_LAYER = "wmus"


def load_js_geojson(path: Path):
    text = path.read_text(encoding="utf-8")
    eq = text.find("=")
    start = text.find("{", eq)
    end = text.rfind("}")
    if eq < 0 or start < 0 or end <= start:
        raise RuntimeError(f"{path.name}: GeoJSON assignment not found")
    return json.loads(text[start:end + 1])


def point_seg_dist2(p, a, b):
    px, py = p
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return (px - ax) ** 2 + (py - ay) ** 2
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    qx, qy = ax + t * dx, ay + t * dy
    return (px - qx) ** 2 + (py - qy) ** 2


def rdp(points, tolerance):
    if len(points) <= 2:
        return points[:]
    tol2 = tolerance * tolerance
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        a, b = points[start], points[end]
        best_i, best_d = -1, -1.0
        for i in range(start + 1, end):
            d = point_seg_dist2(points[i], a, b)
            if d > best_d:
                best_i, best_d = i, d
        if best_i >= 0 and best_d > tol2:
            keep[best_i] = True
            stack.append((start, best_i))
            stack.append((best_i, end))
    return [p for i, p in enumerate(points) if keep[i]]


def simplify_ring(ring, tolerance):
    if len(ring) < 5 or tolerance <= 0:
        return ring
    closed = ring[0] == ring[-1]
    pts = ring[:-1] if closed else ring[:]
    if len(pts) < 4:
        return ring
    anchor = pts[0]
    far_i = max(range(1, len(pts)), key=lambda i: (pts[i][0] - anchor[0]) ** 2 + (pts[i][1] - anchor[1]) ** 2)
    seq = pts[far_i:] + pts[:far_i + 1]
    simplified = rdp(seq, tolerance)
    if len(simplified) < 3:
        return ring
    if simplified[0] != simplified[-1]:
        simplified.append(simplified[0])
    return simplified


def simplify_geometry(geometry, tolerance):
    if not geometry:
        return geometry
    gtype = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if gtype == "Polygon":
        return {"type": "Polygon", "coordinates": [simplify_ring(ring, tolerance) for ring in coords]}
    if gtype == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": [[simplify_ring(ring, tolerance) for ring in poly] for poly in coords]}
    return geometry


def iter_points(geometry):
    if not geometry:
        return
    gtype = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if gtype == "Polygon":
        for ring in coords:
            yield from ring
    elif gtype == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                yield from ring


def bbox_geometry(geometry):
    points = list(iter_points(geometry))
    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]


def lonlat_to_world(lon, lat, zoom):
    lat = max(-85.05112878, min(85.05112878, lat))
    n = 2 ** zoom
    x = (lon + 180.0) / 360.0 * n
    lat_r = math.radians(lat)
    y = (1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n
    return x, y


def bbox_tile_range(bbox, zoom):
    minlon, minlat, maxlon, maxlat = bbox
    x1, y_bottom = lonlat_to_world(minlon, minlat, zoom)
    x2, y_top = lonlat_to_world(maxlon, maxlat, zoom)
    n = 2 ** zoom
    minx = max(0, min(n - 1, int(math.floor(min(x1, x2)))))
    maxx = max(0, min(n - 1, int(math.floor(max(x1, x2)))))
    miny = max(0, min(n - 1, int(math.floor(min(y_top, y_bottom)))))
    maxy = max(0, min(n - 1, int(math.floor(max(y_top, y_bottom)))))
    return minx, maxx, miny, maxy


def uvarint(value):
    value = int(value)
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        if value:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            return bytes(out)


def zigzag(value):
    return (value << 1) ^ (value >> 31)


def field_varint(field, value):
    return uvarint((field << 3) | 0) + uvarint(value)


def field_bytes(field, payload):
    return uvarint((field << 3) | 2) + uvarint(len(payload)) + payload


def pack_varints(values):
    return b"".join(uvarint(v) for v in values)


def tile_xy(lon, lat, zoom, tile_x, tile_y):
    world_x, world_y = lonlat_to_world(lon, lat, zoom)
    return int(round((world_x - tile_x) * EXTENT)), int(round((world_y - tile_y) * EXTENT))


def encode_ring(ring, zoom, tile_x, tile_y, cursor_x, cursor_y):
    if len(ring) < 4:
        return [], cursor_x, cursor_y
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    projected = [tile_xy(p[0], p[1], zoom, tile_x, tile_y) for p in pts]
    clean = []
    for p in projected:
        if not clean or p != clean[-1]:
            clean.append(p)
    if len(clean) < 3:
        return [], cursor_x, cursor_y
    commands = [(1 << 3) | 1]
    px, py = clean[0]
    commands += [zigzag(px - cursor_x), zigzag(py - cursor_y)]
    cursor_x, cursor_y = px, py
    commands.append(((len(clean) - 1) << 3) | 2)
    for px, py in clean[1:]:
        commands += [zigzag(px - cursor_x), zigzag(py - cursor_y)]
        cursor_x, cursor_y = px, py
    commands.append((1 << 3) | 7)
    return commands, cursor_x, cursor_y


def encode_geometry(geometry, zoom, tile_x, tile_y):
    gtype = geometry.get("type")
    commands = []
    cursor_x = cursor_y = 0
    polygons = [geometry.get("coordinates") or []] if gtype == "Polygon" else (geometry.get("coordinates") or [] if gtype == "MultiPolygon" else [])
    for poly in polygons:
        for ring in poly:
            encoded, cursor_x, cursor_y = encode_ring(ring, zoom, tile_x, tile_y, cursor_x, cursor_y)
            commands.extend(encoded)
    return commands


def encode_value_string(value):
    return field_bytes(1, str(value).encode("utf-8"))


def encode_layer(records, zoom, tile_x, tile_y):
    keys, key_index = [], {}
    values, value_index = [], {}
    feature_messages = []
    keep_props = ("wmu_id", "WMUNIT_NUM", "REGION_RESPONSIBLE_ID", "REGION_RESPONSIBLE_NAME", "GAME_MANAGEMENT_ZONE_NAME", "name", "WMUNIT_NAM")
    for rec in records:
        geometry_commands = encode_geometry(rec["geom_by_zoom"][zoom], zoom, tile_x, tile_y)
        if not geometry_commands:
            continue
        tags = []
        for key in keep_props:
            value = rec["props"].get(key)
            if value in (None, ""):
                continue
            if key not in key_index:
                key_index[key] = len(keys)
                keys.append(key)
            string_value = str(value)
            if string_value not in value_index:
                value_index[string_value] = len(values)
                values.append(string_value)
            tags += [key_index[key], value_index[string_value]]
        feature = bytearray()
        feature += field_varint(1, rec["id"])
        if tags:
            feature += field_bytes(2, pack_varints(tags))
        feature += field_varint(3, 3)
        feature += field_bytes(4, pack_varints(geometry_commands))
        feature_messages.append(bytes(feature))
    if not feature_messages:
        return b""
    layer = bytearray()
    layer += field_bytes(1, SOURCE_LAYER.encode("utf-8"))
    for feature in feature_messages:
        layer += field_bytes(2, feature)
    for key in keys:
        layer += field_bytes(3, key.encode("utf-8"))
    for value in values:
        layer += field_bytes(4, encode_value_string(value))
    layer += field_varint(5, EXTENT)
    layer += field_varint(15, 2)
    return field_bytes(3, bytes(layer))


def tolerance_for_zoom(zoom):
    return {3: 0.06, 4: 0.035, 5: 0.020, 6: 0.010, 7: 0.005, 8: 0.0022, 9: 0.0009}[zoom]


def make_records(feature_collection, province):
    records = []
    for feature in feature_collection.get("features") or []:
        geometry = feature.get("geometry") or {}
        bbox = bbox_geometry(geometry)
        if not bbox:
            continue
        props = dict(feature.get("properties") or {})
        if province == "BC":
            wmu_id = str(props.get("wmu_id") or props.get("WMUNIT_NUM") or "")
            props["wmu_id"] = wmu_id
            props["WMUNIT_NUM"] = str(props.get("WMUNIT_NUM") or wmu_id)
        else:
            props["WMUNIT_NUM"] = str(props.get("WMUNIT_NUM") or "")
        records.append({"id": len(records), "props": props, "geometry": geometry, "bbox": bbox, "geom_by_zoom": {}})
    return records


def make_index_feature_collection(records, province):
    tolerance = 0.0025 if province == "BC" else 0.0020
    return {
        "type": "FeatureCollection",
        "__hsVectorProvince": province,
        "__hsVectorIndex": True,
        "features": [
            {"type": "Feature", "id": rec["id"], "properties": rec["props"], "geometry": simplify_geometry(rec["geometry"], tolerance)}
            for rec in records
        ],
    }


def write_tiles(records, province, output_root):
    total_bytes = 0
    tile_count = 0
    for zoom in range(MIN_ZOOM, MAX_ZOOM + 1):
        tolerance = tolerance_for_zoom(zoom)
        tile_features = defaultdict(list)
        for rec in records:
            rec["geom_by_zoom"][zoom] = simplify_geometry(rec["geometry"], tolerance)
            minx, maxx, miny, maxy = bbox_tile_range(rec["bbox"], zoom)
            for x in range(minx, maxx + 1):
                for y in range(miny, maxy + 1):
                    tile_features[(x, y)].append(rec)
        for (x, y), features in tile_features.items():
            payload = encode_layer(features, zoom, x, y)
            if not payload:
                continue
            target = output_root / province.lower() / str(zoom) / str(x) / f"{y}.pbf"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
            tile_count += 1
            total_bytes += len(payload)
    return {"tileCount": tile_count, "tileBytes": total_bytes}


def inject_runtime():
    if not INDEX.exists() or not RUNTIME.exists():
        raise SystemExit("vector tiles build: site/index.html or map-vector-runtime.js missing")
    text = INDEX.read_text(encoding="utf-8")
    meta = f'<meta name="huntsmart-wmu-vector-tiles" content="{RUNTIME_VERSION}">'
    if 'name="huntsmart-wmu-vector-tiles"' not in text:
        text = text.replace("</head>", f"{meta}\n</head>", 1)
    tag = f'<script defer src="./map-vector-runtime.js?v={TILE_VERSION}"></script>'
    if "map-vector-runtime.js" not in text:
        pattern = re.compile(r'(<script\b[^>]*\bsrc=["\'][^"\']*map-performance-runtime\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>)', re.IGNORECASE)
        text, count = pattern.subn(r"\1\n" + tag, text, count=1)
        if count == 0:
            raise SystemExit("vector tiles build: map-performance runtime injection anchor missing")
    INDEX.write_text(text, encoding="utf-8")
    shutil.copy2(RUNTIME, SITE / RUNTIME.name)


def main():
    if not SITE.exists():
        raise SystemExit("vector tiles build: site directory missing")
    bc = load_js_geojson(ROOT / "bc-wmu-geojson.js")
    ab_features = []
    for part in (1, 2, 3):
        ab_features.extend(load_js_geojson(ROOT / f"ab-wmu-geojson-{part}.js").get("features") or [])
    ab = {"type": "FeatureCollection", "features": ab_features}
    bc_records = make_records(bc, "BC")
    ab_records = make_records(ab, "AB")
    output_root = SITE / "map-tiles" / TILE_VERSION
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True, exist_ok=True)
    bc_stats = write_tiles(bc_records, "BC", output_root)
    ab_stats = write_tiles(ab_records, "AB", output_root)
    manifest = {
        "version": RUNTIME_VERSION,
        "tileVersion": TILE_VERSION,
        "sourceLayer": SOURCE_LAYER,
        "minzoom": MIN_ZOOM,
        "maxzoom": MAX_ZOOM,
        "bc": {"featureCount": len(bc_records), "index": make_index_feature_collection(bc_records, "BC"), **bc_stats},
        "ab": {"featureCount": len(ab_records), "index": make_index_feature_collection(ab_records, "AB"), **ab_stats},
    }
    (output_root / "manifest.json").write_text(json.dumps(manifest, separators=(",", ":")), encoding="utf-8")
    inject_runtime()
    print("WMU vector tile build complete:", json.dumps({
        "version": RUNTIME_VERSION,
        "bc": {k: v for k, v in manifest["bc"].items() if k != "index"},
        "ab": {k: v for k, v in manifest["ab"].items() if k != "index"},
    }))


if __name__ == "__main__":
    main()
