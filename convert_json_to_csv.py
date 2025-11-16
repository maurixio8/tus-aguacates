#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para convertir el JSON de productos de Tus Aguacates a CSV
Genera un archivo CSV compatible con el sistema de importación
"""

import json
import csv
import os
import sys

def clean_text(text):
    """Limpiar texto para CSV"""
    if not text:
        return ""
    return str(text).replace('"', '""').replace('\n', ' ').replace('\r', '')

def convert_json_to_csv():
    """Convertir JSON a CSV"""

    # Rutas de archivos
    json_path = "public/productos tus_aguacates.json"
    csv_path = "public/catalogo-productos.csv"

    print("🔄 Iniciando conversión JSON a CSV...")
    print(f"📂 Origen: {json_path}")
    print(f"📄 Destino: {csv_path}")

    # Verificar que existe el archivo JSON
    if not os.path.exists(json_path):
        print(f"❌ ERROR: No existe el archivo {json_path}")
        return False

    try:
        # Cargar JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print("✅ JSON cargado exitosamente")

        # Crear CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            # Escribir encabezados
            writer.writerow(['id', 'name', 'description', 'price', 'category', 'image'])

            product_id = 1
            total_products = 0
            categories_processed = 0

            # Procesar cada categoría
            for category in data.get('categories', []):
                category_name = clean_text(category.get('name', ''))
                categories_processed += 1

                print(f"📦 Procesando categoría: {category_name}")

                # Procesar cada producto en la categoría
                for product in category.get('products', []):
                    product_name = clean_text(product.get('name', ''))
                    description = clean_text(product.get('description', ''))
                    variants = product.get('variants', [])

                    # Si tiene variantes, crear una fila por variante
                    if variants:
                        for variant in variants:
                            variant_name = clean_text(variant.get('name', ''))
                            variant_price = variant.get('price', 0)

                            # Usar nombre de variante si existe, si no, nombre del producto
                            final_name = variant_name if variant_name else product_name

                            writer.writerow([
                                product_id,
                                final_name,
                                description,
                                variant_price,
                                category_name,
                                ''  # Sin imagen (vacío)
                            ])

                            product_id += 1
                            total_products += 1
                    else:
                        # Si no tiene variantes, usar el precio del producto si existe
                        product_price = product.get('price', 0)

                        writer.writerow([
                            product_id,
                            product_name,
                            description,
                            product_price,
                            category_name,
                            ''  # Sin imagen (vacío)
                        ])

                        product_id += 1
                        total_products += 1

        print(f"✅ CSV generado exitosamente!")
        print(f"📊 Estadísticas:")
        print(f"   - Categorías procesadas: {categories_processed}")
        print(f"   - Productos totales: {total_products}")
        print(f"   - Archivo guardado en: {csv_path}")

        # Verificar que el archivo se creó
        if os.path.exists(csv_path):
            file_size = os.path.getsize(csv_path)
            print(f"   - Tamaño del archivo: {file_size} bytes")

        return True

    except json.JSONDecodeError as e:
        print(f"❌ Error al decodificar JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    """Función principal"""
    print("🥑 Generador de CSV para Tus Aguacates")
    print("=" * 50)

    success = convert_json_to_csv()

    if success:
        print("\n🎉 Conversión completada exitosamente!")
        print("\n📋 Siguientes pasos:")
        print("1. Revisar el archivo generado: public/catalogo-productos.csv")
        print("2. Probar la importación en el sistema admin")
        print("3. Verificar que todos los productos aparezcan en la tienda")
        sys.exit(0)
    else:
        print("\n💥 La conversión falló")
        sys.exit(1)

if __name__ == "__main__":
    main()