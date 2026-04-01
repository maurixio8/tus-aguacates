{
    "problema": "El nodo '¿Viene del Buffer?' tiene una expresión incorrecta",
    "expresion_actual": "{{ $json.body?.fromBuffer || $json.fromBuffer || false }}",
    "expresion_correcta": "{{ $input.item.json.body?.fromBuffer || $input.item.json.fromBuffer || false }}",
    "explicacion": "json.body se refiere al objeto metadata del workflow completo (updatedAt, createdAt, etc.) y NO a los datos del mensaje del webhook. Se debe usar input.item.json.body para acceder a los datos del mensaje.",
    "nodo_a_corregir": "🔄 ¿Viene del Buffer? (ID: f326f549-376f-4f93-a537-4df7a25178e3)",
    "campo_a_cambiar": "leftValue de la condición del IF",
    "nuevo_valor": "{{ $input.item.json.body?.fromBuffer || $input.item.json.fromBuffer || false }}"
}
