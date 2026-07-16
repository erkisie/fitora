Set-Location $PSScriptRoot
if (-not (Test-Path ".venv")) {
    py -m venv .venv
}
& ".\.venv\Scripts\Activate.ps1"
python -m pip install -r requirements.txt
fastapi dev main.py
