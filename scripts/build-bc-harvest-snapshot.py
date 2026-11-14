#!/usr/bin/env python3
"""Build compact, directly sourced BC WMU resident-harvest statistics (1976-2024).

No imputation: blank provincial fields remain null, and species without a WMU
record do not acquire one. Five-year rates pool matching hunters and kills,
excluding incomplete years rather than interpreting blanks as zero.
"""
import collections
import csv
import hashlib
import io
import json
import pathlib
import urllib.request

URL = "https://catalogue.data.gov.bc.ca/dataset/f2303645-5952-4766-bd5c-3b9b50dda1ca/resource/ea1505f6-77ab-4838-b4a9-309ec55a3c20/download/big-game-harvest-statistics-1976-to-2024-wmu.csv"
SHA256 = "e433ed8fc5a9af0db38b190ee068cb48495d9a4a201613c86db13d63a3ade45e"
OUT = pathlib.Path("species-map/data/bc-official-harvest-wmu-2020-2024.json")
HISTORY_OUT = pathlib.Path("species-map/data/bc-official-harvest-history-1976-2024.json")
ALL_YEARS = range(1976, 2025)
YEARS = range(2020, 2025)
CODES = ("BEAB", "BOBC", "CARI", "COUG", "DEMU", "DEWT",
         "ELK", "GOAT", "LYNX", "MOOS", "SHEE", "WOLF")


def number(raw):
    value = str(raw or "").strip().replace(",", "")
    if not value or value.lower() in ("na", "n/a", "-", "suppressed"):
        return None
    try:
        result = int(value)
    except ValueError:
        return None
    return result if result >= 0 else None


