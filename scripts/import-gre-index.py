"""Build an auxiliary index, never operational instructions, from the official GRE PDF."""
import hashlib
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

source = Path(sys.argv[1])
target = Path(__file__).resolve().parent.parent / "src" / "data" / "gre2024-index.json"
reader = PdfReader(source)
entries = []
for page_index in range(32, 93):
    current = None
    for line in reader.pages[page_index].extract_text().splitlines():
        line = line.strip()
        match = re.fullmatch(r"(\d{4})\s+(\d{3}P?)\s+(.+)", line)
        if match:
            if current:
                entries.append(current)
            current = {"id": match[1], "guide": match[2], "name": match[3], "pdfPage": page_index + 1}
        elif line.startswith("Página "):
            break
        elif current and line:
            current["name"] += " " + line
    if current:
        entries.append(current)
assert len(entries) > 2500, f"Incomplete index: {len(entries)}"
assert any(e["id"] == "1203" and e["guide"] == "128" for e in entries)
assert any(e["id"] == "1017" and e["guide"] == "124" for e in entries)
assert all(re.fullmatch(r"1\d{2}P?", e["guide"]) for e in entries)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps({
    "edition": "GRE 2024", "source": "https://tc.canada.ca/sites/default/files/2024-04/2024-guia-de-respuesta-en-caso-de-emergencia.pdf",
    "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "sourcePages": [33, 93],
    "notice": "Indice auxiliar extraido automaticamente. No conserva resaltados verdes ni reemplaza las advertencias y tablas del original. Verificar siempre la pagina fuente.",
    "entries": entries,
}, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
print(f"GRE: {len(entries)} entradas; {len({e['id'] for e in entries})} identificadores. SHA-256 del original registrado.")
