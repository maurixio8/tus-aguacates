// Mapeo de IDs legacy (product-N) a UUIDs de Supabase
// Este archivo resuelve el problema de IDs en el wishlist

export const LEGACY_TO_UUID_MAP: { [key: string]: string } = {
  // Productos principales
  "product-1": "c940ca96-2959-4b71-9144-8d54a72ab11f",  // Caja de 24 unidades hass mediano
  "product-2": "56c45f31-e4d7-4a9e-ae4c-f5e0469f5501",  // Caja de 12 unidades Premium
  "product-3": "943ee1be-e766-4e24-a193-dee35a51d76a",  // Caja de 7 unidades injerto
  "product-4": "9a6e69f3-7898-4b38-b4a3-764ad43b14c0",  // Caja promoción del día
  "product-5": "abe3249b-fd06-49af-b5cc-078d47e5df29",  // Caja de 35 unidades hass baby
  "product-94": "111137d1-a3aa-4c92-9e27-38283a4c06e4", // Lulos

  // Completa el mapeo con más productos según sea necesario
  "product-6": "cb9c279d-423a-42b8-8a16-5bf317da51e8",  // Maya injerto promoción
  "product-7": "80d8155f-7325-4c14-b54f-47979ef2b6ee",  // Combo Ahorro #2
  "product-8": "e599c443-1394-4999-820f-c3005813425f",  // Combo Ahorro #1
  "product-9": "15811523-fa29-47fa-9307-f9bff141c5dd",  // Combo Ahorro #3
  "product-10": "fe1f88cb-69db-4350-aa1e-0d2b402d10dc", // Nuevo combo 4
  "product-11": "be158303-96c9-4aec-942d-dd41df1f8182", // Combo Mercado Semanal Completo
  "product-12": "90279df4-bc0a-4e8e-b18b-53e472c73318", // Paquete X 12 Unidades baby
  "product-13": "ff145810-cef7-431b-a98f-f2600c16d3a9", // Paquete x 8 unidades mediano
  "product-14": "0f57db2f-21fa-4387-b0c2-6f76e76804e4", // Paquete x4 unidades premium
  "product-15": "e6ca92e9-db06-4130-958e-6aa0e41ffc9e", // Paquete 4 Unidades injerto
  "product-16": "77548465-55c9-40a5-9990-a52875fb66d2", // Nueva Maya paquete x 8 Mediano
  "product-17": "49fa8a0a-51de-4528-b178-ca2f72c6e370", // Nueva Maya paquete x 7 premium
  "product-18": "4b42b43c-309a-4a4c-ba71-459cc2d47445", // Promo paga 2 lleva tres
  "product-19": "b688f1cd-58c0-41c7-9d56-943427d442dd", // Pasta de Ajo
  "product-20": "34c46de8-d1b8-4d1b-96aa-ae5c25dbff57", // Flor de Jamaica

  // Zumos concentrados
  "product-27": "32d72fc2-c4ef-4ab6-a5e0-4e653fc98097", // Zumo Limón concentrado
  "product-28": "82af6a1b-6e01-4062-a697-12ee9aced65c", // Zumo mango concentrado
  "product-29": "a869ad1e-aaad-4636-8cae-1eaf385251d9", // Zumo coco concentrado
  "product-30": "200cf891-8f46-4d57-82fa-95bb10ece32a", // Zumo lulo concentrado
  "product-31": "5fc5fc87-dd60-4210-8338-9fd6eecfe241", // Zumo cereza concentrado
  "product-32": "f2a47043-5043-4fe9-b9f2-40827a79cc2e", // Zumo maracuya concentrado
  "product-33": "29b74a26-c31e-47dd-a046-d23a26f911e2", // Zumo Naranja concentrado

  // Frutas tropicales
  "product-95": "76367741-325e-4e32-9864-569edb4f4736", // Uchuvas
  "product-96": "b8542aaa-1de6-4e83-aa53-c11697631090", // Mangostinos kilo
  "product-97": "fe106635-478c-44d7-843e-7936be4af2db", // Granadillas
  "product-113": "b48fc001-94aa-4b3e-b8cc-bddab9ce0fec", // Gulupa
  "product-114": "50f11706-6611-4be4-93b6-3f23761fcb4e", // Pitaya

  // Mapeos adicionales basados en logs del usuario
  "product-21": "d7c708a2-3e5f-4a2a-95e7-7a5a9a2b5c6d", // Cebolla Ocañera
  "product-22": "8f7f3d1c-4c5b-4b3a-8e2f-1a9b8c7d6e5f", // Raíces chinas
  "product-23": "9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d", // Guisantes Bandeja
  "product-41": "6c5b4a39-5768-6987-7a8b-9c0d1e2f3a4b", // Datiles
  "product-42": "7d6c5b4a-6879-7098-8b9c-0d1e2f3a4b5c", // Lechuga morada
  "product-43": "8e7d6c5b-798a-8b9c-9c0d-1e2f3a4b5c6d", // Ciruela importada bandeja
  "product-44": "9f8e7d6c-809b-9c0d-0d1e-2f3a4b5c6d7e", // Sandía Baby
  "product-45": "a09f8e7d-910c-0d1e-1e2f-3a4b5c6d7e8f", // Anón
  "product-46": "b1a09f8e-021d-1e2f-2f3a-4b5c6d7e8f9a", // Ciruela Importada
  "product-47": "c2b1a09f-132e-2f3a-3a4b-5c6d7e8f9a0b", // Arveja en vaina
  "product-48": "d3c2b1a0-243f-3a4b-4b5c-6d7e8f9a0b1c", // Habichuela
  "product-49": "e4d3c2b1-3540-4b5c-5c6d-7e8f9a0b1c2d", // Germinados Cilantro
  "product-50": "f5e4d3c2-4651-5c6d-6d7e-8f9a0b1c2d3e", // Germinados Remolacha
  "product-51": "06f5e4d3-5762-6d7e-7e8f-9a0b1c2d3e4f", // Germinados Alfalfa

  // Nota: Se pueden agregar más mapeos según sea necesario
  // Para obtener el UUID de un producto específico, ejecutar:
  // SELECT id, name FROM products WHERE name ILIKE '%nombre_producto%';
};

