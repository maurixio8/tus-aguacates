'use client';

import { Building2, Store, Copy, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SUPPLIERS, getSupplierById } from '@/lib/suppliers-config';
import type { ProductGrouped } from './page';

interface SupplierViewProps {
  productsBySupplier: Map<string, {
    products: ProductGrouped[];
    totalCost: number;
    totalWeight: number;
    customerCount: number;
  }>;
  selectedOrdersCount: number;
  onCopySupplierList: (supplierId: string) => void;
  onCopyAllLists: () => void;
  copiedItems: Set<string>;
  formatPrice: (price: number) => string;
}

export default function SupplierView({
  productsBySupplier,
  selectedOrdersCount,
  onCopySupplierList,
  onCopyAllLists,
  copiedItems,
  formatPrice
}: SupplierViewProps) {
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  const toggleSupplierExpanded = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId);
    } else {
      newExpanded.add(supplierId);
    }
    setExpandedSuppliers(newExpanded);
  };

  // Ordenar proveedores por orden de visita
  const suppliersInOrder = SUPPLIERS.sort((a, b) => a.order - b.order);

  // Calcular total general
  const grandTotal = useMemo(() => {
    let total = 0;
    productsBySupplier.forEach(supplier => {
      total += supplier.totalCost;
    });
    return total;
  }, [productsBySupplier]);

  return (
    <div className="space-y-4">
      {/* Resumen de Costos por Bodega */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">💰 Resumen de Costos por Bodega</h2>
          <button
            onClick={onCopyAllLists}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            Copiar Todas las Listas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {suppliersInOrder.map(supplier => {
            const supplierData = productsBySupplier.get(supplier.id);
            if (!supplierData) return null;

            return (
              <div
                key={supplier.id}
                className={`p-4 rounded-lg border ${supplierData.products.length > 0
                  ? supplier.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : supplier.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : supplier.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{supplier.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{supplier.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.location || ''}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Productos:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{supplierData.products.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Clientes:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{supplierData.customerCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                    <span className={`font-bold ${supplierData.totalCost > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                      {formatPrice(supplierData.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">TOTAL GENERAL</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Lista Detallada por Bodega */}
      <div className="space-y-4">
        {suppliersInOrder.map(supplier => {
          const supplierData = productsBySupplier.get(supplier.id);
          if (!supplierData || supplierData.products.length === 0) return null;

          const isExpanded = expandedSuppliers.has(supplier.id);
          const isCopied = copiedItems.has(`supplier-${supplier.id}`);

          return (
            <div
              key={supplier.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header de Bodega */}
              <div
                className={`p-4 flex items-center justify-between cursor-pointer ${supplier.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-b-green-200 dark:border-b-green-800'
                  : supplier.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 border-b-orange-200 dark:border-b-orange-800'
                    : supplier.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-b-red-200 dark:border-b-red-800'
                      : supplier.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 border-b-purple-200 dark:border-b-purple-800'
                        : 'bg-gray-50 dark:bg-gray-800/20 border-b-gray-200 dark:border-gray-700'
                  }`}
                onClick={() => toggleSupplierExpanded(supplier.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{supplier.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {supplierData.products.length} productos • {supplierData.customerCount} clientes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopySupplierList(supplier.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${isCopied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    title="Copiar lista de compras"
                  >
                    {isCopied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Lista de Productos */}
              {isExpanded && (
                <div className="p-4 space-y-2">
                  {supplierData.products.map(product => {
                    const weightDisplay = product.total_weight_display ? `| 📏 ${product.total_weight_display}` : '';
                    const variantDisplay = product.variant_name ? `(${product.variant_name})` : '';

                    return (
                      <div
                        key={product.grouping_key}
                        className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {product.total_quantity}x {product.product_name} {variantDisplay}
                            </p>
                            {product.unit_price > 0 && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {formatPrice(product.unit_price)} c/u
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {product.total_weight_display && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                {product.total_weight_display}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {product.customer_breakdown.length} cliente{product.customer_breakdown.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