def wmu_key(row):
    region = str(row.get("REGION") or "").strip().upper()
    if region not in {str(n) for n in range(1, 9)} | {"7A", "7B"}:
        return None
    number_wmu = number(row.get("WMU"))
    if number_wmu is None:
        return None
    region_number = 7 if region in ("7A", "7B") else int(region)
    # Official numeric WMU: 317 -> 3-17; 700 and 799 are aggregates.
    if number_wmu // 100 != region_number:
        return None
    unit = number_wmu % 100
    if unit in (0, 99):
        return None
    return f"{region_number}-{unit}"


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "HuntSmartCanada/1.0 (BC open-data harvest snapshot)"})
    with urllib.request.urlopen(req, timeout=45) as response:
        data = response.read(20_000_000)
        assert response.status == 200, f"Provincial download: {response.status}"
    digest = hashlib.sha256(data).hexdigest()
    if digest != SHA256:
        raise ValueError(f"Provincial source changed! Expected {SHA256}, got {digest}. Audit before republishing.")
    reader = csv.DictReader(io.StringIO(data.decode("utf-8-sig")))
    expected = {"HUNT YEAR", "SPECIES", "WMU", "REGION", "CI",
                "RESIDENT HUNTERS", "RESIDENT DAYS", "RESIDENT KILLS",
                "NON-RESIDENT HUNTERS", "NON-RESIDENT KILLS"}
    if not expected.issubset(set(reader.fieldnames or [])):
        raise ValueError(f"Missing provincial fields: {sorted(expected - set(reader.fieldnames or []))}")
    records = collections.defaultdict(dict)
    historical = collections.defaultdict(dict)
    for row in reader:
        year = number(row["HUNT YEAR"])
        code = str(row["SPECIES"] or "").strip().upper()
        if year not in ALL_YEARS or code not in CODES:
            continue
        wmu = wmu_key(row)
        if not wmu:
            continue
        ident = (code, wmu)
        if year in historical[ident]:
            raise ValueError(f"Duplicate official WMU/year record: {ident}, {year}")
        historical[ident][year] = row
        if year in YEARS:
            records[ident][year] = row

    payload = {
        "meta": {
            "publisher": "Government of British Columbia",
            "dataset": "Big Game Harvest Statistics 1976 to 2024",
            "dataset_url": "https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024",
            "source_csv": URL,
            "source_sha256": digest,
            "years": [2020, 2021, 2022, 2023, 2024],
            "measure": "Resident kills / estimated resident hunters; not GOS-only or legal-male success.",
            "blank": "Blank provincial cells are missing, never zero.",
            "subspecies": "Provincial categories cannot distinguish deer/elk/moose/sheep/caribou subspecies."
        },
        "species": {code: {} for code in CODES}
    }
    for (code, wmu), years in sorted(records.items()):
        latest = years.get(2024)
        entry = {}
        if latest:
            entry["y"] = [number(latest["RESIDENT HUNTERS"]),
                          number(latest["RESIDENT KILLS"]),
                          number(latest["RESIDENT DAYS"]),
                          number(latest["NON-RESIDENT HUNTERS"]),
                          number(latest["NON-RESIDENT KILLS"])]
            entry["ci"] = str(latest["CI"]).strip().lower() == "yes"
        valid = []
        for year in YEARS:
            row = years.get(year)
            if row is None:
                continue
            hunters, kills = number(row["RESIDENT HUNTERS"]), number(row["RESIDENT KILLS"])
            if hunters is not None and hunters > 0 and kills is not None:
                valid.append((hunters, kills))
        if valid:
            entry["p5"] = [sum(h for h, _ in valid),
                            sum(k for _, k in valid), len(valid)]
        if entry:
            payload["species"][code][wmu] = entry

    assert sum(len(v) for v in payload["species"].values()) > 1200, "Official WMU snapshot unexpectedly sparse"
    assert payload["species"]["SHEE"]["3-17"]["y"][:2] == [66, 7], "Sheep WMU 3-17 mismatch"
    assert len(payload["species"]["DEMU"]) > 100, "Mule deer WMU data missing"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
    # Historical values load only when someone selects a past year.
    # Keep the original small 2024/5-year dataset for the default display.
    history = {
        "meta": {
            "publisher": "Government of British Columbia",
            "dataset": "Big Game Harvest Statistics 1976 to 2024",
            "dataset_url": payload["meta"]["dataset_url"],
            "source_csv": URL,
            "source_sha256": digest,
            "first_year": 1976,
            "last_year": 2024,
            "boundary_warning": "Historical WMU numbers use current map geometry. Boundaries and reporting methods have changed; historical locations are approximate.",
            "missing_values": "Missing provincial estimates remain null, never imputed as zero."
        },
        "species": {code: {} for code in CODES}
    }
    for (code, wmu), years in sorted(historical.items()):
        cells = {}
        for year, row in sorted(years.items()):
            hunters, kills = number(row["RESIDENT HUNTERS"]), number(row["RESIDENT KILLS"])
            if hunters is not None or kills is not None:
                cells[str(year)] = [hunters, kills]
        if cells:
            history["species"][code][wmu] = cells
    assert sum(len(v) for v in history["species"].values()) > 1500, "Unexpectedly sparse full history"
    assert history["species"]["SHEE"]["3-17"]["2024"] == [66, 7], "Historical sheep data mismatch"
    if not any("1985" in rows for rows in history["species"]["DEMU"].values()):
        # Diagnose whether this is old nomenclature, old WMU encoding, or absent observations.
        probe = [r for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig")))
                 if number(r.get("HUNT YEAR")) == 1985]
        print("DIAGNOSTIC 1985 raw rows", len(probe),
              "species", dict(collections.Counter(r.get("SPECIES") for r in probe)),
              "region fields", dict(collections.Counter(r.get("REGION") for r in probe).most_common(12)))
        print("DIAGNOSTIC 1985 sample", probe[:6])
        print("DIAGNOSTIC 1985 parsed entries",
              {c:sum("1985" in y for y in m.values()) for c,m in history["species"].items()})
        print("WARNING: Official 1985 mule deer has no comparable WMU data; retain missing cells rather than infer.")
    HISTORY_OUT.write_text(json.dumps(history, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")
    print("Historical snapshot", HISTORY_OUT, "bytes", HISTORY_OUT.stat().st_size)
    print("Historic years", len({year for units in history["species"].values() for entries in units.values() for year in entries}),
          "data rows", sum(len(entries) for units in history["species"].values() for entries in units.values()))
    print("Source SHA256", digest, "bytes", len(data))
    for code in CODES:
        cells = payload["species"][code]
        recent = sum(1 for r in cells.values() if r.get("y", [None, None])[:2] != [None, None])
        comparable = sum(1 for r in cells.values() if r.get("y") and r["y"][0] and
                         r["y"][1] is not None and r["y"][1] <= r["y"][0])
        print(f"{code}: {len(cells)} WMUs, {comparable} comparable 2024 hunter-success cells, {recent} nonempty 2024 rows")
    for code in ("DEMU", "ELK", "SHEE"):
        print("EXAMPLE", code, "3-27", payload["species"][code].get("3-27"))
    print("Saved", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
