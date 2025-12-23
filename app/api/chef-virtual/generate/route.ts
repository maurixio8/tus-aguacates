import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe, isChefVirtualAvailable } from '@/lib/gemini-recipe-service';

export const dynamic = 'force-dynamic';

/**
 * API para generar recetas con el Chef Virtual
 * POST /api/chef-virtual/generate
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el servicio esté disponible
    if (!isChefVirtualAvailable()) {
      return NextResponse.json(
        { error: 'El servicio de Chef Virtual no está disponible. Contacta al administrador.', success: false },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { ingredients, preferences } = body;

    // Validar ingredientes
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Debes ingresar al menos un ingrediente', success: false },
        { status: 400 }
      );
    }

    // Validar que los ingredientes sean strings
    if (!ingredients.every((ing: string) => typeof ing === 'string' && ing.trim().length > 0)) {
      return NextResponse.json(
        { error: 'Los ingredientes deben ser textos válidos', success: false },
        { status: 400 }
      );
    }

    // Validar límites de ingredientes (máximo 20)
    if (ingredients.length > 20) {
      return NextResponse.json(
        { error: 'Máximo 20 ingredientes permitidos', success: false },
        { status: 400 }
      );
    }

    // Generar la receta
    const result = await generateRecipe(ingredients, preferences);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipe: result.recipe
    });

  } catch (error) {
    console.error('Error en Chef Virtual API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
