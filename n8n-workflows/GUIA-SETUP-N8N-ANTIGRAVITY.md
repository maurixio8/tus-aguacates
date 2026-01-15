# Guía de Setup: N8N + Antigravity

Configuración end-to-end para gestionar workflows de n8n desde Antigravity.

## Pre-requisitos

### 1. Node.js (para supergateway)

```powershell
# Verificar si Node.js está instalado
node --version

# Si no está instalado, descargar desde:
# https://nodejs.org/en/download/
# O usar winget:
winget install OpenJS.NodeJS.LTS
```

### 2. Python 3.8+ (para el CLI)

```powershell
# Verificar Python
python --version

# Instalar dependencias
pip install requests python-dotenv
```

---

## Configuración de Antigravity

### Paso 1: Abrir configuración MCP

1. En VS Code, abrir **Command Palette** (`Ctrl+Shift+P`)
2. Buscar: `Antigravity: Open MCP Configuration`
3. O editar directamente el archivo de configuración MCP

### Paso 2: Agregar servidor n8n-mcp

Pegar el contenido de `antigravity_config.json`:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://dep-n8n.n8ntusaguacates.space/mcp-server/http",
        "--header",
        "authorization:Bearer <TU_TOKEN_MCP>"
      ]
    }
  }
}
```

### Paso 3: Reiniciar Antigravity

Cerrar y abrir VS Code para que cargue la nueva configuración.

---

## Configuración del CLI Python

### Paso 1: Crear archivo de credenciales

```powershell
cd "c:\Users\Usuario\Documents\proyecto tienda\tus-aguacates\scripts"

# Crear .env.n8n con tus credenciales
@"
N8N_BASE_URL=https://dep-n8n.n8ntusaguacates.space
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OWY1MzMxNi1mMTJhLTRiNDktYWUxOC0xMzAxZjI5YjA4YzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3Nzk3Mjc1LCJleHAiOjE3NzI5NDYwMDB9.kSB44kJEE4ayxyJMvw7Nh53yi57HAv5M0Lo8rNMc4Q0
"@ | Out-File -FilePath .env.n8n -Encoding utf8
```

### Paso 2: Probar conexión

```powershell
python n8n_manager.py list
```

Deberías ver una lista de tus workflows:

```
📋 5 workflows encontrados:

  🟢 [abc123] Agente Luz v6
  ⚪ [def456] Copiloto de Operaciones
  ...
```

---

## Verificar Conexión MCP

### Desde Antigravity

Una vez configurado, Antigravity puede usar el servidor MCP. Prueba pidiendo:

> "Lista los recursos disponibles del servidor n8n-mcp"

Si la conexión es exitosa, verás los workflows y recursos expuestos por n8n.

### Troubleshooting

| Problema | Solución |
|----------|----------|
| `server name n8n-mcp not found` | Reiniciar VS Code después de editar la config |
| `npx not found` | Instalar Node.js y reiniciar terminal |
| Error de autenticación | Verificar que el token MCP sea correcto |
| Timeout de conexión | Verificar que n8n esté accesible desde tu red |

---

## Comandos del CLI

| Comando | Descripción |
|---------|-------------|
| `python n8n_manager.py list` | Lista workflows |
| `python n8n_manager.py get <id>` | Obtiene JSON de workflow |
| `python n8n_manager.py create <file.json>` | Crea workflow |
| `python n8n_manager.py update <id> <file.json>` | Actualiza workflow |
| `python n8n_manager.py activate <id>` | Activa workflow |
| `python n8n_manager.py deactivate <id>` | Desactiva workflow |
| `python n8n_manager.py audit <id>` | Analiza lógica del workflow |
| `python n8n_manager.py export <id> <out.json>` | Exporta a archivo |
| `python n8n_manager.py run_webhook <url>` | Ejecuta via webhook |

---

## Tokens y Seguridad

> ⚠️ **IMPORTANTE**: No commitear tokens a Git

- El token MCP (`authorization:Bearer ...`) es diferente al API Key
- Agregar `.env.n8n` a `.gitignore`
- Los tokens tienen fecha de expiración, renovar si es necesario

### Ubicación de tokens en n8n

1. **API Key** (para CLI): Settings > API > Create API Key
2. **MCP Token** (para Antigravity): Settings > MCP > Generate Token

---

## Archivos Creados

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `antigravity_config.json` | `n8n-workflows/` | Config MCP para Antigravity |
| `n8n_manager.py` | `scripts/` | CLI Python para API |
| `env.n8n.example` | `n8n-workflows/` | Plantilla de credenciales |
