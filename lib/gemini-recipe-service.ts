/**
 * Servicio para generar recetas usando DeepSeek API
 * DeepSeek es más económico y tiene mejor cuota gratuita
 */

// Tipos para la receta generada
export interface GeneratedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  steps: string[];
  tips?: string[];
  category?: string;
}

export interface ChefVirtualResponse {
  success: boolean;
  recipe?: GeneratedRecipe;
  error?: string;
}

// Configuración de DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * Genera una receta basada en los ingredientes disponibles usando DeepSeek
 */
export async function generateRecipe(
  ingredients: string[],
  preferences?: {
    cuisine?: string;
    difficulty?: 'Fácil' | 'Media' | 'Difícil';
    maxTime?: number;
  }
): Promise<ChefVirtualResponse> {
  // Verificar que la API key esté configurada
  if (!DEEPSEEK_API_KEY) {
    return {
      success: false,
      error: 'El servicio de Chef Virtual no está disponible. Contacta al administrador.'
    };
  }

  // Validar ingredientes
  if (!ingredients || ingredients.length === 0) {
    return {
      success: false,
      error: 'Debes ingresar al menos un ingrediente'
    };
  }

  try {
    // Construir el prompt optimizado
    const prompt = buildPrompt(ingredients, preferences);

    console.log('🧑‍🍳 Chef Virtual: Generando receta con DeepSeek, ingredientes:', ingredients);

    // Llamar a la API de DeepSeek
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un chef experto colombiano especializado en cocina con aguacates y frutas tropicales frescas. Siempre respondes en formato JSON válido para recetas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Error en DeepSeek API:', errorData);
      throw new Error(errorData.error?.message || 'Error en la API');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de la API');
    }

    console.log('✅ Receta generada exitosamente con DeepSeek');

    // Parsear el JSON
    let recipe: GeneratedRecipe;
    try {
      recipe = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // Intento extraer JSON del texto si hay errores
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo parsear la respuesta de la IA');
      }
    }

    // Validar estructura de la receta
    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      throw new Error('La receta generada no tiene la estructura correcta');
    }

    return {
      success: true,
      recipe
    };

  } catch (error) {
    console.error('Error generando receta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar la receta'
    };
  }
}

/**
 * Construye el prompt optimizado para DeepSeek
 */
function buildPrompt(
  ingredients: string[],
  preferences?: {
    cuisine?: string;
    difficulty?: 'Fácil' | 'Media' | 'Difícil';
    maxTime?: number;
  }
): string {
  const difficultyText = preferences?.difficulty
    ? `Dificultad: ${preferences.difficulty}`
    : 'Dificultad: Fácil o Media';

  const maxTimeText = preferences?.maxTime
    ? `Tiempo máximo: ${preferences.maxTime} minutos`
    : 'Tiempo máximo: 30 minutos';

  const cuisineText = preferences?.cuisine
    ? `Cocina: ${preferences.cuisine}`
    : 'Cocina: Colombiana o latinoamericana';

  return `INGREDIENTES DISPONIBLES: ${ingredients.join(', ')}

REQUISITOS:
1. Genera UNA receta creativa y deliciosa usando principalmente estos ingredientes
2. La receta debe ser:
   - ${difficultyText}
   - ${maxTimeText}
   - Saludable y nutritiva
   - Económica
3. ${cuisineText}
4. IMPORTANTE: La respuesta debe ser EXCLUSIVAMENTE un JSON válido con esta estructura exacta:
{
  "title": "Nombre de la receta",
  "description": "Descripción breve y apetitosa",
  "prepTime": 15,
  "cookTime": 10,
  "servings": 4,
  "difficulty": "Fácil",
  "ingredients": [
    {"name": "Aguacate", "quantity": "2", "unit": "unidades"},
    {"name": "Tomate", "quantity": "1", "unit": "grande"}
  ],
  "steps": [
    "Paso 1 con instrucciones claras...",
    "Paso 2 con instrucciones claras..."
  ],
  "tips": ["Tip útil 1...", "Tip útil 2..."],
  "category": "Platos Principales"
}

Genera la receta ahora. Responde SOLO con el JSON, sin texto adicional.`;
}

/**
 * Verifica si el servicio está disponible
 */
export function isChefVirtualAvailable(): boolean {
  return !!DEEPSEEK_API_KEY;
}

/**
 * Obtiene los límites del usuario según su suscripción
 */
export async function getUserRecipeLimits(userId: string) {
  // TODO: Implementar consulta a base de datos
  return {
    tier: 'free',
    recipesLimit: 2,
    canSave: false,
    savedRecipesLimit: 0
  };
}

/**
 * Verifica si el usuario puede generar más recetas hoy
 */
export async function canUserGenerateRecipe(userId: string): Promise<boolean> {
  // TODO: Implementar lógica de límites
  // Por defecto, usar localStorage para tracking en MVP
  return true;
}
