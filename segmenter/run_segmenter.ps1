$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$env:PYTHONPATH = "$workspaceRoot\.segmenter-packages;$workspaceRoot"

if (-not $env:SAM2_CHECKPOINT) {
  $defaultCheckpoint = Join-Path $workspaceRoot "checkpoints\sam2.1_hiera_tiny.pt"
  if (Test-Path $defaultCheckpoint) {
    $env:SAM2_CHECKPOINT = $defaultCheckpoint
  }
}

if (-not $env:SAM2_MODEL_CONFIG) {
  $env:SAM2_MODEL_CONFIG = "configs/sam2.1/sam2.1_hiera_t.yaml"
}

if (-not $env:SAM2_DEVICE) {
  $env:SAM2_DEVICE = "cuda"
}

python -m uvicorn segmenter.main:app --host 127.0.0.1 --port 8001 --reload
