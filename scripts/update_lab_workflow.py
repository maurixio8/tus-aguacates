import json
import requests
import os

os.chdir("n8n-workflows")

# Leer el payload
with open("lab-payload.json", "r", encoding="utf-8") as f:
    payload = json.load(f)

# Usar requests directamente
headers = {
    "X-N8N-API-KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OWY1MzMxNi1mMTJhLTRiNDktYWUxOC0xMzAxZjI5YjA4YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzAyMDAyOTQtM2M2YS00MWFmLTkzZTItOTE0NjA4YTVhYmM4IiwiaWF0IjoxNzcxNTI1MDY2fQ.e4J5pyoIHZs7hK3Q815uNj4sFeEd8rIVjxSQRunNrFA",
    "Content-Type": "application/json",
}

response = requests.put(
    "https://n8n.tusaguacates.com/api/v1/workflows/sNeOUViiSYyROtea",
    json=payload,
    headers=headers,
    verify=False,
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
