// Datos de recetas - MVP sin base de datos
// Cada receta está relacionada con productos reales de la tienda

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  productSlug?: string; // Slug del producto en la tienda (si existe)
  productQty?: number; // Cantidad sugerida del producto
  productNote?: string; // Nota sobre el producto (ej: "1 libra ≈ 5-6 limones")
  isOptional?: boolean;
}

export interface RecipeNutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  prepTime: number; // minutos
  cookTime: number; // minutos
  servings: number;
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  category: RecipeCategory;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  tips?: string[];
  nutrition?: RecipeNutrition;
  isFeatured?: boolean;
  createdAt: string;
}

export type RecipeCategory =
  | 'desayunos'
  | 'ensaladas'
  | 'smoothies'
  | 'platos-principales'
  | 'snacks'
  | 'postres'
  | 'con-aguacate';

export interface RecipeCategoryInfo {
  slug: RecipeCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const recipeCategories: RecipeCategoryInfo[] = [
  {
    slug: 'con-aguacate',
    name: 'Con Aguacate',
    description: 'Recetas donde el aguacate es el protagonista',
    icon: '🥑',
    color: 'bg-green-500'
  },
  {
    slug: 'desayunos',
    name: 'Desayunos',
    description: 'Empieza el día con energía',
    icon: '🍳',
    color: 'bg-yellow-500'
  },
  {
    slug: 'smoothies',
    name: 'Smoothies',
    description: 'Bebidas nutritivas y refrescantes',
    icon: '🥤',
    color: 'bg-pink-500'
  },
  {
    slug: 'ensaladas',
    name: 'Ensaladas',
    description: 'Frescas, saludables y deliciosas',
    icon: '🥗',
    color: 'bg-emerald-500'
  },
  {
    slug: 'platos-principales',
    name: 'Platos Principales',
    description: 'Comidas completas y nutritivas',
    icon: '🍽️',
    color: 'bg-orange-500'
  },
  {
    slug: 'snacks',
    name: 'Snacks',
    description: 'Meriendas rápidas y saludables',
    icon: '🥨',
    color: 'bg-purple-500'
  },
  {
    slug: 'postres',
    name: 'Postres',
    description: 'Dulces saludables',
    icon: '🍨',
    color: 'bg-rose-500'
  }
];

// Recetas iniciales del MVP
export const recipes: Recipe[] = [
  {
    id: '1',
    slug: 'guacamole-clasico',
    title: 'Guacamole Clásico',
    description: 'El guacamole perfecto para cualquier ocasión. Cremoso, fresco y lleno de sabor. Esta receta tradicional mexicana es ideal para acompañar nachos, tacos o simplemente con vegetales frescos.',
    shortDescription: 'El clásico dip mexicano cremoso y delicioso',
    image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'Fácil',
    category: 'con-aguacate',
    tags: ['mexicano', 'dip', 'sin cocción', 'vegetariano', 'vegano'],
    isFeatured: true,
    ingredients: [
      { name: 'Aguacate Hass maduro', quantity: '3', unit: 'unidades', productSlug: 'aguacate-hass' },
      { name: 'Tomate', quantity: '1', unit: 'grande', productSlug: 'tomate' },
      { name: 'Cebolla morada', quantity: '1/4', unit: 'taza', productSlug: 'cebolla-morada' },
      { name: 'Cilantro fresco', quantity: '1/4', unit: 'taza', productSlug: 'cilantro' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Sal', quantity: '1', unit: 'cucharadita' },
      { name: 'Chile jalapeño', quantity: '1', unit: 'unidad', isOptional: true }
    ],
    steps: [
      'Corta los aguacates por la mitad, retira el hueso y saca la pulpa con una cuchara.',
      'Coloca la pulpa de aguacate en un bowl y machácala con un tenedor hasta obtener la consistencia deseada (puede ser más cremosa o con trozos).',
      'Pica finamente el tomate, la cebolla y el cilantro.',
      'Agrega el tomate, la cebolla y el cilantro al aguacate machacado.',
      'Exprime el jugo de los limones sobre la mezcla.',
      'Añade la sal y mezcla bien todos los ingredientes.',
      'Si deseas picante, agrega el jalapeño picado finamente.',
      'Prueba y ajusta la sal y el limón según tu gusto.',
      '¡Sirve inmediatamente con totopos o vegetales frescos!'
    ],
    tips: [
      'Usa aguacates que cedan ligeramente al presionarlos para un guacamole perfecto.',
      'El limón no solo da sabor, también ayuda a prevenir que el aguacate se oxide.',
      'Si lo preparas con anticipación, cubre con papel film tocando directamente la superficie del guacamole.'
    ],
    nutrition: {
      calories: 180,
      protein: '2g',
      carbs: '10g',
      fat: '15g',
      fiber: '7g'
    },
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    slug: 'tostadas-aguacate-huevo',
    title: 'Tostadas de Aguacate con Huevo',
    description: 'Un desayuno nutritivo y delicioso que combina la cremosidad del aguacate con huevo pochado. Rico en proteínas y grasas saludables para empezar el día con energía.',
    shortDescription: 'Desayuno nutritivo con aguacate cremoso y huevo',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    difficulty: 'Fácil',
    category: 'desayunos',
    tags: ['desayuno', 'proteína', 'saludable', 'rápido'],
    isFeatured: true,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '1', unit: 'grande', productSlug: 'aguacate-hass' },
      { name: 'Pan integral', quantity: '2', unit: 'rebanadas' },
      { name: 'Huevos', quantity: '2', unit: 'unidades' },
      { name: 'Limón', quantity: '1/2', unit: 'unidad', productSlug: 'limon-tahiti' },
      { name: 'Sal', quantity: 'al gusto', unit: '' },
      { name: 'Pimienta', quantity: 'al gusto', unit: '' },
      { name: 'Hojuelas de chile', quantity: '1', unit: 'pizca', isOptional: true },
      { name: 'Semillas de sésamo', quantity: '1', unit: 'cucharadita', isOptional: true }
    ],
    steps: [
      'Tuesta las rebanadas de pan hasta que estén doradas y crujientes.',
      'Corta el aguacate por la mitad, retira el hueso y saca la pulpa.',
      'En un bowl pequeño, machaca el aguacate con un tenedor y añade unas gotas de limón, sal y pimienta.',
      'Pon agua a hervir en una olla pequeña. Cuando hierva, crea un remolino y rompe un huevo en el centro para pocharlo (3-4 minutos).',
      'Repite con el segundo huevo.',
      'Unta generosamente el aguacate sobre las tostadas.',
      'Coloca un huevo pochado sobre cada tostada.',
      'Sazona con sal, pimienta y si deseas, hojuelas de chile y semillas de sésamo.',
      '¡Sirve inmediatamente!'
    ],
    tips: [
      'Para un huevo pochado perfecto, usa huevos muy frescos y agrega una cucharada de vinagre al agua.',
      'Puedes sustituir el huevo pochado por huevo frito o revuelto según tu preferencia.',
      'Añade rodajas de tomate fresco para más sabor y color.'
    ],
    nutrition: {
      calories: 350,
      protein: '14g',
      carbs: '20g',
      fat: '25g',
      fiber: '8g'
    },
    createdAt: '2024-01-16'
  },
  {
    id: '3',
    slug: 'smoothie-verde-energizante',
    title: 'Smoothie Verde Energizante',
    description: 'Un smoothie lleno de nutrientes con aguacate, espinaca y frutas tropicales. Perfecto para empezar el día o como snack post-ejercicio. Cremoso y delicioso.',
    shortDescription: 'Bebida nutritiva con aguacate y frutas tropicales',
    image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=800&h=600&fit=crop',
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    difficulty: 'Fácil',
    category: 'smoothies',
    tags: ['bebida', 'saludable', 'verde', 'energía', 'vegano'],
    isFeatured: true,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '1/2', unit: 'unidad', productSlug: 'aguacate-hass' },
      { name: 'Banano', quantity: '1', unit: 'grande', productSlug: 'banano' },
      { name: 'Espinaca', quantity: '2', unit: 'tazas', productSlug: 'espinaca' },
      { name: 'Mango', quantity: '1/2', unit: 'taza', productSlug: 'mango' },
      { name: 'Leche de almendras', quantity: '1', unit: 'taza' },
      { name: 'Miel o agave', quantity: '1', unit: 'cucharada', isOptional: true },
      { name: 'Hielo', quantity: '1/2', unit: 'taza' }
    ],
    steps: [
      'Pela el banano y córtalo en trozos.',
      'Saca la pulpa del medio aguacate.',
      'Coloca todos los ingredientes en la licuadora: espinaca, banano, aguacate, mango, leche de almendras y hielo.',
      'Licúa a velocidad alta durante 1-2 minutos hasta obtener una mezcla homogénea y cremosa.',
      'Prueba y ajusta el dulzor con miel si lo deseas.',
      'Sirve inmediatamente en vasos altos.',
      '¡Decora con rodajas de banano o semillas de chía si lo deseas!'
    ],
    tips: [
      'Congela el banano previamente para un smoothie más cremoso y frío.',
      'Puedes sustituir la leche de almendras por cualquier leche vegetal o regular.',
      'Para más proteína, añade una cucharada de proteína en polvo o mantequilla de maní.'
    ],
    nutrition: {
      calories: 220,
      protein: '4g',
      carbs: '35g',
      fat: '10g',
      fiber: '8g'
    },
    createdAt: '2024-01-17'
  },
  {
    id: '4',
    slug: 'ensalada-aguacate-mango',
    title: 'Ensalada Tropical de Aguacate y Mango',
    description: 'Una ensalada fresca y colorida que combina la cremosidad del aguacate con la dulzura del mango. Perfecta para días calurosos o como acompañamiento ligero.',
    shortDescription: 'Ensalada fresca con frutas tropicales',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'Fácil',
    category: 'ensaladas',
    tags: ['ensalada', 'tropical', 'fresco', 'vegetariano', 'sin cocción'],
    isFeatured: false,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '2', unit: 'unidades', productSlug: 'aguacate-hass' },
      { name: 'Mango maduro', quantity: '1', unit: 'grande', productSlug: 'mango' },
      { name: 'Lechuga mixta', quantity: '4', unit: 'tazas', productSlug: 'lechuga' },
      { name: 'Cebolla morada', quantity: '1/4', unit: 'unidad', productSlug: 'cebolla-morada' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Aceite de oliva', quantity: '3', unit: 'cucharadas' },
      { name: 'Miel', quantity: '1', unit: 'cucharada' },
      { name: 'Cilantro', quantity: '2', unit: 'cucharadas', productSlug: 'cilantro' },
      { name: 'Sal y pimienta', quantity: 'al gusto', unit: '' }
    ],
    steps: [
      'Lava y seca bien la lechuga. Colócala como base en un plato grande o bowl.',
      'Pela y corta el mango en cubos medianos.',
      'Corta los aguacates por la mitad, retira el hueso y córtalos en rodajas o cubos.',
      'Corta la cebolla morada en rodajas finas.',
      'Distribuye el mango, aguacate y cebolla sobre la lechuga.',
      'Para el aderezo: mezcla el jugo de limón, aceite de oliva, miel, sal y pimienta en un bowl pequeño.',
      'Vierte el aderezo sobre la ensalada.',
      'Espolvorea el cilantro picado por encima.',
      '¡Sirve inmediatamente!'
    ],
    tips: [
      'Añade nueces o almendras tostadas para más textura y proteína.',
      'Puedes agregar camarones o pollo a la plancha para una comida más completa.',
      'El aderezo se puede preparar con anticipación y guardar en la nevera.'
    ],
    nutrition: {
      calories: 280,
      protein: '3g',
      carbs: '25g',
      fat: '20g',
      fiber: '9g'
    },
    createdAt: '2024-01-18'
  },
  {
    id: '5',
    slug: 'bowl-acai-frutas',
    title: 'Bowl de Açaí con Frutas Frescas',
    description: 'Un bowl vibrante y nutritivo con base de açaí, decorado con frutas frescas, granola y semillas. Perfecto para un desayuno energético o merienda saludable.',
    shortDescription: 'Bowl nutritivo con açaí y frutas tropicales',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'Fácil',
    category: 'desayunos',
    tags: ['bowl', 'açaí', 'superfoods', 'vegano', 'sin cocción'],
    isFeatured: false,
    ingredients: [
      { name: 'Pulpa de açaí congelada', quantity: '100', unit: 'gramos' },
      { name: 'Banano congelado', quantity: '1', unit: 'unidad', productSlug: 'banano' },
      { name: 'Fresas', quantity: '1/2', unit: 'taza', productSlug: 'fresas' },
      { name: 'Banano fresco', quantity: '1/2', unit: 'unidad', productSlug: 'banano' },
      { name: 'Arándanos', quantity: '1/4', unit: 'taza' },
      { name: 'Granola', quantity: '1/4', unit: 'taza' },
      { name: 'Coco rallado', quantity: '1', unit: 'cucharada' },
      { name: 'Miel', quantity: '1', unit: 'cucharada', isOptional: true },
      { name: 'Semillas de chía', quantity: '1', unit: 'cucharadita', isOptional: true }
    ],
    steps: [
      'Rompe la pulpa de açaí congelada en trozos pequeños.',
      'Coloca el açaí y el banano congelado en la licuadora.',
      'Añade un chorrito de agua o leche vegetal (solo lo necesario para licuar).',
      'Licúa hasta obtener una consistencia espesa como helado suave.',
      'Vierte la mezcla en un bowl.',
      'Corta las fresas y el banano fresco en rodajas.',
      'Decora la superficie con las frutas, granola, coco rallado y semillas.',
      'Rocía con miel si deseas más dulzor.',
      '¡Disfruta inmediatamente antes de que se derrita!'
    ],
    tips: [
      'La clave es usar frutas bien congeladas para obtener la textura espesa característica.',
      'Puedes personalizar los toppings con tus frutas favoritas.',
      'Añade mantequilla de maní para más proteína y sabor.'
    ],
    nutrition: {
      calories: 320,
      protein: '6g',
      carbs: '52g',
      fat: '12g',
      fiber: '10g'
    },
    createdAt: '2024-01-19'
  },
  {
    id: '6',
    slug: 'wrap-aguacate-pollo',
    title: 'Wrap de Aguacate y Pollo',
    description: 'Un wrap saludable y satisfactorio con pollo a la plancha, aguacate cremoso y vegetales frescos. Ideal para un almuerzo rápido y nutritivo.',
    shortDescription: 'Wrap saludable con proteína y vegetales',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    difficulty: 'Media',
    category: 'platos-principales',
    tags: ['wrap', 'pollo', 'proteína', 'almuerzo', 'saludable'],
    isFeatured: false,
    ingredients: [
      { name: 'Pechuga de pollo', quantity: '250', unit: 'gramos' },
      { name: 'Aguacate Hass', quantity: '1', unit: 'grande', productSlug: 'aguacate-hass' },
      { name: 'Tortillas de trigo', quantity: '2', unit: 'grandes' },
      { name: 'Lechuga', quantity: '1', unit: 'taza', productSlug: 'lechuga' },
      { name: 'Tomate', quantity: '1', unit: 'mediano', productSlug: 'tomate' },
      { name: 'Limón', quantity: '1', unit: 'unidad', productSlug: 'limon-tahiti' },
      { name: 'Aceite de oliva', quantity: '2', unit: 'cucharadas' },
      { name: 'Sal y pimienta', quantity: 'al gusto', unit: '' },
      { name: 'Yogurt griego', quantity: '2', unit: 'cucharadas', isOptional: true }
    ],
    steps: [
      'Sazona la pechuga de pollo con sal, pimienta y un poco de jugo de limón.',
      'Calienta el aceite en una sartén a fuego medio-alto.',
      'Cocina el pollo por 5-6 minutos de cada lado hasta que esté dorado y cocido por completo.',
      'Deja reposar el pollo 5 minutos y luego córtalo en tiras.',
      'Machaca el aguacate con un tenedor, añade limón, sal y pimienta.',
      'Calienta las tortillas en una sartén seca por 30 segundos de cada lado.',
      'Unta el aguacate sobre cada tortilla.',
      'Añade las tiras de pollo, lechuga, tomate en rodajas y yogurt griego si lo deseas.',
      'Enrolla los wraps doblando primero los lados y luego enrollando de abajo hacia arriba.',
      '¡Corta por la mitad y sirve!'
    ],
    tips: [
      'Marina el pollo con anticipación para más sabor.',
      'Puedes usar pollo rostizado si quieres ahorrar tiempo.',
      'Añade queso feta o cheddar para más sabor.'
    ],
    nutrition: {
      calories: 450,
      protein: '35g',
      carbs: '30g',
      fat: '22g',
      fiber: '8g'
    },
    createdAt: '2024-01-20'
  },
  {
    id: '7',
    slug: 'salsa-aguacate-cilantro',
    title: 'Salsa Cremosa de Aguacate y Cilantro',
    description: 'Una salsa versátil y deliciosa perfecta para tacos, quesadillas, carnes a la parrilla o como aderezo para ensaladas. Fresca, cremosa y llena de sabor.',
    shortDescription: 'Salsa versátil para acompañar cualquier plato',
    image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 0,
    servings: 6,
    difficulty: 'Fácil',
    category: 'con-aguacate',
    tags: ['salsa', 'aderezo', 'vegano', 'sin cocción', 'versátil'],
    isFeatured: false,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '2', unit: 'maduros', productSlug: 'aguacate-hass' },
      { name: 'Cilantro', quantity: '1', unit: 'taza', productSlug: 'cilantro' },
      { name: 'Limón', quantity: '3', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Ajo', quantity: '1', unit: 'diente' },
      { name: 'Jalapeño', quantity: '1', unit: 'pequeño', isOptional: true },
      { name: 'Aceite de oliva', quantity: '2', unit: 'cucharadas' },
      { name: 'Agua', quantity: '1/4', unit: 'taza' },
      { name: 'Sal', quantity: '1/2', unit: 'cucharadita' }
    ],
    steps: [
      'Corta los aguacates y saca la pulpa.',
      'Lava bien el cilantro (hojas y tallos tiernos).',
      'Coloca el aguacate, cilantro, jugo de limón, ajo, jalapeño (si lo usas), aceite y sal en la licuadora.',
      'Añade el agua gradualmente mientras licúas.',
      'Licúa hasta obtener una salsa suave y homogénea.',
      'Prueba y ajusta la sal y el limón según tu preferencia.',
      'Si queda muy espesa, añade más agua. Si la quieres más intensa, reduce el agua.',
      'Transfiere a un recipiente y refrigera hasta servir.',
      'Se mantiene fresca hasta 3 días en refrigeración en un recipiente hermético.'
    ],
    tips: [
      'Para una salsa más suave, retira las semillas del jalapeño.',
      'Esta salsa es perfecta para meal prep: prepárala el domingo y úsala toda la semana.',
      'Congela en cubetas de hielo para tener porciones individuales.'
    ],
    nutrition: {
      calories: 120,
      protein: '1g',
      carbs: '6g',
      fat: '11g',
      fiber: '4g'
    },
    createdAt: '2024-01-21'
  },
  {
    id: '8',
    slug: 'pudding-chia-mango',
    title: 'Pudding de Chía con Mango',
    description: 'Un postre saludable y nutritivo que se prepara la noche anterior. Perfecto para desayuno o merienda, rico en omega-3 y fibra.',
    shortDescription: 'Postre saludable con semillas de chía y mango',
    image: 'https://images.unsplash.com/photo-1546039907-7b67f9e10173?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Fácil',
    category: 'postres',
    tags: ['postre', 'saludable', 'chía', 'preparar antes', 'vegano'],
    isFeatured: false,
    ingredients: [
      { name: 'Semillas de chía', quantity: '4', unit: 'cucharadas' },
      { name: 'Leche de coco', quantity: '1', unit: 'taza' },
      { name: 'Mango maduro', quantity: '1', unit: 'grande', productSlug: 'mango' },
      { name: 'Miel o agave', quantity: '2', unit: 'cucharadas' },
      { name: 'Extracto de vainilla', quantity: '1/2', unit: 'cucharadita' },
      { name: 'Coco rallado', quantity: '1', unit: 'cucharada', isOptional: true }
    ],
    steps: [
      'En un bowl, mezcla las semillas de chía con la leche de coco.',
      'Añade la miel y el extracto de vainilla. Mezcla bien.',
      'Deja reposar 5 minutos y vuelve a mezclar para evitar grumos.',
      'Cubre el bowl y refrigera durante al menos 4 horas o toda la noche.',
      'Pela el mango y córtalo en cubos.',
      'Al servir, divide el pudding de chía en dos recipientes.',
      'Decora con los cubos de mango y coco rallado.',
      '¡Disfruta frío!'
    ],
    tips: [
      'La proporción ideal es 1 cucharada de chía por cada 1/4 taza de líquido.',
      'Puedes sustituir el mango por cualquier fruta de temporada.',
      'Prepara varios frascos el domingo para tener desayunos listos toda la semana.'
    ],
    nutrition: {
      calories: 280,
      protein: '6g',
      carbs: '35g',
      fat: '14g',
      fiber: '12g'
    },
    createdAt: '2024-01-22'
  },
  {
    id: '9',
    slug: 'batido-proteico-banano',
    title: 'Batido Proteico de Banano y Aguacate',
    description: 'Un batido cremoso perfecto para después del ejercicio. Rico en proteínas, grasas saludables y carbohidratos para recuperación muscular.',
    shortDescription: 'Batido post-entreno cremoso y nutritivo',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Fácil',
    category: 'smoothies',
    tags: ['proteína', 'fitness', 'post-entreno', 'batido', 'energía'],
    isFeatured: false,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '1/2', unit: 'unidad', productSlug: 'aguacate-hass' },
      { name: 'Banano maduro', quantity: '1', unit: 'grande', productSlug: 'banano' },
      { name: 'Leche', quantity: '1', unit: 'taza' },
      { name: 'Proteína en polvo', quantity: '1', unit: 'scoop' },
      { name: 'Mantequilla de maní', quantity: '1', unit: 'cucharada' },
      { name: 'Hielo', quantity: '1/2', unit: 'taza' },
      { name: 'Canela', quantity: '1', unit: 'pizca', isOptional: true }
    ],
    steps: [
      'Pela el banano y colócalo en la licuadora.',
      'Añade la pulpa del medio aguacate.',
      'Agrega la leche, proteína en polvo, mantequilla de maní y hielo.',
      'Licúa a velocidad alta durante 1-2 minutos.',
      'Verifica la consistencia; añade más leche si lo prefieres más líquido.',
      'Sirve inmediatamente en un vaso grande.',
      'Espolvorea canela por encima si lo deseas.'
    ],
    tips: [
      'Congela el banano previamente para un batido más espeso y cremoso.',
      'Puedes usar cualquier tipo de leche: vaca, almendras, avena, etc.',
      'Sin proteína en polvo, añade 2 cucharadas extra de mantequilla de maní.'
    ],
    nutrition: {
      calories: 450,
      protein: '30g',
      carbs: '40g',
      fat: '20g',
      fiber: '8g'
    },
    createdAt: '2024-01-23'
  },
  {
    id: '10',
    slug: 'chips-platano-saludables',
    title: 'Chips de Plátano Horneados',
    description: 'Una alternativa saludable a los snacks procesados. Crujientes, naturalmente dulces y perfectos para picar entre comidas.',
    shortDescription: 'Snack crujiente y saludable',
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'Fácil',
    category: 'snacks',
    tags: ['snack', 'saludable', 'horneado', 'sin freír', 'crujiente'],
    isFeatured: false,
    ingredients: [
      { name: 'Plátano verde', quantity: '3', unit: 'grandes', productSlug: 'platano' },
      { name: 'Aceite de coco', quantity: '1', unit: 'cucharada' },
      { name: 'Sal marina', quantity: '1/2', unit: 'cucharadita' },
      { name: 'Canela', quantity: '1/4', unit: 'cucharadita', isOptional: true },
      { name: 'Paprika', quantity: '1/4', unit: 'cucharadita', isOptional: true }
    ],
    steps: [
      'Precalienta el horno a 180°C (350°F).',
      'Pela los plátanos y córtalos en rodajas muy finas (2-3mm). Puedes usar mandolina.',
      'En un bowl grande, mezcla las rodajas de plátano con el aceite de coco derretido.',
      'Añade la sal y las especias que prefieras (canela para dulce, paprika para salado).',
      'Distribuye las rodajas en una sola capa sobre bandejas con papel para hornear.',
      'Hornea durante 15-20 minutos, volteando a mitad de cocción.',
      'Vigila que no se quemen; deben quedar dorados.',
      'Retira del horno y deja enfriar completamente (se pondrán más crujientes).',
      '¡Guarda en un recipiente hermético!'
    ],
    tips: [
      'Cuanto más finas las rodajas, más crujientes quedarán.',
      'Los chips se ablandan si se exponen a la humedad; guárdalos bien cerrados.',
      'Prueba con plátano maduro para una versión más dulce (menor tiempo de horneado).'
    ],
    nutrition: {
      calories: 150,
      protein: '2g',
      carbs: '35g',
      fat: '3g',
      fiber: '4g'
    },
    createdAt: '2024-01-24'
  }
];

// Funciones de utilidad
export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find(recipe => recipe.slug === slug);
}

export function getRecipesByCategory(category: RecipeCategory): Recipe[] {
  return recipes.filter(recipe => recipe.category === category);
}

export function getFeaturedRecipes(): Recipe[] {
  return recipes.filter(recipe => recipe.isFeatured);
}

export function searchRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(lowerQuery) ||
    recipe.description.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery))
  );
}

export function getRecipesWithProduct(productSlug: string): Recipe[] {
  return recipes.filter(recipe =>
    recipe.ingredients.some(ing => ing.productSlug === productSlug)
  );
}

export function getCategoryInfo(slug: RecipeCategory): RecipeCategoryInfo | undefined {
  return recipeCategories.find(cat => cat.slug === slug);
}
