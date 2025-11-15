'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ProductCardSlider } from './ProductCardSlider';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import type { Product } from '@/lib/productStorage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ProductSwiperProps {
  products: Product[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export default function ProductSwiper({
  products,
  title = "Productos",
  showViewAll = false,
  viewAllHref = "/tienda"
}: ProductSwiperProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="relative px-4">
      {/* Header con título y botón "Ver todos" */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            {title}
          </h2>
          {showViewAll && (
            <Link href={viewAllHref} className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-1">
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Swiper */}
      <Swiper
        modules={[Autoplay, Navigation, FreeMode]}
        spaceBetween={16}
        slidesPerView={1.2}
        freeMode={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        breakpoints={{
          480: { slidesPerView: 2.2 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 },
          1280: { slidesPerView: 5 },
        }}
        className="!pb-2"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCardSlider
              product={product}
              onProductClick={setSelectedProduct}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Botones de navegación - Desktop only */}
      <button className="swiper-button-prev-custom hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button className="swiper-button-next-custom hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <ProductQuickViewModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}