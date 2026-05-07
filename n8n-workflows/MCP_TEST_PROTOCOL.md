# MCP_TEST_PROTOCOL.md

## Objetivo
Hacer una prueba controlada y segura del MCP oficial de n8n sobre workflows LAB o no criticos.

## Reglas
- Usa MCP oficial de n8n como via principal.
- No edites workflows de produccion primero.
- Empieza con workflows LAB o de prueba.
- Antes de editar: inspecciona.
- Antes de guardar: valida.
- Si algo falla: investiga primero, luego reporta con causa probable y siguiente paso.

## Secuencia obligatoria
1. Usa search_workflows con una consulta como LAB o el nombre exacto.
2. Elige un workflow activo y no critico.
3. Usa get_workflow_details para leer nodos, conexiones y settings.
4. Explica en una frase que vas a cambiar y por que.
5. Si el cambio es seguro, usa update_workflow.
6. Usa validate_workflow despues del cambio.
7. Si hace falta, usa execute_workflow solo como prueba controlada.
8. Usa get_execution para revisar el resultado.
9. Reporta: workflow probado, cambio aplicado, validacion, resultado de ejecucion y riesgos detectados.

## Primera prueba recomendada
Haz la primera prueba con uno de estos workflows:
- LAB - Chatbot Completo
- ?? LABR - nuevo asistente (REPARADO)

## Tipo de cambio recomendado
Haz un cambio minimo y reversible, por ejemplo:
- actualizar descripcion del workflow,
- ajustar un texto de respuesta en un nodo de prueba,
- o corregir un detalle menor claramente identificable.

## Evita en esta prueba
- credenciales
- webhooks criticos de produccion
- cambios masivos
- borrar workflows
- despublicar workflows de negocio
