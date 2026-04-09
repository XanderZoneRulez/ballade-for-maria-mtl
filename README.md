# Ballade for Maria Translation Workflow

A workflow for translating Ballade for Maria PC-98 game scripts from Japanese to English.

## Quick Start

### 1. Install Requirements

Download and install [Bun](https://bun.sh/docs/installation#windows) (required for running TypeScript scripts).

### 2. Install Dependencies

Open this folder in terminal and run:
```sh
bun install
```

### 3. Run the Tool

Double-click `Workflow.bat` to launch the interactive menu

## File Structure

```
data/
├── JP MES/                   # Original Japanese MES files (from game)
├── JP RKT/                   # Decompiled Japanese scripts (Racket format)
├── JP JSON/                  # Extracted Japanese text (JSON format)
├── EN JSON/                  # English translations (JSON format)
├── EN RKT/                   # Injected English scripts (Racket format)
└── EN MES/                   # Compiled English MES files (for game)
Maria(EN).hdi                 # Game HDI file (output)
Workflow.bat                  # Interactive menu
```

## Workflow
Double-click `Workflow.bat` to launch the interactive menu.

The translation process follows these steps:

```
JP MES → JP RKT → JP JSON → EN JSON → EN RKT → EN MES → HDI
  ↓         ↓         ↓         ↓         ↓         ↓
decompile extract translate  insert  compile   import
```

### Step 1: Prepare for Translation

1. **[d] Decompile Japanese MES files**
   - Decompresses original game scripts from `data/JP MES/` to `data/JP RKT/`
   - Converts MES format to readable Racket format

2. **[e] Extract Japanese text**
   - Extracts all Japanese text from RKT files to JSON format
   - Outputs to `data/JP JSON/` directory
   - Each RKT file generates a corresponding JSON file

### Step 2: Translate

3. **Translate the JSON files**
   - Open JSON files in `data/JP JSON/` with your preferred text editor
   - Translate the `message` fields (and `name` fields if present)
   - Save translated files to `data/EN JSON/` directory
   - Maintain the same file names and JSON structure

### Step 3: Build and Import
4. Run **[a] All** to complete the entire process, which equals to:

    4.1. **[i] Insert English text**
   - Injects English translations from JSON into RKT files
   - Reads from `data/EN JSON/` and outputs to `data/EN RKT/`
   - Changes function names from `text` to `str` for translated text

    4.2. **[c] Compile English MES files**
   - Compiles RKT files back to MES format
   - Reads from `data/EN RKT/` and outputs to `data/EN MES/`

    4.3. **[h] Import MES files to HDI image**
   - Imports compiled MES files into the game HDI image
   - Updates `Maria(EN).hdi` with translated files
