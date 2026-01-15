# 🔧 MCP Helper - Instalación y Uso

Workflow de n8n con webhooks para gestionar otros workflows desde Antigravity.

## 📦 Instalación

### Paso 1: Crear credencial de API

1. En n8n, ve a **Settings → Credentials**
2. Click **Add Credential**
3. Busca **Header Auth**
4. Configura:
   - **Name**: `N8N API Key`
   - **Header Name**: `X-N8N-API-KEY`
   - **Header Value**: Tu API Key de n8n

### Paso 2: Configurar variable de entorno

En n8n, ve a **Settings → Variables** y crea:

| Variable | Valor |
|----------|-------|
| `N8N_BASE_URL` | `https://dep-n8n.n8ntusaguacates.space` |

### Paso 3: Importar el workflow

1. En n8n, click **Import from file**
2. Selecciona `mcp-helper-workflow.json`
3. Asocia la credencial **N8N API Key** a todos los nodos HTTP

### Paso 4: Activar el workflow

Click **Activate** en la esquina superior derecha.

---

## 🌐 Endpoints Disponibles

Una vez activo, tendrás estos webhooks (URLs de producción):

| Endpoint | Método | URL |
|----------|--------|-----|
| **Listar** | GET | `https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/list` |
| **Obtener** | GET | `.../webhook/mcp-helper/get/{id}` |
| **Crear** | POST | `.../webhook/mcp-helper/create` |
| **Actualizar** | PUT | `.../webhook/mcp-helper/update/{id}` |
| **Activar** | POST | `.../webhook/mcp-helper/activate/{id}` |
| **Ejecutar** | POST | `.../webhook/mcp-helper/execute/{id}` |
| **Auditar** | GET | `.../webhook/mcp-helper/audit/{id}` |

---

## 🧪 Ejemplos de Uso

### Listar workflows
```bash
curl https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/list
```

### Obtener workflow específico
```bash
curl https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/get/abc123
```

### Auditar workflow
```bash
curl https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/audit/abc123
```

### Crear workflow
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo Workflow","nodes":[],"connections":{}}' \
  https://dep-n8n.n8ntusaguacates.space/webhook/mcp-helper/create
```

---

## 📊 Respuestas

### Lista de Workflows
```json
{
  "success": true,
  "count": 10,
  "active": 3,
  "inactive": 7,
  "workflows": [
    {"id": "abc123", "name": "Agente Luz v6", "active": true},
    ...
  ]
}
```

### Auditoría
```json
{
  "success": true,
  "audit": {
    "workflowId": "abc123",
    "name": "Agente Luz v6",
    "active": true,
    "totalNodes": 25,
    "triggers": [...],
    "aiNodes": [...],
    "warnings": ["⚠️ ..."],
    "recommendations": ["💡 ..."]
  }
}
```
