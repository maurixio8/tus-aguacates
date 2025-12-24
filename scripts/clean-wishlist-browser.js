// 🧹 SCRIPT DE LIMPIEZA DE WISHLIST
// Copia y pega este código en la consola del navegador (F12) en tu sitio tus-aguacates.com

(async function cleanObsoleteWishlist() {
  console.log('🧹 Iniciando limpieza de wishlist...');
  console.log('');

  try {
    // IDs obsoletos a limpiar
    const obsoleteIds = ['product-184', 'product-103', 'product-78', 'product-84'];

    // Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('❌ No hay sesión activa. Por favor inicia sesión.');
      return;
    }

    console.log('🔍 Buscando items obsoletos en el wishlist...');

    // Obtener wishlist del usuario
    const { data: wishlist, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('❌ Error obteniendo wishlist:', error);
      return;
    }

    console.log(`📊 Total de items en wishlist: ${wishlist.length}`);

    // Filtrar items obsoletos
    const obsoleteItems = wishlist.filter(item =>
      obsoleteIds.includes(item.product_id)
    );

    console.log(`⚠️  Items obsoletos encontrados: ${obsoleteItems.length}`);

    if (obsoleteItems.length === 0) {
      console.log('✅ No hay items obsoletos para eliminar.');
      return;
    }

    console.log('');
    console.log('Items a eliminar:');
    obsoleteItems.forEach(item => {
      console.log(`  - ${item.product_id} (DB ID: ${item.id})`);
    });

    // Eliminar items obsoletos
    console.log('');
    console.log('🗑️  Eliminando items...');

    for (const item of obsoleteItems) {
      const { error: deleteError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        console.error(`❌ Error eliminando ${item.product_id}:`, deleteError);
      } else {
        console.log(`✅ Eliminado: ${item.product_id}`);
      }
    }

    console.log('');
    console.log('🎉 Limpieza completada!');
    console.log('💡 Recarga la página para ver los cambios.');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
})();
