/**
 * API Route: Generate Bold Integrity Hash
 * 
 * Este endpoint genera el hash SHA-256 requerido por Bold para validar
 * la integridad de las transacciones con monto definido.
 * 
 * IMPORTANTE: La llave secreta NUNCA debe exponerse en el frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Llave secreta de Bold (desde variables de entorno)
const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY || '';

interface HashRequest {
    orderId: string;
    amount: number;
    currency?: string;
}

interface HashResponse {
    hash: string;
    orderId: string;
    amount: number;
    currency: string;
}

/**
 * Genera un hash SHA-256 para Bold
 * Formato: {orderId}{amount}{currency}{secretKey}
 */
function generateBoldHash(orderId: string, amount: number, currency: string): string {
    const dataToHash = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        // Validar que tenemos la llave secreta
        if (!BOLD_SECRET_KEY) {
            console.error('[Bold Hash] BOLD_SECRET_KEY not configured');
            return NextResponse.json(
                { error: 'Bold integration not configured' },
                { status: 500 }
            );
        }

        const body: HashRequest = await request.json();
        const { orderId, amount, currency = 'COP' } = body;

        // Validaciones
        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            );
        }

        if (typeof amount !== 'number' || amount < 1000) {
            return NextResponse.json(
                { error: 'amount must be a number >= 1000 (minimum $1,000 COP)' },
                { status: 400 }
            );
        }

        // Generar hash
        const hash = generateBoldHash(orderId, amount, currency);

        console.log('[Bold Hash] Generated hash for order:', orderId);

        const response: HashResponse = {
            hash,
            orderId,
            amount,
            currency,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('[Bold Hash] Error generating hash:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
