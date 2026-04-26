import { NextRequest, NextResponse } from 'next/server';
import { findExistingCustomerByPhones, getComparablePhone, normalizePhoneForDB, upsertCustomerMasterRecord } from '@/lib/customerSync';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Normalizar teléfono a formato 57XXXXXXXXXX para sync con n8n
const normalizePhone = (phone: string): string => {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) {
    return '57' + digits;
  }
  if (digits.length === 12 && digits.startsWith('57')) {
    return digits;
  }
  return digits.startsWith('57') ? digits : '57' + digits;
};

// Normalizar texto para búsqueda (quitar acentos, espacios extra, etc)
const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, ' ')
    .trim();
};

const buildPhoneCandidates = (...phones: Array<string | null | undefined>): string[] => {
  const candidates = new Set<string>();

  phones.forEach((phone) => {
    if (!phone) return;

    const digits = phone.replace(/\D/g, '');
    const normalized = normalizePhone(phone);

    if (digits) candidates.add(digits);
    if (normalized) {
      candidates.add(normalized);
      const last10 = normalized.slice(-10);
      if (last10) candidates.add(last10);
    }
  });

  return Array.from(candidates);
};

const isActiveGuestOrderStatus = (status?: string | null): boolean => {
  const normalized = normalizeText(status || '');
  return !['cancelado', 'cancelled', 'entregado', 'delivered', 'completado', 'completed'].includes(normalized);
};

const syncGuestOrdersForCustomer = async (
  supabase: any,
  payload: {
    phones: Array<string | null | undefined>;
    name?: string | null;
    email?: string | null;
    address?: string | null;
  }
) => {
  const phoneCandidates = buildPhoneCandidates(...payload.phones);
  if (phoneCandidates.length === 0) return 0;

  const { data: guestOrders, error: guestOrdersError } = await supabase
    .from('guest_orders')
    .select('id, guest_phone, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (guestOrdersError) {
    console.error('Error consultando guest_orders para sincronizar cliente:', guestOrdersError);
    return 0;
  }

  const matchingIds = (guestOrders || [])
    .filter((order: any) => {
      if (!isActiveGuestOrderStatus(order.status)) return false;

      const normalizedStoredPhone = normalizePhone(order.guest_phone || '');
      const storedLast10 = normalizedStoredPhone.slice(-10);

      return phoneCandidates.includes(normalizedStoredPhone) || phoneCandidates.includes(storedLast10);
    })
    .map((order: any) => order.id);

  if (matchingIds.length === 0) return 0;

  const primaryPhone = payload.phones.find((phone) => !!phone);
  const updateData: Record<string, any> = {};

  if (payload.name !== undefined) updateData.guest_name = payload.name || null;
  if (payload.email !== undefined) updateData.guest_email = payload.email || null;
  if (payload.address !== undefined) updateData.guest_address = payload.address || null;
  if (primaryPhone) updateData.guest_phone = normalizePhone(primaryPhone);

  const { error: syncError } = await supabase
    .from('guest_orders')
    .update(updateData)
    .in('id', matchingIds);

  if (syncError) {
    console.error('Error sincronizando guest_orders con datos del cliente:', syncError);
    return 0;
  }

  return matchingIds.length;
};

// Calcular score de relevancia para búsqueda inteligente
interface CustomerForSearch {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const calculateSearchScore = (customer: CustomerForSearch, searchTerms: string[]): number => {
  let score = 0;

  const name = normalizeText(customer.name || '');
  const phone = (customer.phone || '').replace(/\D/g, '');
  const email = normalizeText(customer.email || '');
  const address = normalizeText(customer.address || '');

