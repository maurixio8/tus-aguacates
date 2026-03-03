#!/usr/bin/env python3
"""
n8n Workflow Manager CLI
========================
Script para gestionar workflows de n8n vía API pública.

Uso:
    python n8n_manager.py list                      # Lista todos los workflows
    python n8n_manager.py get <id>                  # Obtiene JSON de un workflow
    python n8n_manager.py create <file.json>        # Crea workflow desde JSON
    python n8n_manager.py update <id> <file.json>   # Actualiza workflow existente
    python n8n_manager.py activate <id>             # Activa un workflow
    python n8n_manager.py deactivate <id>           # Desactiva un workflow
    python n8n_manager.py run_webhook <url> [data]  # Ejecuta vía webhook
    python n8n_manager.py audit <id>                # Audita lógica del workflow
    python n8n_manager.py export <id> <output.json> # Exporta workflow a archivo

Configuración:
    Variables de entorno o archivo .env.n8n:
    - N8N_BASE_URL: URL base de n8n (ej: https://dep-n8n.n8ntusaguacates.space)
    - N8N_API_KEY: API Key de n8n (formato JWT)
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import requests
    import urllib3

    # Ignorar advertencias de SSL
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except ImportError:
    print(
        "Error: Se requiere la librería 'requests'. Instala con: pip install requests"
    )
    sys.exit(1)

try:
    from dotenv import load_dotenv

    # Cargar .env.n8n si existe
    env_file = Path(__file__).parent / ".env.n8n"
    if env_file.exists():
        load_dotenv(env_file)
    else:
        # Intentar cargar .env genérico
        load_dotenv()
except ImportError:
    pass  # python-dotenv no instalado, usar solo variables de entorno


class N8NManager:
    """Cliente para la API pública de n8n."""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_url = f"{self.base_url}/api/v1"
        self.headers = {
            "X-N8N-API-KEY": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request(
        self, method: str, endpoint: str, data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Realiza una petición a la API."""
        url = f"{self.api_url}/{endpoint}"
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data,
                timeout=30,
                verify=False,
            )
            response.raise_for_status()
            return response.json() if response.text else {}
        except requests.exceptions.HTTPError as e:
            error_msg = f"Error HTTP {response.status_code}"
            try:
                error_data = response.json()
                if "message" in error_data:
                    error_msg += f": {error_data['message']}"
            except:
                error_msg += f": {response.text}"
            raise Exception(error_msg)
        except requests.exceptions.RequestException as e:
            raise Exception(f"Error de conexión: {e}")

    def list_workflows(self) -> list:
        """Lista todos los workflows."""
        result = self._request("GET", "workflows")
        return result.get("data", [])

    def get_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Obtiene un workflow por ID."""
        return self._request("GET", f"workflows/{workflow_id}")

    def create_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea un nuevo workflow."""
        return self._request("POST", "workflows", workflow_data)

    def update_workflow(
        self, workflow_id: str, workflow_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Actualiza un workflow existente."""
        return self._request("PUT", f"workflows/{workflow_id}", workflow_data)

    def activate_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Activa un workflow."""
        return self._request("POST", f"workflows/{workflow_id}/activate")

    def deactivate_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Desactiva un workflow."""
        return self._request("POST", f"workflows/{workflow_id}/deactivate")

    def delete_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Elimina un workflow."""
        return self._request("DELETE", f"workflows/{workflow_id}")

    def run_webhook(
        self, webhook_url: str, data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Ejecuta un workflow vía webhook."""
        try:
            response = requests.post(
                url=webhook_url,
                headers={"Content-Type": "application/json"},
                json=data or {},
                timeout=60,
            )
            response.raise_for_status()
            return response.json() if response.text else {"status": "success"}
        except requests.exceptions.RequestException as e:
            raise Exception(f"Error ejecutando webhook: {e}")

    def audit_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Audita la lógica de un workflow."""
        workflow = self.get_workflow(workflow_id)

        nodes = workflow.get("nodes", [])
        connections = workflow.get("connections", {})

        audit = {
            "workflow_id": workflow_id,
            "name": workflow.get("name", "Sin nombre"),
            "active": workflow.get("active", False),
            "total_nodes": len(nodes),
            "node_types": {},
            "triggers": [],
            "ai_nodes": [],
            "database_nodes": [],
            "http_nodes": [],
            "code_nodes": [],
            "warnings": [],
            "recommendations": [],
        }

        for node in nodes:
            node_type = node.get("type", "unknown")
            node_name = node.get("name", "Sin nombre")

            # Contar tipos de nodos
            audit["node_types"][node_type] = audit["node_types"].get(node_type, 0) + 1

            # Identificar triggers
            if "trigger" in node_type.lower() or "webhook" in node_type.lower():
                audit["triggers"].append({"name": node_name, "type": node_type})

            # Identificar nodos AI
            if any(
                ai in node_type.lower()
                for ai in ["openai", "langchain", "agent", "chat"]
            ):
                audit["ai_nodes"].append({"name": node_name, "type": node_type})

            # Identificar nodos de base de datos
            if any(
                db in node_type.lower()
                for db in ["postgres", "mysql", "supabase", "mongodb"]
            ):
                audit["database_nodes"].append({"name": node_name, "type": node_type})

            # Identificar nodos HTTP
            if "http" in node_type.lower():
                audit["http_nodes"].append({"name": node_name, "type": node_type})

            # Identificar nodos de código
            if "code" in node_type.lower() or "function" in node_type.lower():
                audit["code_nodes"].append({"name": node_name, "type": node_type})

        # Generar warnings y recomendaciones
        if len(audit["triggers"]) == 0:
            audit["warnings"].append(
                "⚠️ No se encontraron triggers. El workflow no puede iniciar automáticamente."
            )

        if len(audit["triggers"]) > 1:
            audit["warnings"].append(
                f"⚠️ Se encontraron {len(audit['triggers'])} triggers. Solo uno puede estar activo."
            )

        if len(audit["ai_nodes"]) > 0 and len(audit["database_nodes"]) == 0:
            audit["recommendations"].append(
                "💡 Considera agregar persistencia para conversaciones con nodos de base de datos."
            )

        if len(audit["code_nodes"]) > 3:
            audit["recommendations"].append(
                "💡 Muchos nodos de código. Considera modularizar en sub-workflows."
            )

        return audit


def print_json(data: Any, indent: int = 2):
    """Imprime datos en formato JSON."""
    print(json.dumps(data, indent=indent, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(
        description="n8n Workflow Manager CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")

    # Comando: list
    subparsers.add_parser("list", help="Lista todos los workflows")

    # Comando: get
    get_parser = subparsers.add_parser("get", help="Obtiene un workflow por ID")
    get_parser.add_argument("id", help="ID del workflow")

    # Comando: create
    create_parser = subparsers.add_parser(
        "create", help="Crea un workflow desde archivo JSON"
    )
    create_parser.add_argument("file", help="Archivo JSON del workflow")

    # Comando: update
    update_parser = subparsers.add_parser(
        "update", help="Actualiza un workflow existente"
    )
    update_parser.add_argument("id", help="ID del workflow")
    update_parser.add_argument("file", help="Archivo JSON con los cambios")

    # Comando: activate
    activate_parser = subparsers.add_parser("activate", help="Activa un workflow")
    activate_parser.add_argument("id", help="ID del workflow")

    # Comando: deactivate
    deactivate_parser = subparsers.add_parser(
        "deactivate", help="Desactiva un workflow"
    )
    deactivate_parser.add_argument("id", help="ID del workflow")

    # Comando: delete
    delete_parser = subparsers.add_parser("delete", help="Elimina un workflow")
    delete_parser.add_argument("id", help="ID del workflow")

    # Comando: run_webhook
    webhook_parser = subparsers.add_parser(
        "run_webhook", help="Ejecuta un workflow vía webhook"
    )
    webhook_parser.add_argument("url", help="URL del webhook")
    webhook_parser.add_argument(
        "--data", "-d", help="Datos JSON a enviar", default="{}"
    )

    # Comando: audit
    audit_parser = subparsers.add_parser(
        "audit", help="Audita la lógica de un workflow"
    )
    audit_parser.add_argument("id", help="ID del workflow")

    # Comando: export
    export_parser = subparsers.add_parser(
        "export", help="Exporta un workflow a archivo"
    )
    export_parser.add_argument("id", help="ID del workflow")
    export_parser.add_argument("output", help="Archivo de salida (.json)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Obtener credenciales
    base_url = os.getenv("N8N_BASE_URL")
    api_key = os.getenv("N8N_API_KEY")

    if not base_url or not api_key:
        print("Error: Se requieren las variables de entorno N8N_BASE_URL y N8N_API_KEY")
        print("Configura en .env.n8n o como variables de entorno del sistema")
        sys.exit(1)

    manager = N8NManager(base_url, api_key)

    try:
        if args.command == "list":
            workflows = manager.list_workflows()
            print(f"\n📋 {len(workflows)} workflows encontrados:\n")
            for wf in workflows:
                status = "🟢" if wf.get("active") else "⚪"
                print(f"  {status} [{wf['id']}] {wf['name']}")
            print()

        elif args.command == "get":
            workflow = manager.get_workflow(args.id)
            print_json(workflow)

        elif args.command == "create":
            with open(args.file, "r", encoding="utf-8") as f:
                workflow_data = json.load(f)
            result = manager.create_workflow(workflow_data)
            print(f"✅ Workflow creado con ID: {result.get('id')}")
            print_json(result)

        elif args.command == "update":
            with open(args.file, "r", encoding="utf-8") as f:
                workflow_data = json.load(f)
            result = manager.update_workflow(args.id, workflow_data)
            print(f"✅ Workflow {args.id} actualizado")
            print_json(result)

        elif args.command == "activate":
            result = manager.activate_workflow(args.id)
            print(f"✅ Workflow {args.id} activado")

        elif args.command == "deactivate":
            result = manager.deactivate_workflow(args.id)
            print(f"✅ Workflow {args.id} desactivado")

        elif args.command == "delete":
            result = manager.delete_workflow(args.id)
            print(f"✅ Workflow {args.id} eliminado")

        elif args.command == "run_webhook":
            data = json.loads(args.data) if args.data else {}
            result = manager.run_webhook(args.url, data)
            print(f"✅ Webhook ejecutado")
            print_json(result)

        elif args.command == "audit":
            audit = manager.audit_workflow(args.id)
            print(f"\n🔍 Auditoría: {audit['name']}\n")
            print(f"   ID: {audit['workflow_id']}")
            print(f"   Estado: {'🟢 Activo' if audit['active'] else '⚪ Inactivo'}")
            print(f"   Total nodos: {audit['total_nodes']}")

            print(f"\n📊 Tipos de nodos:")
            for node_type, count in audit["node_types"].items():
                print(f"   • {node_type}: {count}")

            if audit["triggers"]:
                print(f"\n🎯 Triggers ({len(audit['triggers'])}):")
                for t in audit["triggers"]:
                    print(f"   • {t['name']} ({t['type']})")

            if audit["ai_nodes"]:
                print(f"\n🤖 Nodos AI ({len(audit['ai_nodes'])}):")
                for n in audit["ai_nodes"]:
                    print(f"   • {n['name']} ({n['type']})")

            if audit["database_nodes"]:
                print(f"\n💾 Nodos de BD ({len(audit['database_nodes'])}):")
                for n in audit["database_nodes"]:
                    print(f"   • {n['name']} ({n['type']})")

            if audit["warnings"]:
                print(f"\n⚠️ Warnings:")
                for w in audit["warnings"]:
                    print(f"   {w}")

            if audit["recommendations"]:
                print(f"\n💡 Recomendaciones:")
                for r in audit["recommendations"]:
                    print(f"   {r}")

            print()

        elif args.command == "export":
            workflow = manager.get_workflow(args.id)
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(workflow, f, indent=2, ensure_ascii=False)
            print(f"✅ Workflow exportado a: {args.output}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
