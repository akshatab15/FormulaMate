# Excel Formula Assistant

A local web application that helps you find, understand and learn Microsoft Excel
formulas by describing what you need in plain language. It uses **rule-based
keyword matching** against a predefined formula library - no AI service and no
internet connection are required for its core features.

> Example: type `Calculate the total of cells A1 to A10` and the assistant
> returns `=SUM(A1:A10)` with its syntax, explanation, example and related formulas.

![stack](https://img.shields.io/badge/backend-FastAPI-009688) ![stack](https://img.shields.io/badge/frontend-Vanilla%20JS-f7df1e) ![stack](https://img.shields.io/badge/tests-33%20passing-brightgreen)

---

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Welcome panel, formula search, category cards, recently viewed formulas and quick actions. |
| **Formula Assistant** | Natural-language matching (English, Hindi and Marathi keyword patterns) with syntax, explanation, example, confidence score, alternative matches and related formulas. Returns a clear "no match" message instead of guessing. |
| **Formula Library** | 79 predefined formulas across 8 categories, with search and category filters. |
| **Excel File Upload** | Analyses `.xlsx` and `.csv` files (headers, detected column types, preview table) and suggests relevant formulas. Files are processed in memory and never stored. |
| **Formula Playground** | Safe, simulated calculations for supported formulas - clearly labelled as simulations, with no `eval()` anywhere. |
| **Compare Formulas** | Seven curated comparisons (e.g. VLOOKUP vs INDEX/MATCH) plus a generated comparison table for any other pair. |
| **Favorites** | Save formulas and persist them in `localStorage` with a helpful empty state. |
| **Templates** | Ready-made sheets for sales reports, attendance, marksheets, expenses, inventory, payroll, invoicing and gradebooks. |
| **Community** | A **local** library of tips and examples; you can add your own tips saved only in your browser. Not an online community. |
| **Help & About** | Usage guide, supported features, limitations and troubleshooting. |

## Technology stack

- **Backend:** Python, FastAPI, Uvicorn, Pydantic, openpyxl
- **Frontend:** HTML5, CSS3, vanilla JavaScript (no framework, no build step)
- **Storage:** JSON data files + browser `localStorage` for favorites/recent items

---

## Project structure

```
excel-formula-assistant/
├── app/
│   ├── main.py                 # FastAPI app, static + template wiring
│   ├── api/                    # Route modules: health, formulas, assistant, files
│   ├── services/               # Business logic: matcher, formulas, files, compare, playground
│   ├── models/schemas.py       # Pydantic request/response models
│   ├── data/                   # formulas.json, rules.json, comparisons, templates, community
│   ├── templates/index.html    # Single-page application shell
│   └── static/
│       ├── css/styles.css
│       ├── js/ (api, store, ui, pages, app)
│       └── assets/logo.svg
├── tests/                      # test_matcher.py, test_api.py
├── requirements.txt
├── pytest.ini
├── .env.example
├── .gitignore
└── README.md
```

## Setup

Requires **Python 3.10+** (developed on Python 3.13).

```powershell
# 1. From the project folder
cd excel-formula-assistant

# 2. Create and activate a virtual environment (recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
python -m uvicorn app.main:app --reload
```

Then open **http://127.0.0.1:8000** in your browser.

Interactive API documentation is available at **http://127.0.0.1:8000/docs**.

## Running the tests

```powershell
python -m pytest
```

Expected: `33 passed`. The suite covers rule-based matching (including Hindi and
Marathi keyword cases, no-match behaviour) and every API endpoint, including
CSV/XLSX upload validation.

---

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service status, version and formula count. |
| `GET` | `/api/formulas` | All formulas (optional `?category=` filter). |
| `GET` | `/api/formulas/{formula_id}` | A single formula by id. |
| `GET` | `/api/categories` | The eight formula categories. |
| `GET` | `/api/comparisons` | Predefined formula comparisons. |
| `GET` | `/api/templates` | Template examples. |
| `GET` | `/api/community` | Local example library. |
| `POST` | `/api/assistant/search` | Match a natural-language question. |
| `POST` | `/api/assistant/compare` | Compare two formulas. |
| `GET` | `/api/playground/formulas` | Formulas supported by the playground. |
| `POST` | `/api/assistant/playground` | Run a safe simulated calculation. |
| `POST` | `/api/files/analyze` | Validate and analyse an uploaded `.xlsx`/`.csv` file. |

Example request:

```bash
curl -X POST http://127.0.0.1:8000/api/assistant/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"total of A1 to A10\"}"
```

---

## How formula matching works

1. The question is normalised (lower-cased, whitespace collapsed).
2. Keyword rules in `app/data/rules.json` are scored by phrase length, so longer
   phrases like `count how many` weigh more than a single word.
3. An exact formula-name mention (e.g. `VLOOKUP`) or a call such as `SUM(` adds a
   strong boost; common English words that are also formula names (`product`,
   `count`, `if`) are deliberately down-weighted.
4. Scores are converted to a confidence value. If the best confidence is below
   `min_confidence` (0.45), the assistant reports **no confident match** and does
   not invent a formula.

Multilingual support is keyword-based: English, Hindi (Devanagari) and
Marathi/transliterated keywords are all defined in `rules.json` and each
formula's `keywords` list.

## Upload safety

- Only `.xlsx` and `.csv` up to **5 MB** are accepted; other types return `415`.
- Workbooks are opened read-only with `data_only=True`; **macros and formulas are
  never executed**.
- Uploaded content is held in memory for the request and never written to disk.

## Limitations

- Matching is deterministic and rule-based; it is not an AI model and will not
  understand every phrasing.
- Playground results are **simulated in Python** for learning purposes and are not
  produced by Microsoft Excel.
- No authentication, database or shared online community.
- `XLOOKUP`/`XMATCH`/`IFS`/`TEXTJOIN` require newer Excel versions; the library
  notes version availability in the comparison pages.
- `localStorage` data (favorites, recent items, local tips) is per-browser.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Could not load data from the server" | Start the backend: `python -m uvicorn app.main:app --reload`, then refresh. |
| Assistant returns no match | Rephrase with clearer keywords or include the formula name, e.g. `SUM of A1:A10`. |
| Upload rejected | Only `.xlsx`/`.csv` up to 5 MB; password-protected or corrupt workbooks cannot be read. |
| Suggestions look generic | Ensure row 1 has clear headers such as `Date`, `Amount`, `Region`, `Status`. |
| Favorites disappeared | They live in this browser's `localStorage`; clearing site data removes them. |
| Port already in use | Run with a different port: `python -m uvicorn app.main:app --port 8010`. |

## License

Built as a learning / college project. Free to use and modify.
