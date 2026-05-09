#!/bin/bash
# Pruebas de sincronización de direcciones — Tus Aguacates
# Ejecutar con: bash scripts/test-customer-address-sync.sh
# Requiere cookie de sesión admin

set -e

BASE_URL="https://tus-aguacates.vercel.app"
TEST_PHONE="573001234567"
TEST_NAME="Prueba Luz Sync"
TEST_ADDRESS="Calle 123 #45-67, Bogotá"

echo "=========================================="
echo "  Prueba: Sincronización de Direcciones"
echo "=========================================="
echo ""

if [ -z "$ADMIN_COOKIE" ]; then
  echo "⚠️  ADVERTENCIA: ADMIN_COOKIE no está seteada."
  echo "   Obtén tu cookie de sesión desde el navegador (F12 → Application → Cookies)"
  echo "   y ejecútalo así:"
  echo "   ADMIN_COOKIE='tu-cookie-aqui' bash scripts/test-customer-address-sync.sh"
  echo ""
fi

echo "1️⃣  Creando cliente de prueba..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/customers" \
  -H "Content-Type: application/json" \
  ${ADMIN_COOKIE:+-H "Cookie: $ADMIN_COOKIE"} \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"phone\": \"$TEST_PHONE\",
    \"address\": \"$TEST_ADDRESS\",
    \"city\": \"Bogotá\",
    \"neighborhood\": \"Chapinero\"
  }")

echo "   Respuesta: $CREATE_RESPONSE"
CUSTOMER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CUSTOMER_ID" ]; then
  echo "   ❌ Error al crear cliente. ¿Estás autenticado como admin?"
  exit 1
fi

echo "   ✅ Cliente creado: $CUSTOMER_ID"
echo ""

echo "2️⃣  Actualizando dirección..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/admin/customers?id=$CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  ${ADMIN_COOKIE:+-H "Cookie: $ADMIN_COOKIE"} \
  -d "{
    \"address\": \"Carrera 7 #89-10, Bogotá Actualizada\",
    \"city\": \"Bogotá\",
    \"neighborhood\": \"Teusaquillo\"
  }")

echo "   Respuesta: $UPDATE_RESPONSE"
echo ""

echo "3️⃣  Verificando tabla customers..."
GET_CUSTOMER=$(curl -s "$BASE_URL/api/admin/customers/?search=$TEST_PHONE&limit=1" \
  ${ADMIN_COOKIE:+-H "Cookie: $ADMIN_COOKIE"})

echo "   Respuesta: $GET_CUSTOMER"
echo ""

echo "=========================================="
echo "  Resultados:"
echo "=========================================="
echo ""
echo "Si todo salió bien, la dirección debería"
echo "verse actualizada en el admin y el checkout."
echo ""
echo "Prueba manual:"
echo "  1. Entra a /admin/clientes"
echo "  2. Busca: $TEST_NAME"
echo "  3. Verifica dirección: 'Carrera 7 #89-10'"
echo "  4. Si el cliente tiene cuenta, verifica"
echo "     que la dirección aparezca en el checkout"
echo ""
