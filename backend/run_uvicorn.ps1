param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 8000
)
python -m uvicorn backend.main:app --host $Host --port $Port
