#!/usr/bin/env python3
"""Validate BC harvest source consistency and build deterministic map-ready extracts.

Uses committed provincial source snapshots only; never downloads or imputes data.
A kills/hunters ratio is NOT a probability when the numerator can exceed the
denominator. Reliability labels below are screening rules, not survey CIs.
"""
import argparse
import collections
import hashlib
import json
import re
from pathlib import Path

SOURCE_SHA = "e433ed8fc5a9af0db38b190ee068cb48495d9a4a201613c86db13d63a3ade45e"
WMU = re.compile(r"^[1-8]-(?:[1-9]|[1-9][0-9])$")
CURRENT_FILE = "bc-official-harvest-wmu-2020-2024.json"
HISTORY_FILE = "bc-official-harvest-history-1976-2024.json"


def ensure(condition, message):
    if not condition:
        raise ValueError(message)


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")


def nonnegative(value):
    return value is None or (type(value) is int and value >= 0)


def classify(hunters, kills):
    if hunters is None or kills is None:
        return [None, "missing"]
    if hunters == 0:
        return [None, "zero_hunters"]
    if kills > hunters:
        return [None, "non_probability"]
    rate = round(100 * kills / hunters, 1)
    return [rate, "small_sample" if hunters < 10 else "ratio_comparable"]