  for (const term of searchTerms) {
    const normalizedTerm = normalizeText(term);
    const digitsTerm = term.replace(/\D/g, '');

    // ===== BÚSQUEDA POR NOMBRE =====
    // Coincidencia exacta del nombre completo (máximo score)
    if (name === normalizedTerm) {
      score += 100;
    }
    // Nombre empieza con el término (ej: "Juan" empieza con "Jua")
    else if (name.startsWith(normalizedTerm)) {
      score += 80;
    }
    // Alguna palabra del nombre empieza con el término
    else {
      const nameWords = name.split(' ');
      for (const word of nameWords) {
        if (word === normalizedTerm) {
          score += 70; // Palabra exacta
        } else if (word.startsWith(normalizedTerm)) {
          score += 50; // Palabra empieza con término
        } else if (word.includes(normalizedTerm) && normalizedTerm.length >= 3) {
          score += 30; // Contiene término (mínimo 3 caracteres)
        }
      }
    }

    // ===== BÚSQUEDA POR TELÉFONO =====
    if (digitsTerm.length >= 3) {
      // Teléfono exacto
      if (phone === digitsTerm || phone.endsWith(digitsTerm)) {
        score += 100;
      }
      // Últimos dígitos coinciden (útil para buscar por los últimos 4 o más números)
      else if (phone.includes(digitsTerm)) {
        score += 70;
      }
      // Los dígitos están en el teléfono normalizado
      else {
        const phoneWithoutCountry = phone.startsWith('57') ? phone.slice(2) : phone;
        if (phoneWithoutCountry.startsWith(digitsTerm) || phoneWithoutCountry.includes(digitsTerm)) {
          score += 60;
        }
      }
    }

    // ===== BÚSQUEDA POR EMAIL =====
    if (email && normalizedTerm.length >= 3) {
      if (email.includes(normalizedTerm)) {
        score += 40;
      }
    }

    // ===== BÚSQUEDA POR DIRECCIÓN =====
    if (address && normalizedTerm.length >= 3) {
      if (address.includes(normalizedTerm)) {
        score += 20;
      }
    }
  }

  return score;
};

// Clasificar cliente por comportamiento (RFM) y nivel de fidelidad
interface CustomerClassification {
  segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'inactive' | 'new';
  segmentLabel: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  tierLabel: string;
}

const calculateCustomerClassification = (totalOrders: number, totalSpent: number, lastOrderDate?: string): CustomerClassification => {
  const now = new Date();
  const lastOrder = lastOrderDate ? new Date(lastOrderDate) : null;
  const daysSinceLast = lastOrder ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  let segment: CustomerClassification['segment'] = 'new';
  let tier: CustomerClassification['tier'] = 'bronze';

  // Determinar Nivel (Tier) por Gasto Total
  if (totalSpent >= 1000000) tier = 'platinum';
  else if (totalSpent >= 500000) tier = 'gold';
  else if (totalSpent >= 200000) tier = 'silver';
  else tier = 'bronze';

  // Determinar Segmento (RFM)
  if (totalOrders >= 5 && totalSpent >= 500000 && daysSinceLast <= 7) {
    segment = 'champion';
  } else if (totalOrders >= 3 && daysSinceLast <= 15) {
    segment = 'loyal';
  } else if (daysSinceLast <= 7) {
    segment = 'potential';
  } else if (totalOrders >= 2 && daysSinceLast > 15 && daysSinceLast <= 30) {
    segment = 'at_risk';
  } else if (daysSinceLast > 30) {
    segment = 'inactive';
  } else if (totalOrders === 1) {
    segment = 'new';
  }

  const segmentLabels = {
    champion: 'Campeón 🏆',
    loyal: 'Fiel ✅',
    potential: 'Potencial ⭐',
    at_risk: 'En Riesgo ⚠️',
    inactive: 'Inactivo 💤',
    new: 'Nuevo 🌱'
  };

  const tierLabels = {
    platinum: 'Platino',
    gold: 'Oro',
    silver: 'Plata',
    bronze: 'Bronce'
  };

  return {
    segment,
    segmentLabel: segmentLabels[segment],
    tier,
    tierLabel: tierLabels[tier]
  };
};

// GET - Listar clientes con búsqueda y paginación
// Ahora lee de TODAS las fuentes: customers, profiles, y guest_orders
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const source = searchParams.get('source') || 'all'; // 'all', 'customers', 'profiles', 'guests'

    const supabase = createSupabaseClient();

    let allCustomers: any[] = [];
    const phonesSeen = new Set<string>();

