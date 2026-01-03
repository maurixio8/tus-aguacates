// Datos de recetas - MVP sin base de datos
// Cada receta está relacionada con productos reales de la tienda

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  productSlug?: string; // Slug del producto en la tienda (si existe)
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
  },
  {
    id: '11',
    slug: 'aguacate-relleno-atun',
    title: 'Aguacates Rellenos de Atún',
    description: 'Una entrada elegante y nutritiva. Los aguacates se convierten en el recipiente perfecto para una mezcla cremosa de atún con mayonesa ligera y vegetales crujientes.',
    shortDescription: 'Entrada fresca con atún y aguacate cremoso',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'Fácil',
    category: 'con-aguacate',
    tags: ['entrada', 'proteína', 'sin cocción', 'omega-3', 'rápido'],
    isFeatured: false,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '2', unit: 'grandes', productSlug: 'aguacate-hass' },
      { name: 'Atún en agua', quantity: '2', unit: 'latas (140g c/u)' },
      { name: 'Mayonesa ligera', quantity: '3', unit: 'cucharadas' },
      { name: 'Apio', quantity: '2', unit: 'tallos' },
      { name: 'Cebolla morada', quantity: '1/4', unit: 'pequeña', productSlug: 'cebolla-morada' },
      { name: 'Limón', quantity: '1', unit: 'unidad', productSlug: 'limon-tahiti' },
      { name: 'Sal y pimienta', quantity: 'al gusto', unit: '' },
      { name: 'Perejil', quantity: '2', unit: 'cucharadas', isOptional: true }
    ],
    steps: [
      'Escurre bien el atún y colócalo en un bowl.',
      'Pica finamente el apio y la cebolla morada.',
      'Mezcla el atún con la mayonesa, el apio y la cebolla.',
      'Añade el jugo de medio limón, sal y pimienta al gusto.',
      'Corta los aguacates por la mitad y retira el hueso.',
      'Con una cuchara, amplía ligeramente el hueco del aguacate.',
      'Rocía las mitades de aguacate con el jugo de limón restante para evitar oxidación.',
      'Rellena cada mitad de aguacate con la mezcla de atún.',
      'Decora con perejil picado y sirve inmediatamente.'
    ],
    tips: [
      'Usa atún en agua para una versión más ligera.',
      'Puedes añadir un poco de mostaza Dijon para más sabor.',
      'También funciona con pollo desmenuzado o camarones.'
    ],
    nutrition: {
      calories: 320,
      protein: '22g',
      carbs: '8g',
      fat: '24g',
      fiber: '7g'
    },
    createdAt: '2024-01-25'
  },
  {
    id: '12',
    slug: 'ceviche-mango-aguacate',
    title: 'Ceviche Tropical de Mango y Aguacate',
    description: 'Una versión fresca y tropical del clásico ceviche. La combinación de pescado marinado en limón, mango dulce y aguacate cremoso crea una explosión de sabores.',
    shortDescription: 'Ceviche fresco con frutas tropicales',
    image: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&h=600&fit=crop',
    prepTime: 25,
    cookTime: 0,
    servings: 6,
    difficulty: 'Media',
    category: 'platos-principales',
    tags: ['mariscos', 'peruano', 'tropical', 'sin cocción', 'fresco'],
    isFeatured: true,
    ingredients: [
      { name: 'Pescado blanco fresco', quantity: '500', unit: 'gramos' },
      { name: 'Limón', quantity: '8', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Mango maduro', quantity: '1', unit: 'grande', productSlug: 'mango' },
      { name: 'Aguacate Hass', quantity: '2', unit: 'medianos', productSlug: 'aguacate-hass' },
      { name: 'Cebolla morada', quantity: '1', unit: 'mediana', productSlug: 'cebolla-morada' },
      { name: 'Cilantro', quantity: '1/2', unit: 'taza', productSlug: 'cilantro' },
      { name: 'Ají limo o chile', quantity: '1', unit: 'pequeño' },
      { name: 'Sal', quantity: '1', unit: 'cucharadita' }
    ],
    steps: [
      'Corta el pescado en cubos pequeños de 2cm. Asegúrate de que esté muy fresco.',
      'Exprime los limones y cuela el jugo para eliminar semillas.',
      'Coloca el pescado en un bowl de vidrio y cubre con el jugo de limón.',
      'Añade sal y deja marinar en refrigeración por 20-30 minutos.',
      'Mientras tanto, corta la cebolla en julianas finas y remójala en agua fría.',
      'Pela y corta el mango y el aguacate en cubos del mismo tamaño que el pescado.',
      'Escurre la cebolla y pica finamente el cilantro y el ají.',
      'Una vez marinado el pescado, escurre el exceso de limón.',
      'Mezcla con el mango, aguacate, cebolla, cilantro y ají.',
      'Ajusta la sal y sirve inmediatamente en copas o platos hondos.'
    ],
    tips: [
      'El pescado debe estar muy fresco - pide en la pescadería que sea para ceviche.',
      'No dejes marinar demasiado tiempo o el pescado quedará "cocido" en exceso.',
      'Puedes usar camarones o pulpo en lugar de pescado.'
    ],
    nutrition: {
      calories: 220,
      protein: '25g',
      carbs: '18g',
      fat: '8g',
      fiber: '5g'
    },
    createdAt: '2024-01-26'
  },
  {
    id: '13',
    slug: 'ensalada-cesar-aguacate',
    title: 'Ensalada César con Aguacate',
    description: 'La clásica ensalada César reinventada con cremoso aguacate. Crujiente lechuga romana, crutones caseros y un aderezo César ligero hacen de esta ensalada un plato completo.',
    shortDescription: 'Ensalada César clásica con toque de aguacate',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&h=600&fit=crop',
    prepTime: 20,
    cookTime: 10,
    servings: 4,
    difficulty: 'Fácil',
    category: 'ensaladas',
    tags: ['clásica', 'lechuga', 'crutones', 'queso parmesano'],
    isFeatured: false,
    ingredients: [
      { name: 'Lechuga romana', quantity: '2', unit: 'cogollos', productSlug: 'lechuga' },
      { name: 'Aguacate Hass', quantity: '1', unit: 'grande', productSlug: 'aguacate-hass' },
      { name: 'Pan francés', quantity: '2', unit: 'rebanadas' },
      { name: 'Queso parmesano', quantity: '1/2', unit: 'taza rallado' },
      { name: 'Limón', quantity: '1', unit: 'unidad', productSlug: 'limon-tahiti' },
      { name: 'Ajo', quantity: '2', unit: 'dientes' },
      { name: 'Aceite de oliva', quantity: '4', unit: 'cucharadas' },
      { name: 'Yogurt griego', quantity: '3', unit: 'cucharadas' },
      { name: 'Mostaza Dijon', quantity: '1', unit: 'cucharadita' }
    ],
    steps: [
      'Precalienta el horno a 180°C. Corta el pan en cubos pequeños.',
      'Mezcla los cubos de pan con 1 cucharada de aceite y ajo picado.',
      'Hornea los crutones por 10 minutos hasta que estén dorados y crujientes.',
      'Para el aderezo: mezcla yogurt, mostaza, jugo de limón, 2 cucharadas de aceite y la mitad del parmesano.',
      'Añade sal y pimienta al aderezo y mezcla bien.',
      'Lava y seca la lechuga. Córtala en trozos grandes.',
      'Corta el aguacate en rodajas o cubos.',
      'En un bowl grande, mezcla la lechuga con suficiente aderezo.',
      'Añade el aguacate, los crutones y el resto del parmesano.',
      'Sirve inmediatamente con más parmesano rallado encima.'
    ],
    tips: [
      'Para crutones extra crujientes, usa pan del día anterior.',
      'Puedes añadir pollo a la plancha para una comida más completa.',
      'El aderezo se conserva en la nevera hasta 5 días.'
    ],
    nutrition: {
      calories: 290,
      protein: '10g',
      carbs: '18g',
      fat: '22g',
      fiber: '6g'
    },
    createdAt: '2024-01-27'
  },
  {
    id: '14',
    slug: 'tacos-carnitas-aguacate',
    title: 'Tacos de Carnitas con Guacamole',
    description: 'Auténticos tacos mexicanos con carnitas jugosas y guacamole fresco. La carne de cerdo se cocina lentamente hasta quedar tierna y se sirve con todos los complementos tradicionales.',
    shortDescription: 'Tacos mexicanos con carne jugosa y guacamole',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
    prepTime: 20,
    cookTime: 180,
    servings: 8,
    difficulty: 'Difícil',
    category: 'platos-principales',
    tags: ['mexicano', 'cerdo', 'tacos', 'fiesta', 'tradicional'],
    isFeatured: true,
    ingredients: [
      { name: 'Carne de cerdo', quantity: '1', unit: 'kg (paleta)' },
      { name: 'Aguacate Hass', quantity: '3', unit: 'maduros', productSlug: 'aguacate-hass' },
      { name: 'Tortillas de maíz', quantity: '16', unit: 'pequeñas' },
      { name: 'Cebolla blanca', quantity: '1', unit: 'grande' },
      { name: 'Cilantro', quantity: '1', unit: 'manojo', productSlug: 'cilantro' },
      { name: 'Limón', quantity: '4', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Naranja', quantity: '1', unit: 'grande' },
      { name: 'Ajo', quantity: '6', unit: 'dientes' },
      { name: 'Comino', quantity: '1', unit: 'cucharadita' },
      { name: 'Sal', quantity: '2', unit: 'cucharaditas' }
    ],
    steps: [
      'Corta la carne en cubos grandes de 5cm. Sazona con sal y comino.',
      'Coloca la carne en una olla con el jugo de naranja, media cebolla y los ajos.',
      'Añade agua hasta cubrir y cocina a fuego bajo por 2-3 horas.',
      'Cuando la carne esté tierna, sube el fuego para evaporar el líquido.',
      'Deja que la carne se dore en su propia grasa, desmenuzando con dos tenedores.',
      'Prepara el guacamole: machaca los aguacates con limón, sal y cilantro.',
      'Pica finamente la cebolla restante y el cilantro para acompañar.',
      'Calienta las tortillas en un comal o sartén.',
      'Sirve las carnitas en las tortillas con guacamole, cebolla, cilantro y limón.'
    ],
    tips: [
      'La clave está en la cocción lenta - no tengas prisa.',
      'Guarda la grasa del cerdo para cocinar frijoles.',
      'Puedes hacer las carnitas el día anterior y recalentar.'
    ],
    nutrition: {
      calories: 420,
      protein: '28g',
      carbs: '25g',
      fat: '26g',
      fiber: '6g'
    },
    createdAt: '2024-01-28'
  },
  {
    id: '15',
    slug: 'mousse-aguacate-chocolate',
    title: 'Mousse de Aguacate y Chocolate',
    description: 'Un postre sorprendente y saludable donde el aguacate crea una textura increíblemente cremosa. Rico en grasas buenas y con todo el sabor del chocolate negro.',
    shortDescription: 'Postre cremoso y saludable con chocolate',
    image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'Fácil',
    category: 'postres',
    tags: ['chocolate', 'saludable', 'vegano', 'sin cocción', 'cremoso'],
    isFeatured: false,
    ingredients: [
      { name: 'Aguacate Hass', quantity: '2', unit: 'maduros', productSlug: 'aguacate-hass' },
      { name: 'Cacao en polvo', quantity: '1/4', unit: 'taza' },
      { name: 'Miel o jarabe de maple', quantity: '3', unit: 'cucharadas' },
      { name: 'Leche de almendras', quantity: '2', unit: 'cucharadas' },
      { name: 'Extracto de vainilla', quantity: '1', unit: 'cucharadita' },
      { name: 'Sal', quantity: '1', unit: 'pizca' },
      { name: 'Fresas', quantity: '1/2', unit: 'taza', productSlug: 'fresas', isOptional: true }
    ],
    steps: [
      'Corta los aguacates por la mitad y retira el hueso.',
      'Saca la pulpa con una cuchara y colócala en un procesador de alimentos.',
      'Añade el cacao en polvo, la miel, la leche de almendras, la vainilla y la sal.',
      'Procesa durante 2-3 minutos, raspando los lados, hasta obtener una textura muy suave.',
      'Prueba y ajusta el dulzor según tu preferencia.',
      'Divide el mousse en 4 recipientes pequeños.',
      'Refrigera por al menos 30 minutos para que tome consistencia.',
      'Decora con fresas frescas o virutas de chocolate antes de servir.'
    ],
    tips: [
      'Usa aguacates muy maduros para la mejor textura.',
      'No detectarás el sabor del aguacate, solo la cremosidad.',
      'Puedes añadir una cucharada de mantequilla de maní para más sabor.'
    ],
    nutrition: {
      calories: 220,
      protein: '3g',
      carbs: '22g',
      fat: '16g',
      fiber: '8g'
    },
    createdAt: '2024-01-29'
  },
  {
    id: '16',
    slug: 'bowl-buddha-quinoa',
    title: 'Buddha Bowl de Quinoa con Aguacate',
    description: 'Un bowl nutritivo y colorido con quinoa, vegetales asados, garbanzos crujientes y aguacate cremoso. Perfecto para meal prep y comidas saludables.',
    shortDescription: 'Bowl nutritivo con granos y vegetales',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    difficulty: 'Media',
    category: 'platos-principales',
    tags: ['bowl', 'vegetariano', 'quinoa', 'meal prep', 'nutritivo'],
    isFeatured: false,
    ingredients: [
      { name: 'Quinoa', quantity: '1', unit: 'taza' },
      { name: 'Aguacate Hass', quantity: '1', unit: 'grande', productSlug: 'aguacate-hass' },
      { name: 'Garbanzos cocidos', quantity: '1', unit: 'taza' },
      { name: 'Zanahoria', quantity: '2', unit: 'medianas' },
      { name: 'Brócoli', quantity: '2', unit: 'tazas' },
      { name: 'Espinaca', quantity: '2', unit: 'tazas', productSlug: 'espinaca' },
      { name: 'Limón', quantity: '1', unit: 'unidad', productSlug: 'limon-tahiti' },
      { name: 'Tahini', quantity: '2', unit: 'cucharadas' },
      { name: 'Aceite de oliva', quantity: '2', unit: 'cucharadas' },
      { name: 'Sal y especias', quantity: 'al gusto', unit: '' }
    ],
    steps: [
      'Cocina la quinoa según las instrucciones del paquete. Reserva.',
      'Precalienta el horno a 200°C.',
      'Corta las zanahorias en rodajas y separa el brócoli en floretes.',
      'Escurre los garbanzos y mézclalos con 1 cucharada de aceite y especias.',
      'Coloca zanahorias, brócoli y garbanzos en una bandeja de horno.',
      'Hornea por 20-25 minutos hasta que los vegetales estén tiernos y los garbanzos crujientes.',
      'Prepara el aderezo: mezcla tahini, jugo de limón, aceite y un poco de agua.',
      'Arma los bowls: coloca quinoa, espinaca, vegetales asados y aguacate en rodajas.',
      'Rocía con el aderezo de tahini y sirve.'
    ],
    tips: [
      'Prepara la quinoa y vegetales el domingo para tener almuerzo toda la semana.',
      'Varía los vegetales según la temporada.',
      'Añade tofu o pollo para más proteína.'
    ],
    nutrition: {
      calories: 480,
      protein: '16g',
      carbs: '52g',
      fat: '24g',
      fiber: '14g'
    },
    createdAt: '2024-01-30'
  },
  {
    id: '17',
    slug: 'nachos-guacamole-pico-gallo',
    title: 'Nachos Supremos con Guacamole',
    description: 'Nachos cargados con queso fundido, guacamole fresco, pico de gallo y crema. Perfectos para compartir en reuniones o para una noche de películas.',
    shortDescription: 'Nachos cargados perfectos para compartir',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&h=600&fit=crop',
    prepTime: 20,
    cookTime: 10,
    servings: 6,
    difficulty: 'Fácil',
    category: 'snacks',
    tags: ['mexicano', 'para compartir', 'fiesta', 'queso', 'antojo'],
    isFeatured: false,
    ingredients: [
      { name: 'Totopos o nachos', quantity: '300', unit: 'gramos' },
      { name: 'Aguacate Hass', quantity: '3', unit: 'maduros', productSlug: 'aguacate-hass' },
      { name: 'Queso cheddar', quantity: '2', unit: 'tazas rallado' },
      { name: 'Tomate', quantity: '2', unit: 'medianos', productSlug: 'tomate' },
      { name: 'Cebolla morada', quantity: '1/2', unit: 'pequeña', productSlug: 'cebolla-morada' },
      { name: 'Cilantro', quantity: '1/2', unit: 'taza', productSlug: 'cilantro' },
      { name: 'Limón', quantity: '3', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Crema ácida', quantity: '1/2', unit: 'taza' },
      { name: 'Jalapeños en rodajas', quantity: '1/4', unit: 'taza', isOptional: true }
    ],
    steps: [
      'Precalienta el horno a 180°C.',
      'Prepara el pico de gallo: pica tomate, cebolla y cilantro. Mezcla con jugo de 1 limón y sal.',
      'Prepara el guacamole: machaca los aguacates, añade limón, cilantro, sal y un poco de cebolla picada.',
      'Extiende los nachos en una bandeja para horno.',
      'Cubre con el queso cheddar rallado.',
      'Hornea por 8-10 minutos hasta que el queso esté fundido y burbujeante.',
      'Retira del horno y coloca cucharadas de guacamole por encima.',
      'Añade el pico de gallo, la crema ácida y los jalapeños.',
      '¡Sirve inmediatamente mientras el queso está caliente!'
    ],
    tips: [
      'Puedes añadir carne molida sazonada o pollo desmenuzado.',
      'Los nachos de bolsa funcionan, pero los caseros son mejores.',
      'Sirve salsas adicionales como salsa verde o roja.'
    ],
    nutrition: {
      calories: 380,
      protein: '12g',
      carbs: '32g',
      fat: '24g',
      fiber: '7g'
    },
    createdAt: '2024-01-31'
  },
  {
    id: '18',
    slug: 'ensalada-quinoa-mediterranea',
    title: 'Ensalada Mediterránea de Quinoa',
    description: 'Una ensalada fresca inspirada en los sabores del Mediterráneo. Quinoa nutritiva con pepino, tomate cherry, aceitunas, queso feta y un aderezo de limón y hierbas.',
    shortDescription: 'Ensalada fresca con sabores mediterráneos',
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: 'Fácil',
    category: 'ensaladas',
    tags: ['mediterránea', 'quinoa', 'vegetariano', 'fresca', 'nutritiva'],
    isFeatured: false,
    ingredients: [
      { name: 'Quinoa', quantity: '1', unit: 'taza' },
      { name: 'Pepino', quantity: '1', unit: 'grande' },
      { name: 'Tomates cherry', quantity: '1', unit: 'taza' },
      { name: 'Aceitunas kalamata', quantity: '1/2', unit: 'taza' },
      { name: 'Queso feta', quantity: '100', unit: 'gramos' },
      { name: 'Cebolla morada', quantity: '1/4', unit: 'pequeña', productSlug: 'cebolla-morada' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Aceite de oliva', quantity: '4', unit: 'cucharadas' },
      { name: 'Orégano seco', quantity: '1', unit: 'cucharadita' },
      { name: 'Menta fresca', quantity: '2', unit: 'cucharadas', isOptional: true }
    ],
    steps: [
      'Cocina la quinoa en 2 tazas de agua con sal. Cocina por 15 minutos y deja enfriar.',
      'Corta el pepino en cubos pequeños.',
      'Corta los tomates cherry por la mitad.',
      'Pica la cebolla morada finamente.',
      'Corta el queso feta en cubos.',
      'Para el aderezo: mezcla aceite de oliva, jugo de limón, orégano, sal y pimienta.',
      'En un bowl grande, combina la quinoa fría con todos los vegetales.',
      'Añade las aceitunas y el queso feta.',
      'Vierte el aderezo y mezcla suavemente.',
      'Decora con menta fresca picada si deseas.'
    ],
    tips: [
      'Esta ensalada mejora después de reposar en la nevera por unas horas.',
      'Puedes añadir aguacate justo antes de servir.',
      'Funciona como acompañamiento o como plato principal ligero.'
    ],
    nutrition: {
      calories: 320,
      protein: '10g',
      carbs: '28g',
      fat: '20g',
      fiber: '5g'
    },
    createdAt: '2024-02-01'
  },
  {
    id: '19',
    slug: 'paletas-mango-chile',
    title: 'Paletas de Mango con Chile',
    description: 'Refrescantes paletas caseras de mango con un toque picante de chile. El contraste dulce-picante es irresistible en días calurosos. ¡Sabor mexicano en cada mordida!',
    shortDescription: 'Paletas refrescantes dulces y picantes',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 8,
    difficulty: 'Fácil',
    category: 'postres',
    tags: ['helado', 'mango', 'picante', 'mexicano', 'refrescante'],
    isFeatured: false,
    ingredients: [
      { name: 'Mango maduro', quantity: '3', unit: 'grandes', productSlug: 'mango' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Miel', quantity: '2', unit: 'cucharadas' },
      { name: 'Chile en polvo', quantity: '1', unit: 'cucharadita' },
      { name: 'Sal', quantity: '1/4', unit: 'cucharadita' },
      { name: 'Chamoy', quantity: '2', unit: 'cucharadas', isOptional: true }
    ],
    steps: [
      'Pela los mangos y corta la pulpa en trozos.',
      'Coloca el mango en la licuadora con el jugo de limón y la miel.',
      'Licúa hasta obtener un puré suave.',
      'Vierte la mezcla en moldes para paletas, llenando 3/4 partes.',
      'Mezcla el chile en polvo con la sal.',
      'Espolvorea un poco de la mezcla de chile-sal en cada molde.',
      'Si usas chamoy, añade unas gotas.',
      'Inserta los palitos y congela por al menos 4 horas o toda la noche.',
      'Para desmoldar, pasa el molde brevemente bajo agua tibia.'
    ],
    tips: [
      'Usa mangos muy maduros para más dulzor natural.',
      'Ajusta la cantidad de chile según tu tolerancia al picante.',
      'Puedes hacer versión sin chile para los niños.'
    ],
    nutrition: {
      calories: 80,
      protein: '1g',
      carbs: '20g',
      fat: '0g',
      fiber: '2g'
    },
    createdAt: '2024-02-02'
  },
  {
    id: '20',
    slug: 'hummus-aguacate-verde',
    title: 'Hummus Verde de Aguacate',
    description: 'Una fusión deliciosa entre el hummus tradicional y el guacamole. Cremoso, nutritivo y lleno de sabor. Perfecto para dipear con vegetales o pita.',
    shortDescription: 'Dip cremoso fusión de hummus y aguacate',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 0,
    servings: 6,
    difficulty: 'Fácil',
    category: 'snacks',
    tags: ['dip', 'vegetariano', 'proteína', 'sin cocción', 'saludable'],
    isFeatured: false,
    ingredients: [
      { name: 'Garbanzos cocidos', quantity: '1', unit: 'lata (400g)' },
      { name: 'Aguacate Hass', quantity: '1', unit: 'grande', productSlug: 'aguacate-hass' },
      { name: 'Tahini', quantity: '2', unit: 'cucharadas' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Ajo', quantity: '1', unit: 'diente' },
      { name: 'Cilantro', quantity: '1/4', unit: 'taza', productSlug: 'cilantro' },
      { name: 'Aceite de oliva', quantity: '3', unit: 'cucharadas' },
      { name: 'Comino', quantity: '1/2', unit: 'cucharadita' },
      { name: 'Sal', quantity: '1/2', unit: 'cucharadita' }
    ],
    steps: [
      'Escurre y enjuaga los garbanzos.',
      'Coloca los garbanzos en el procesador de alimentos y procesa hasta formar una pasta.',
      'Añade la pulpa del aguacate, el tahini, el jugo de limón, el ajo y el comino.',
      'Procesa hasta obtener una mezcla suave y cremosa.',
      'Con el procesador funcionando, añade el aceite de oliva en un hilo.',
      'Añade el cilantro y procesa brevemente para incorporar.',
      'Prueba y ajusta la sal y el limón.',
      'Sirve en un bowl con un chorrito de aceite de oliva y semillas de sésamo.',
      'Acompaña con pan pita, vegetales crudos o nachos.'
    ],
    tips: [
      'Para un hummus más suave, pela los garbanzos antes de procesar.',
      'Se conserva bien en la nevera por 3-4 días.',
      'El limón ayuda a que no se oxide el aguacate.'
    ],
    nutrition: {
      calories: 180,
      protein: '6g',
      carbs: '18g',
      fat: '10g',
      fiber: '6g'
    },
    createdAt: '2024-02-03'
  },
  {
    id: '21',
    slug: 'salmon-costra-aguacate',
    title: 'Salmón con Costra de Aguacate',
    description: 'Filetes de salmón horneados con una deliciosa costra de aguacate y hierbas. Un plato elegante, saludable y lleno de omega-3.',
    shortDescription: 'Salmón elegante con costra cremosa',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'Media',
    category: 'platos-principales',
    tags: ['pescado', 'omega-3', 'horneado', 'elegante', 'proteína'],
    isFeatured: true,
    ingredients: [
      { name: 'Filetes de salmón', quantity: '4', unit: 'porciones (150g c/u)' },
      { name: 'Aguacate Hass', quantity: '2', unit: 'maduros', productSlug: 'aguacate-hass' },
      { name: 'Limón', quantity: '2', unit: 'unidades', productSlug: 'limon-tahiti' },
      { name: 'Ajo', quantity: '2', unit: 'dientes' },
      { name: 'Pan rallado', quantity: '1/2', unit: 'taza' },
      { name: 'Perejil', quantity: '2', unit: 'cucharadas' },
      { name: 'Aceite de oliva', quantity: '2', unit: 'cucharadas' },
      { name: 'Sal y pimienta', quantity: 'al gusto', unit: '' }
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Coloca los filetes de salmón en una bandeja con papel de hornear.',
      'Sazona con sal, pimienta y jugo de medio limón.',
      'Machaca los aguacates con el ajo picado, el perejil y el jugo del limón restante.',
      'Mezcla el pan rallado con una cucharada de aceite de oliva.',
      'Unta generosamente la mezcla de aguacate sobre cada filete de salmón.',
      'Espolvorea el pan rallado sobre la costra de aguacate.',
      'Rocía con el resto del aceite de oliva.',
      'Hornea por 18-20 minutos hasta que el salmón esté cocido y la costra dorada.',
      'Sirve con limón extra y vegetales al vapor.'
    ],
    tips: [
      'No hornees demasiado o el salmón quedará seco.',
      'Puedes usar este método con otros pescados como trucha o corvina.',
      'Acompaña con arroz o puré de papas.'
    ],
    nutrition: {
      calories: 380,
      protein: '35g',
      carbs: '12g',
      fat: '24g',
      fiber: '5g'
    },
    createdAt: '2024-02-04'
  },
  {
    id: '22',
    slug: 'smoothie-bowl-pitaya',
    title: 'Smoothie Bowl de Pitaya y Banano',
    description: 'Un bowl vibrante de color rosa intenso hecho con pitaya (fruta del dragón). Cremoso, refrescante y perfecto para un desayuno fotogénico y nutritivo.',
    shortDescription: 'Bowl rosa vibrante con superfoods',
    image: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'Fácil',
    category: 'desayunos',
    tags: ['smoothie bowl', 'pitaya', 'superfoods', 'vegano', 'fotogénico'],
    isFeatured: false,
    ingredients: [
      { name: 'Pitaya congelada', quantity: '100', unit: 'gramos' },
      { name: 'Banano congelado', quantity: '1', unit: 'unidad', productSlug: 'banano' },
      { name: 'Leche de coco', quantity: '1/4', unit: 'taza' },
      { name: 'Fresas', quantity: '1/4', unit: 'taza', productSlug: 'fresas' },
      { name: 'Granola', quantity: '3', unit: 'cucharadas' },
      { name: 'Coco rallado', quantity: '1', unit: 'cucharada' },
      { name: 'Semillas de chía', quantity: '1', unit: 'cucharadita' },
      { name: 'Miel', quantity: '1', unit: 'cucharadita', isOptional: true }
    ],
    steps: [
      'Coloca la pitaya congelada y el banano en la licuadora.',
      'Añade la leche de coco (solo lo necesario para licuar).',
      'Licúa hasta obtener una consistencia espesa como helado suave.',
      'Vierte en un bowl.',
      'Corta las fresas en rodajas.',
      'Decora la superficie con las fresas, granola, coco rallado y semillas de chía.',
      'Rocía con miel si deseas más dulzor.',
      '¡Disfruta inmediatamente con una cuchara!'
    ],
    tips: [
      'La pitaya debe estar bien congelada para la textura correcta.',
      'Puedes encontrar pitaya congelada en tiendas de productos saludables.',
      'No añadas mucho líquido o quedará muy aguado.'
    ],
    nutrition: {
      calories: 310,
      protein: '5g',
      carbs: '55g',
      fat: '10g',
      fiber: '9g'
    },
    createdAt: '2024-02-05'
  },
  {
    id: '23',
    slug: 'ensalada-espinaca-fresa',
    title: 'Ensalada de Espinaca con Fresas',
    description: 'Una ensalada elegante que combina espinaca baby con fresas dulces, queso de cabra cremoso y nueces caramelizadas. El aderezo balsámico completa el balance perfecto.',
    shortDescription: 'Ensalada dulce-salada con fresas frescas',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 5,
    servings: 4,
    difficulty: 'Fácil',
    category: 'ensaladas',
    tags: ['espinaca', 'fresas', 'elegante', 'nueces', 'queso de cabra'],
    isFeatured: false,
    ingredients: [
      { name: 'Espinaca baby', quantity: '4', unit: 'tazas', productSlug: 'espinaca' },
      { name: 'Fresas', quantity: '2', unit: 'tazas', productSlug: 'fresas' },
      { name: 'Queso de cabra', quantity: '100', unit: 'gramos' },
      { name: 'Nueces', quantity: '1/2', unit: 'taza' },
      { name: 'Vinagre balsámico', quantity: '3', unit: 'cucharadas' },
      { name: 'Aceite de oliva', quantity: '4', unit: 'cucharadas' },
      { name: 'Miel', quantity: '1', unit: 'cucharada' },
      { name: 'Sal y pimienta', quantity: 'al gusto', unit: '' }
    ],
    steps: [
      'Lava y seca bien la espinaca. Colócala en un bowl grande.',
      'Lava las fresas y córtalas en rodajas.',
      'En una sartén pequeña, tuesta las nueces a fuego medio por 3-4 minutos.',
      'Para el aderezo: mezcla el vinagre balsámico, aceite de oliva, miel, sal y pimienta.',
      'Desmenuza el queso de cabra en trozos pequeños.',
      'Añade las fresas a la espinaca.',
      'Vierte el aderezo y mezcla suavemente.',
      'Reparte en platos y decora con el queso de cabra y las nueces tostadas.',
      'Sirve inmediatamente.'
    ],
    tips: [
      'Puedes sustituir el queso de cabra por feta o gorgonzola.',
      'Añade pollo a la plancha para una comida más completa.',
      'Las almendras laminadas también funcionan muy bien.'
    ],
    nutrition: {
      calories: 280,
      protein: '8g',
      carbs: '16g',
      fat: '22g',
      fiber: '4g'
    },
    createdAt: '2024-02-06'
  },
  {
    id: '24',
    slug: 'bolitas-energia-datiles',
    title: 'Bolitas de Energía de Dátiles y Cacao',
    description: 'Snacks energéticos sin cocción hechos con dátiles, nueces y cacao. Perfectos para un boost de energía antes del ejercicio o como merienda saludable.',
    shortDescription: 'Snack energético sin azúcar añadida',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop',
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    difficulty: 'Fácil',
    category: 'snacks',
    tags: ['energía', 'dátiles', 'sin cocción', 'vegano', 'fitness'],
    isFeatured: false,
    ingredients: [
      { name: 'Dátiles Medjool', quantity: '200', unit: 'gramos (sin hueso)' },
      { name: 'Almendras', quantity: '1', unit: 'taza' },
      { name: 'Cacao en polvo', quantity: '2', unit: 'cucharadas' },
      { name: 'Coco rallado', quantity: '3', unit: 'cucharadas' },
      { name: 'Mantequilla de maní', quantity: '1', unit: 'cucharada' },
      { name: 'Sal', quantity: '1', unit: 'pizca' },
      { name: 'Extracto de vainilla', quantity: '1/2', unit: 'cucharadita', isOptional: true }
    ],
    steps: [
      'Si los dátiles están muy secos, remójalos en agua tibia por 10 minutos y escúrrelos.',
      'Coloca las almendras en el procesador y procesa hasta obtener un polvo grueso.',
      'Añade los dátiles, cacao, 1 cucharada de coco, mantequilla de maní, sal y vainilla.',
      'Procesa hasta que la mezcla se una y forme una masa pegajosa.',
      'Con las manos ligeramente húmedas, forma bolitas del tamaño de una nuez.',
      'Rueda las bolitas en el coco rallado restante.',
      'Coloca en una bandeja y refrigera por al menos 30 minutos.',
      'Guarda en un contenedor hermético en la nevera hasta por 2 semanas.',
      '¡Listas para comer cuando necesites energía!'
    ],
    tips: [
      'Puedes usar otras nueces como nueces de Brasil o avellanas.',
      'Añade una cucharada de proteína en polvo para más poder.',
      'Perfectas para llevar al gimnasio o la oficina.'
    ],
    nutrition: {
      calories: 95,
      protein: '2g',
      carbs: '14g',
      fat: '5g',
      fiber: '2g'
    },
    createdAt: '2024-02-07'
  },
  {
    id: '25',
    slug: 'arroz-coco-mango',
    title: 'Arroz con Coco y Mango',
    description: 'Un postre asiático inspirado en el famoso sticky rice tailandés. Arroz cremoso cocido en leche de coco, servido con mango fresco y dulce.',
    shortDescription: 'Postre cremoso tailandés con mango',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    difficulty: 'Media',
    category: 'postres',
    tags: ['tailandés', 'arroz', 'coco', 'mango', 'asiático'],
    isFeatured: false,
    ingredients: [
      { name: 'Arroz para sushi o glutinoso', quantity: '1', unit: 'taza' },
      { name: 'Leche de coco', quantity: '400', unit: 'ml' },
      { name: 'Mango maduro', quantity: '2', unit: 'grandes', productSlug: 'mango' },
      { name: 'Azúcar', quantity: '4', unit: 'cucharadas' },
      { name: 'Sal', quantity: '1/4', unit: 'cucharadita' },
      { name: 'Semillas de sésamo', quantity: '1', unit: 'cucharada', isOptional: true }
    ],
    steps: [
      'Lava el arroz hasta que el agua salga clara.',
      'Cocina el arroz con 1 taza de agua según las instrucciones.',
      'Una vez cocido, añade 3/4 de la leche de coco, el azúcar y la sal.',
      'Cocina a fuego bajo, revolviendo, hasta que el arroz absorba la leche (10-15 min).',
      'El arroz debe quedar cremoso y ligeramente pegajoso.',
      'Deja reposar tapado por 5 minutos.',
      'Pela los mangos y córtalos en rodajas.',
      'Sirve el arroz tibio con las rodajas de mango al lado.',
      'Rocía con la leche de coco restante y las semillas de sésamo.'
    ],
    tips: [
      'El arroz glutinoso da la textura más auténtica.',
      'Puedes servir frío también - refrigera el arroz y sírvelo como postre.',
      'El mango debe estar muy maduro y dulce.'
    ],
    nutrition: {
      calories: 380,
      protein: '5g',
      carbs: '58g',
      fat: '16g',
      fiber: '3g'
    },
    createdAt: '2024-02-08'
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