def compile_data(input_dir, output_dir):
    current_path, history_path = input_dir / CURRENT_FILE, input_dir / HISTORY_FILE
    current, history = load(current_path), load(history_path)
    for name, data in (("current", current), ("history", history)):
        ensure(data.get("meta", {}).get("publisher") == "Government of British Columbia", name + ": publisher mismatch")
        ensure(data["meta"].get("source_sha256") == SOURCE_SHA, name + ": upstream source checksum changed")
        ensure(isinstance(data.get("species"), dict), name + ": species table missing")
    ensure(current["meta"].get("years") == [2020, 2021, 2022, 2023, 2024], "recent year contract changed")
    ensure(history["meta"].get("first_year") == 1976 and history["meta"].get("last_year") == 2024, "historical year contract changed")
    ensure(set(current["species"]).issubset(history["species"]), "current species absent from history")

    counters = collections.Counter()
    anomalies = []
    for code, units in history["species"].items():
        ensure(isinstance(units, dict), code + ": invalid WMU group")
        metrics = {}
        for unit, years in units.items():
            ensure(WMU.fullmatch(unit) is not None, code + "/" + unit + ": malformed WMU")
            ensure(isinstance(years, dict), code + "/" + unit + ": invalid year group")
            by_year = {}
            for year, record in years.items():
                ensure(year.isdecimal() and 1976 <= int(year) <= 2024, code + "/" + unit + ": invalid year " + year)
                ensure(isinstance(record, list) and len(record) == 2 and all(nonnegative(v) for v in record),
                       code + "/" + unit + "/" + year + ": invalid hunters/kills")
                rate, quality = classify(record[0], record[1])
                by_year[year] = [rate, quality]
                counters[quality] += 1
                if quality == "non_probability":
                    anomalies.append({"species": code, "wmu": unit, "year": int(year),
                                      "estimated_hunters": record[0], "reported_kills": record[1]})
            metrics[unit] = by_year
        if code in current["species"]:
            # Same archive shape consumed by the existing map; verified annual rates
            # provide an explicit comparability contract without changing raw observations.
            output = {
                "meta": {**history["meta"],
                         "validation": "structural and source reconciliation, not survey confidence",
                         "metric": "harvests_per_estimated_resident_hunter; not GOS-only or probability",
                         "derived_quality": "ratio_comparable, small_sample, missing, zero_hunters, non_probability"},
                "code": code,
                "species": {code: units},
                "metrics": metrics,
            }
            write(output_dir / ("harvest-history-" + code.lower() + ".json"), output)

    for code, units in current["species"].items():
        for unit, value in units.items():
            ensure(WMU.fullmatch(unit) is not None, code + "/" + unit + ": malformed recent WMU")
            historical_years = history["species"][code].get(unit, {})
            if "y" in value:
                annual = value["y"]
                ensure(isinstance(annual, list) and len(annual) == 5 and all(nonnegative(v) for v in annual),
                       code + "/" + unit + ": invalid 2024 measures")
                historical = historical_years.get("2024")
                if annual[0] is not None or annual[1] is not None:
                    ensure(historical == annual[:2], code + "/" + unit + ": 2024 source mismatch")
                else:
                    ensure(historical is None or historical == [None, None],
                           code + "/" + unit + ": missing 2024 conflict")
                counters["current_rows_checked"] += 1
            if "p5" in value:
                pooled = value["p5"]
                ensure(isinstance(pooled, list) and len(pooled) == 3 and all(type(n) is int and n >= 0 for n in pooled),
                       code + "/" + unit + ": invalid pooled measures")
                accepted = [
                    historical_years[str(y)]
                    for y in range(2020, 2025)
                    if str(y) in historical_years
                    and historical_years[str(y)][0] is not None
                    and historical_years[str(y)][0] > 0
                    and historical_years[str(y)][1] is not None
                ]
                expected = [sum(row[0] for row in accepted), sum(row[1] for row in accepted), len(accepted)]
                ensure(pooled == expected, code + "/" + unit + ": pooled source mismatch " + repr((pooled, expected)))
                counters["pooled_rows_checked"] += 1

    # Only additive metadata; all official measurements stay unchanged.
    verified_current = {
        **current,
        "meta": {**current["meta"],
                 "validation": "reconciled against committed 1976-2024 archive",
                 "metric": "resident kills / estimated resident hunters; not a confirmed individual success probability"},
    }
    write(output_dir / CURRENT_FILE, verified_current)
    audit = {
        "schema_version": 1,
        "publisher": "Government of British Columbia",
        "upstream_source_sha256": SOURCE_SHA,
        "input_files_sha256": {
            CURRENT_FILE: hashlib.sha256(current_path.read_bytes()).hexdigest(),
            HISTORY_FILE: hashlib.sha256(history_path.read_bytes()).hexdigest(),
        },
        "checks": dict(sorted(counters.items())),
        "non_probability_records": anomalies,
        "caveats": [
            "Harvest-to-hunter ratio does not always equal successful-hunter probability.",
            "Estimated hunter counts are not unique hunters across multiple years/hunt codes.",
            "Historical WMU boundaries and survey methods can change.",
            "LEH, GOS, and subspecies cannot be inferred from combined resident harvest statistics.",
            "Small-sample screening is not a statistical confidence interval.",
        ],
    }
    write(output_dir / "audit-report.json", audit)
    ensure(audit["checks"].get("current_rows_checked", 0) >= 1400, "unexpectedly sparse current harvest data")
    ensure(audit["checks"].get("pooled_rows_checked", 0) >= 1400, "unexpectedly sparse five-year harvest data")
    ensure((output_dir / "harvest-history-moos.json").exists(), "moose archive not generated")
    ensure(load(output_dir / "harvest-history-moos.json")["metrics"]["6-9"]["2024"] == [22.7, "ratio_comparable"],
           "moose WMU 6-9 2024 reference value changed")
    ensure(load(output_dir / "harvest-history-demu.json")["metrics"]["6-13"]["2024"] == [None, "non_probability"],
           "non-probability mule deer example not flagged")
    print("BC harvest data contract OK:", json.dumps(audit["checks"], sort_keys=True))
    print("Flagged non-probability records:", len(anomalies))
    return audit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("species-map/data"))
    parser.add_argument("--output", type=Path, default=Path("species-map/data/verified"))
    args = parser.parse_args()
    compile_data(args.input, args.output)


if __name__ == "__main__":
    main()