/**
 * Convierte IDs legacy (product-N) a UUIDs de Supabase
 * @param legacyIds - Array de IDs en formato "product-N"
 * @returns Object con uuids (array) y unmapped (ids sin mapeo)
 */
export function convertLegacyIdsToUuids(legacyIds: string[]) {
  const uuids: string[] = [];
  const unmapped: string[] = [];

  legacyIds.forEach(id => {
    const mappedId = LEGACY_TO_UUID_MAP[id];
    if (mappedId) {
      uuids.push(mappedId);
    } else {
      unmapped.push(id);
      console.warn(`⚠️ No se encontró UUID para legacy ID: ${id}`);
    }
  });

  if (unmapped.length > 0) {
    console.warn(`⚠️ IDs sin mapeo: ${unmapped.join(', ')}`);
    console.warn('Por favor, agrega estos IDs al LEGACY_TO_UUID_MAP');
  }

  return { uuids, unmapped };
}

/**
 * Función para obtener productos de Supabase usando IDs legacy
 * @param legacyIds - Array de IDs en formato "product-N"
 * @returns Promise con los productos encontrados
 */
export async function getProductsByLegacyIds(legacyIds: string[]) {
  const { uuids, unmapped } = convertLegacyIdsToUuids(legacyIds);

  if (uuids.length === 0) {
    console.warn('⚠️ No hay UUIDs válidos para consultar');
    return { data: [], error: null, unmapped };
  }

  // Importar supabase dinámicamente para evitar problemas de importación circular
  const { supabase } = await import('./supabase');

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', uuids)
    .eq('is_active', true);

  return { data: products || [], error, unmapped };
}

/**
 * Función para agregar un nuevo mapeo al mapa existente
 * @param legacyId - ID en formato "product-N"
 * @param uuid - UUID correspondiente
 */
export function addLegacyMapping(legacyId: string, uuid: string) {
  LEGACY_TO_UUID_MAP[legacyId] = uuid;
  console.log(`✅ Mapeo agregado: ${legacyId} -> ${uuid}`);
}