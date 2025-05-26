# Dona Durian Ripeness Classification

This repository contains the code, data, and notebooks used to develop a **non‑destructive machine‑learning model** for classifying the ripeness of Dona durians based on knock‑sound recordings.

---

## 📁 Repository Structure

```plaintext
AUDIO_DATA/            # Original WAV recordings and precomputed spectrograms
clean/AUDIO_DATA/      # Cleaned audio dataset and processing notebook
data_preparation/      # Scripts and utilities for data ingestion and preprocessing
src/                   # Core Python modules (feature extraction, model definition)
clean_dataset.ipynb    # Jupyter notebook: end‑to‑end data cleaning and MFCC pipeline
pyproject.toml         # Poetry project configuration (dependencies, scripts)
poetry.lock            # Locked dependency versions
python-version         # Pin the Python interpreter version
README.md              # This file
```

---

## ⚙️ Installation & Setup

This project uses **Poetry** for dependency and environment management:

1. **Install Poetry** (if not already):

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. **Clone this repo** and enter its directory:

   ```bash
   git clone https://github.com/tom-toupence/durian-maturity-classification.git
   cd durian-maturity-classification
   ```

3. **Install dependencies**:

   ```bash
   poetry install
   ```

4. **Activate the virtual environment**:

   ```bash
   poetry shell
   ```

5. **Verify Python version** matches `.python-version` (e.g. `3.12.x`).

---


## 📄 License

This project is released under the DNIIT.

---

*Developed by Antoine‑MR, tom-toupence and Dalvii*
