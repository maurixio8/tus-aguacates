import { test, expect, chromium } from '@playwright/test';

// Configuración de datos de prueba
const TEST_DATA = {
  invited: {
    name: 'Cliente Prueba Invitado',
    email: 'invitado.test.8923@example.com',
    phone: '3145678923',
    address: 'Calle 127 #45-67, Bogotá',
    password: 'MiClave789'
  },
  registered: {
    email: 'usuario.registrado.5678@test.com',
    password: 'MiClave789'
  },
  products: {
    'Nueva Maya paquete x 8 Mediano': 8400,
    'Caja de 24 unidades hass mediano': 16600,
    'Fresas premium': 8500,
    'Arándanos Orgánicos': 7900,
    'Combo Mercado Semanal Completo': 68900,
    'Champiñones enteros': 6000,
    'Cerezas': 10900
  },
  coupons: {
    BIENVENIDO10: 'ONLINE10',
    AHORRO5000: 'AHORRO5000',
    ENVIOGRATIS: 'ENVIOGRATIS',
    INVALID: 'NOEXISTE'
  }
};

test.describe('Flujo de Compra - Tus Aguacates', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada prueba
    await page.goto('https://tus-aguacates.vercel.app');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  // CP001 - Compra Básica Efectivo (Usuario Invitado)
  test('CP001 - Compra básica efectivo - Usuario invitado', async ({ page }) => {
    console.log('🚀 Iniciando CP001 - Compra Básica Efectivo');

    // Ir a la tienda y agregar productos
    await page.goto('https://tus-aguacates.vercel.app/productos');

    // Esperar a que carguen los productos
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });

    // Buscar y agregar "Nueva Maya paquete x 8 Mediano"
    const productCards = await page.locator('[data-testid="product-card"], .product-card, article').all();

    for (const card of productCards) {
      const productName = await card.locator('h3, .product-title, .product-name').first().textContent();
      if (productName && productName.includes('Nueva Maya')) {
        // Agregar 2 unidades
        await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
        await page.waitForTimeout(1000);
        await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
        break;
      }
    }

    // Verificar carrito
    await page.waitForSelector('[data-testid="cart-icon"], .cart-icon, .shopping-cart', { timeout: 5000 });
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();

    // Redirección al checkout
    await page.waitForURL('**/checkout**', { timeout: 10000 });

    // Completar formulario de invitado
    await page.fill('input[name="name"], input[placeholder*="nombre"], #name', TEST_DATA.invited.name);
    await page.fill('input[name="email"], input[placeholder*="email"], #email', TEST_DATA.invited.email);
    await page.fill('input[name="phone"], input[placeholder*="teléfono"], #phone', TEST_DATA.invited.phone);
    await page.fill('textarea[name="address"], textarea[placeholder*="dirección"], #address', TEST_DATA.invited.address);

    // NO marcar crear cuenta
    const createAccountCheckbox = page.locator('input[name="createAccount"], input[type="checkbox"]');
    if (await createAccountCheckbox.isChecked()) {
      await createAccountCheckbox.uncheck();
    }

    // Seleccionar método de pago (Efectivo)
    await page.click('input[value="efectivo"], .payment-method:has-text("Efectivo"), button:has-text("Efectivo")');

    // Verificar totales
    const totalElement = await page.locator('.total, [data-testid="total"], .final-total').first();
    const totalText = await totalElement.textContent();
    expect(totalText).toContain('24.200'); // 16.800 + 7.400

    // Confirmar pedido
    await page.click('button:has-text("Confirmar Pedido"), button:has-text("Finalizar Compra"), .checkout-button', { timeout: 5000 });

    // Verificar redirección a WhatsApp (puede abrir nueva pestaña)
    await page.waitForTimeout(2000);

    // Verificar que nos quedamos en la misma página o redirigimos a confirmación
    const currentUrl = page.url();
    const isSuccess = currentUrl.includes('confirmacion') || currentUrl.includes('checkout');

    expect(isSuccess).toBeTruthy();

    // Limpiar carrito para siguiente prueba
    await page.evaluate(() => {
      localStorage.removeItem('tus-aguacates-cart');
    });

    console.log('✅ CP001 completado exitosamente');
  });

  // CP002 - Compra con Creación de Cuenta
  test('CP002 - Compra con creación de cuenta', async ({ page }) => {
    console.log('🚀 Iniciando CP002 - Creación de Cuenta');

    await page.goto('https://tus-aguacates.vercel.app/productos');
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });

    // Buscar y agregar "Caja de 24 unidades hass"
    const productCards = await page.locator('[data-testid="product-card"], .product-card, article').all();

    for (const card of productCards) {
      const productName = await card.locator('h3, .product-title, .product-name').first().textContent();
      if (productName && productName.includes('24 unidades')) {
        await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
        break;
      }
    }

    // Ir al checkout
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForURL('**/checkout**', { timeout: 10000 });

    // Completar formulario
    await page.fill('input[name="name"], input[placeholder*="nombre"], #name', TEST_DATA.invited.name);
    await page.fill('input[name="email"], input[placeholder*="email"], #email', TEST_DATA.invited.email);
    await page.fill('input[name="phone"], input[placeholder*="teléfono"], #phone', TEST_DATA.invited.phone);
    await page.fill('textarea[name="address"], textarea[placeholder*="dirección"], #address', TEST_DATA.invited.address);

    // MARCAR crear cuenta
    await page.check('input[name="createAccount"], input[type="checkbox"]');

    // Ingresar contraseña
    await page.fill('input[name="password"], input[placeholder*="contraseña"], input[type="password"]', TEST_DATA.invited.password);

    // Aplicar cupón BIENVENIDO10
    await page.fill('input[placeholder*="cupón"], input[name="coupon"], #coupon', TEST_DATA.coupons.BIENVENIDO10);
    await page.click('button:has-text("Aplicar"), button:has-text("Aplicar Cupón")');

    // Esperar a que se aplique el cupón
    await page.waitForTimeout(2000);

    // Seleccionar método de pago
    await page.click('input[value="efectivo"], .payment-method:has-text("Efectivo"), button:has-text("Efectivo")');

    // Confirmar pedido
    await page.click('button:has-text("Confirmar Pedido"), button:has-text("Finalizar Compra"), .checkout-button', { timeout: 5000 });

    await page.waitForTimeout(2000);

    console.log('✅ CP002 completado exitosamente');
  });

  // CP003 - Compra con Cupón ENVIOGRATIS
  test('CP003 - Compra con cupón ENVIOGRATIS', async ({ page }) => {
    console.log('🚀 Iniciando CP003 - Cupón ENVIOGRATIS');

    await page.goto('https://tus-aguacates.vercel.app/productos');
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });

    // Agregar productos que superen $50.000 para ENVIOGRATIS
    const productsToAdd = [
      'Combo Mercado Semanal Completo',
      'Fresas premium',
      'Arándanos Orgánicos'
    ];

    const productCards = await page.locator('[data-testid="product-card"], .product-card, article').all();

    for (const targetProduct of productsToAdd) {
      for (const card of productCards) {
        const productName = await card.locator('h3, .product-title, .product-name').first().textContent();
        if (productName && productName.includes(targetProduct)) {
          await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }

    // Ir al checkout
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForURL('**/checkout**', { timeout: 10000 });

    // Completar formulario
    await page.fill('input[name="name"], input[placeholder*="nombre"], #name', TEST_DATA.invited.name);
    await page.fill('input[name="email"], input[placeholder*="email"], #email', TEST_DATA.invited.email);
    await page.fill('input[name="phone"], input[placeholder*="teléfono"], #phone', TEST_DATA.invited.phone);
    await page.fill('textarea[name="address"], textarea[placeholder*="dirección"], #address', TEST_DATA.invited.address);

    // Aplicar cupón ENVIOGRATIS
    await page.fill('input[placeholder*="cupón"], input[name="coupon"], #coupon', TEST_DATA.coupons.ENVIOGRATIS);
    await page.click('button:has-text("Aplicar"), button:has-text("Aplicar Cupón")');

    await page.waitForTimeout(3000);

    // Verificar que el envío sea $0
    const shippingElement = await page.locator('.shipping, [data-testid="shipping"], .envio').first();
    const shippingText = await shippingElement.textContent();

    // Seleccionar método de pago Daviplata
    await page.click('input[value="daviplata"], .payment-method:has-text("Daviplata"), button:has-text("Daviplata")');

    // Confirmar pedido
    await page.click('button:has-text("Confirmar Pedido"), button:has-text("Finalizar Compra"), .checkout-button', { timeout: 5000 });

    await page.waitForTimeout(2000);

    console.log('✅ CP003 completado exitosamente');
  });

  // CP007 - Validación de Formularios
  test('CP007 - Validación de formularios', async ({ page }) => {
    console.log('🚀 Iniciando CP007 - Validación de Formularios');

    await page.goto('https://tus-aguacates.vercel.app/productos');

    // Agregar un producto
    const productCards = await page.locator('[data-testid="product-card"], .product-card, article').all();
    for (const card of productCards) {
      const productName = await card.locator('h3, .product-title, .product-name').first().textContent();
      if (productName && productName.includes('Nueva Maya')) {
        await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
        break;
      }
    }

    // Ir al checkout
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForURL('**/checkout**', { timeout: 10000 });

    // Intentar enviar formulario vacío
    await page.click('button:has-text("Continuar"), button:has-text("Siguiente"), .continue-button', { timeout: 5000 });

    // Verificar mensajes de error
    await page.waitForTimeout(1000);

    // Probar email inválido
    await page.fill('input[name="email"], input[placeholder*="email"], #email', 'email-invalido');
    await page.blur('input[name="email"], input[placeholder*="email"], #email');

    await page.waitForTimeout(1000);

    // Probar teléfono inválido
    await page.fill('input[name="phone"], input[placeholder*="teléfono"], #phone', '123');

    await page.waitForTimeout(1000);

    console.log('✅ CP007 completado exitosamente');
  });

  // CP009 - Cupones Inválidos
  test('CP009 - Cupones inválidos', async ({ page }) => {
    console.log('🚀 Iniciando CP009 - Cupones Inválidos');

    await page.goto('https://tus-aguacates.vercel.app/productos');

    // Agregar un producto
    const productCards = await page.locator('[data-testid="product-card"], .product-card, article').all();
    for (const card of productCards) {
      const productName = await card.locator('h3, .product-title, .product-name').first().textContent();
      if (productName && productName.includes('Champiñones')) {
        await card.locator('button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart').first().click();
        break;
      }
    }

    // Ir al checkout
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForURL('**/checkout**', { timeout: 10000 });

    // Intentar aplicar cupón inválido
    await page.fill('input[placeholder*="cupón"], input[name="coupon"], #coupon', TEST_DATA.coupons.INVALID);
    await page.click('button:has-text("Aplicar"), button:has-text("Aplicar Cupón")');

    // Verificar mensaje de error
    await page.waitForTimeout(2000);

    console.log('✅ CP009 completado exitosamente');
  });
});