    // ========================================
    // 1. FUENTE PRINCIPAL: Tabla customers
    // ========================================
    if (source === 'all' || source === 'customers') {
      // Supabase limita a 1000 por defecto, necesitamos cargar todos
      // Usamos paginación interna para cargar todos los registros
      let allCustomersData: any[] = [];
      let hasMore = true;
      let offset = 0;
      const batchSize = 1000;

      while (hasMore) {
        let customersQuery = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .range(offset, offset + batchSize - 1);

        // Búsqueda (solo en la primera consulta para obtener IDs filtrados)
        if (search) {
          customersQuery = customersQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: customersData, error: customersError, count } = await customersQuery;

        if (customersError) {
          console.log('⚠️ Tabla customers no existe o error:', customersError.message);
          hasMore = false;
        } else if (customersData && customersData.length > 0) {
          allCustomersData = [...allCustomersData, ...customersData];
          offset += batchSize;
          // Si obtuvimos menos registros que el batch, ya no hay más
          hasMore = customersData.length === batchSize;
          console.log(`📊 Cargados ${allCustomersData.length} clientes de ${count || '?'} total`);
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total encontrados: ${allCustomersData.length} clientes en tabla customers`);

      for (const customer of allCustomersData) {
        const phoneKey = getComparablePhone(customer.phone || '');
        if (phoneKey && !phonesSeen.has(phoneKey)) {
          const classification = calculateCustomerClassification(
            customer.total_orders || 0,
            parseFloat(customer.total_spent) || 0,
            customer.last_order_date
          );

          phonesSeen.add(phoneKey);
          allCustomers.push({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
            address: customer.address,
            neighborhood: customer.neighborhood,
            city: customer.city || 'Bogotá',
            notes: customer.notes,
            total_orders: customer.total_orders || 0,
            total_spent: parseFloat(customer.total_spent) || 0,
            last_order_date: customer.last_order_date,
            is_active: customer.is_active !== false,
            created_at: customer.created_at,
            is_guest: false,
            source: 'customers',
            ...classification
          });
        }
      }
    }

    // ========================================
    // 2. FUENTE SECUNDARIA: Tabla profiles (usuarios registrados)
    // ========================================
    if (source === 'all' || source === 'profiles') {
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

      if (search) {
        profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data: profilesData, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.log('⚠️ Error en profiles:', profilesError.message);
      } else if (profilesData) {
        console.log(`✅ Encontrados ${profilesData.length} perfiles registrados`);

        for (const profile of profilesData) {
          const phoneKey = getComparablePhone(profile.phone || '');

          // Solo agregar si no existe ya (por teléfono)
          if (!phoneKey || !phonesSeen.has(phoneKey)) {
            if (phoneKey) phonesSeen.add(phoneKey);

            // Obtener estadísticas de pedidos
            const { data: orders } = await supabase
              .from('orders')
              .select('total, created_at')
              .eq('user_id', profile.id);

            const totalOrders = orders?.length || 0;
            const totalSpent = orders?.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0) || 0;
            const lastOrderDate = orders?.[0]?.created_at || null;

            // Obtener email de auth.users
            let email = null;
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
              email = authUser?.user?.email || null;
            } catch (e) {
              // Ignorar errores de auth
            }

            // Obtener dirección
            const { data: addresses } = await supabase
              .from('addresses')
              .select('street_address, city, neighborhood')
              .eq('user_id', profile.id)
              .eq('is_default', true)
              .limit(1);

            const classification = calculateCustomerClassification(totalOrders, totalSpent, lastOrderDate);

            allCustomers.push({
              id: profile.id,
              name: profile.full_name || 'Sin nombre',
              phone: profile.phone || 'Sin teléfono',
              email: email,
              address: addresses?.[0]?.street_address || null,
              neighborhood: addresses?.[0]?.neighborhood || null,
              city: addresses?.[0]?.city || 'Bogotá',
              notes: null,
              total_orders: totalOrders,
              total_spent: totalSpent,
              last_order_date: lastOrderDate,
              is_active: true,
              created_at: profile.created_at,
              is_guest: false,
              source: 'profiles',
              ...classification
            });
          }
        }
      }
    }

    // ========================================
    // 3. FUENTE TERCIARIA: guest_orders (clientes invitados)
    // ========================================
    if (source === 'all' || source === 'guests') {
      const { data: guestOrders, error: guestError } = await supabase
        .from('guest_orders')
        .select('guest_name, guest_email, guest_phone, guest_address, total_amount, created_at')
        .order('created_at', { ascending: false });

      if (guestError) {
        console.log('⚠️ Error en guest_orders:', guestError.message);
      } else if (guestOrders) {
        console.log(`✅ Encontrados ${guestOrders.length} pedidos de invitados`);

        // Agrupar por teléfono
        const guestMap = new Map<string, any>();

        for (const order of guestOrders) {
          const phoneKey = getComparablePhone(order.guest_phone || '');
          if (!phoneKey) continue;

          // Solo procesar si no existe en otras fuentes
          if (phonesSeen.has(phoneKey)) continue;

          if (!guestMap.has(phoneKey)) {
            guestMap.set(phoneKey, {
              name: order.guest_name,
              phone: order.guest_phone,
              email: order.guest_email,
              address: order.guest_address,
              orders: [],
              created_at: order.created_at
            });
          }

          guestMap.get(phoneKey).orders.push({
            total: parseFloat(order.total_amount) || 0,
            created_at: order.created_at
          });
        }

        // Convertir a array
        for (const [phoneKey, guest] of guestMap) {
          phonesSeen.add(phoneKey);

          const totalSpent = guest.orders.reduce((sum: number, o: any) => sum + o.total, 0);
          const totalOrders = guest.orders.length;
          const lastOrderDate = guest.orders[0]?.created_at || null;
          const classification = calculateCustomerClassification(totalOrders, totalSpent, lastOrderDate);

          allCustomers.push({
            id: `guest-${guest.phone}`,
            name: guest.name,
            phone: guest.phone,
            email: guest.email || null,
            address: guest.address,
            neighborhood: null,
            city: 'Bogotá',
            notes: 'Cliente invitado (sin cuenta)',
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate,
            is_active: true,
            created_at: guest.created_at,
            is_guest: true,
            source: 'guest_orders',
            ...classification
          });
        }
      }
    }

    // ========================================
    // 4. FILTRAR Y ORDENAR (BÚSQUEDA INTELIGENTE)
    // ========================================

    // Aplicar búsqueda inteligente con scoring
    if (search) {
      // Dividir la búsqueda en términos (permite buscar "Garcia Juan" para encontrar "Juan Garcia")
      const searchTerms = search.trim().split(/\s+/).filter(t => t.length > 0);

      // Calcular score para cada cliente
      const scoredCustomers = allCustomers.map(customer => ({
        ...customer,
        searchScore: calculateSearchScore(customer, searchTerms)
      }));

      // Filtrar solo los que tienen algún match (score > 0)
      allCustomers = scoredCustomers
        .filter(c => c.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore); // Ordenar por relevancia

      console.log(`🔍 Búsqueda "${search}": ${allCustomers.length} resultados con score > 0`);
    } else {
      // Sin búsqueda, ordenar por el campo especificado
      allCustomers.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === 'total_spent' || sortBy === 'total_orders') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Total antes de paginar
    const total = allCustomers.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = allCustomers.slice(startIndex, startIndex + limit);

    console.log(`📊 Total clientes encontrados: ${total} (mostrando página ${page}, ${paginatedCustomers.length} items)`);

    return NextResponse.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      sources: {
        customers: allCustomers.filter(c => c.source === 'customers').length,
        profiles: allCustomers.filter(c => c.source === 'profiles').length,
        guests: allCustomers.filter(c => c.source === 'guest_orders').length
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente (crear usuario en auth y perfil)
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Normalizar teléfono antes de cualquier operación
    const normPhone = body.phone ? normalizePhoneForDB(body.phone) : null;

    const existingCustomer = await findExistingCustomerByPhones(supabase, [body.phone, normPhone]);

    if (existingCustomer) {
      return NextResponse.json(
        { error: `Ya existe un cliente con ese teléfono: ${existingCustomer.name}`, existingCustomer },
        { status: 409 }
      );
    }

    // Crear cliente en la tabla customers con teléfono normalizado
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        phone: normPhone || normalizePhone(body.phone),
        email: body.email || null,
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        city: body.city || 'Bogotá',
        notes: body.notes || null,
        total_orders: 0,
        total_spent: 0,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Error al crear cliente', details: insertError.message },
        { status: 500 }
      );
    }

    const guestOrdersSynced = await syncGuestOrdersForCustomer(supabase, {
      phones: [body.phone, normPhone, newCustomer?.phone],
      name: body.name,
      email: body.email,
      address: body.address,
    });

    return NextResponse.json({
      success: true,
      data: newCustomer,
      guestOrdersSynced,
      message: 'Cliente creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar cliente
export async function PATCH(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = createSupabaseClient();

    // Si es un cliente invitado (ID empieza con 'guest-')
    if (customerId.startsWith('guest-')) {
      const guestPhone = customerId.replace('guest-', '');
      const masterCustomer = await upsertCustomerMasterRecord(supabase, {
        name: body.name,
        phone: body.phone || guestPhone,
        email: body.email,
        address: body.address,
        neighborhood: body.neighborhood,
        city: body.city,
        notes: body.notes,
        is_active: body.is_active ?? true,
      });

      if (!masterCustomer) {
        return NextResponse.json(
          { error: 'Error al convertir cliente invitado' },
          { status: 500 }
        );
      }

      const guestOrdersSynced = await syncGuestOrdersForCustomer(supabase, {
        phones: [guestPhone, body.phone, masterCustomer.customer.phone],
        name: body.name,
        email: body.email,
        address: body.address,
      });

      return NextResponse.json({
        success: true,
        data: masterCustomer.customer,
        guestOrdersSynced,
        message: masterCustomer.isNew
          ? 'Cliente invitado convertido exitosamente'
          : 'Cliente invitado vinculado a ficha existente'
      });
    }

    // Actualizar cliente existente en tabla customers
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = normalizePhoneForDB(body.phone);
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.neighborhood !== undefined) updateData.neighborhood = body.neighborhood || null;
    if (body.city !== undefined) updateData.city = body.city || 'Bogotá';
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      // Si no existe en customers, intentar en profiles
      const normalizedProfilePhone = body.phone !== undefined ? normalizePhoneForDB(body.phone) : body.phone;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: body.name,
          phone: normalizedProfilePhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: 'Error al actualizar cliente', details: updateError.message },
          { status: 500 }
        );
      }

      const masterCustomer = await upsertCustomerMasterRecord(supabase, {
        name: body.name,
        phone: normalizedProfilePhone,
        email: body.email,
        address: body.address,
        neighborhood: body.neighborhood,
        city: body.city,
        notes: body.notes,
        is_active: body.is_active,
      });

      const guestOrdersSynced = await syncGuestOrdersForCustomer(supabase, {
        phones: [body.phone, normalizedProfilePhone, masterCustomer?.customer?.phone],
        name: body.name,
        email: body.email,
        address: body.address,
      });

      return NextResponse.json({
        success: true,
        data: profileData,
        masterCustomer: masterCustomer?.customer || null,
        guestOrdersSynced,
        message: 'Perfil actualizado exitosamente'
      });
    }

    const guestOrdersSynced = await syncGuestOrdersForCustomer(supabase, {
      phones: [body.phone, updatedCustomer?.phone],
      name: body.name,
      email: body.email,
      address: body.address,
    });

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      guestOrdersSynced,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    // No permitir eliminar clientes invitados
    if (customerId.startsWith('guest-')) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente invitado. Puedes editarlo para convertirlo en cliente registrado.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Intentar eliminar de tabla customers primero
    const { error: customersDeleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (customersDeleteError) {
      // Si no existe en customers, intentar en auth.users (que elimina profiles en cascade)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(customerId);

      if (authDeleteError) {
        return NextResponse.json(
          { error: 'Error al eliminar cliente', details: authDeleteError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
