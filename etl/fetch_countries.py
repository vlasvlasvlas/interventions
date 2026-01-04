"""
Fetch macro/resource indicators from the World Bank API for all ISO codes
present in data/interventions.json and write data/countries.json.

Sources:
 - Country meta: https://api.worldbank.org/v2/country/{code}
 - GDP per capita PPP: NY.GDP.PCAP.PP.KD
 - Gini: SI.POV.GINI
 - Poverty headcount: SI.POV.DDAY
 - Resource rents (% GDP): NY.GDP.PETR.RT.ZS (oil), NY.GDP.NGAS.RT.ZS (gas), NY.GDP.MINR.RT.ZS (minerals)

Missing data is kept as null; independence/regime fields are not populated here.
"""
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.error import URLError, HTTPError
from urllib.request import urlopen

BASE = "https://api.worldbank.org/v2"
TIMEOUT = 10

INDICATORS = {
    "gdp_pc_ppp": "NY.GDP.PCAP.PP.KD",
    "gini": "SI.POV.GINI",
    "poverty_rate": "SI.POV.DDAY",
    "oil_rents_pct_gdp": "NY.GDP.PETR.RT.ZS",
    "gas_rents_pct_gdp": "NY.GDP.NGAS.RT.ZS",
    "mineral_rents_pct_gdp": "NY.GDP.MINR.RT.ZS",
}


def fetch_json(url: str) -> Optional[Any]:
    try:
        with urlopen(url, timeout=TIMEOUT) as resp:
            if resp.status != 200:
                print(f"[warn] {url} -> status {resp.status}", file=sys.stderr)
                return None
            return json.load(resp)
    except (HTTPError, URLError, TimeoutError) as e:
        print(f"[warn] {url} -> {e}", file=sys.stderr)
        return None


def fetch_indicator(code: str, indicator: str) -> Tuple[Optional[float], Optional[int], str]:
    url = f"{BASE}/country/{code}/indicator/{indicator}?format=json&per_page=200"
    data = fetch_json(url)
    if not data or len(data) < 2 or not data[1]:
        return None, None, url
    for entry in data[1]:
        val = entry.get("value")
        year = entry.get("date")
        if val is not None:
            try:
                year_int = int(year)
            except Exception:
                year_int = None
            return val, year_int, url
    return None, None, url


def fetch_meta(
    code: str,
) -> Tuple[
    Optional[str],
    Optional[str],
    Optional[str],
    Optional[str],
    Optional[str],
    Optional[str],
    str,
]:
    url = f"{BASE}/country/{code}?format=json"
    data = fetch_json(url)
    if not data or len(data) < 2 or not data[1]:
        return None, None, None, None, None, None, url
    item = data[1][0]
    return (
        item.get("name"),
        item.get("iso2Code") or code,
        item.get("region", {}).get("value"),
        item.get("adminregion", {}).get("value"),
        item.get("incomeLevel", {}).get("value"),
        item.get("lendingType", {}).get("value"),
        url,
    )


def main() -> None:
    interventions = json.loads(Path("data/interventions.json").read_text(encoding="utf-8"))
    codes = sorted(
        {
            i.get("country", {}).get("code")
            for i in interventions.get("interventions", [])
            if i.get("country", {}).get("code")
        }
    )

    countries = []
    for code in codes:
        (
            name_en,
            iso2,
            region_wb,
            admin_region_wb,
            income_level_wb,
            lending_type_wb,
            meta_src,
        ) = fetch_meta(code)
        entry: Dict[str, Any] = {
            "code": iso2 or code,
            "iso3": None,
            "name_en": name_en,
            "name_es": name_en,
            "region_wb": region_wb,
            "admin_region_wb": admin_region_wb,
            "income_level_wb": income_level_wb,
            "lending_type_wb": lending_type_wb,
            "independence_year": None,
            "source_independence": None,
            "regime_series": [],
            "resources": {},
            "indicators": {},
            "sources": {"meta": meta_src},
        }

        for key, ind in INDICATORS.items():
            val, year, src = fetch_indicator(code, ind)
            if key in {"oil_rents_pct_gdp", "gas_rents_pct_gdp", "mineral_rents_pct_gdp"}:
                entry["resources"][key] = {"value": val, "year": year}
            else:
                entry["indicators"][key] = {"value": val, "year": year}
            entry["sources"][key] = src

        countries.append(entry)

    out = {
        "countries": countries,
        "retrieved_at": datetime.utcnow().isoformat() + "Z",
        "source": "World Bank API (macro/resource indicators); meta from WB country endpoint; independence/regime not populated yet",
    }

    Path("data/countries.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Countries fetched: {len(countries)}")


if __name__ == "__main__":
    main()
