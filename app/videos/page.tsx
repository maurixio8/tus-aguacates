'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, X, Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface Video {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  title: string;
}
  id: string;
  filename: string;
  url: string;
  title: string;
}

// Lista de vídeos del servidor
const VIDEOS_BASE_URL = 'https://tusaguacates.com/media/videos';

// Colores de la marca
const COLORS = {
  verdeBosque: '#2D5016',
  verdeAguacate: '#6B8E23',
  naranja: '#E8A838',
  crema: '#FFFEF5',
};

// Títulos de ejemplo para los vídeos
const VIDEO_TITLES = [
  'Receta de Aguacate',
  'Cómo hacer Guacamole',
  'Tips con Aguacate',
  'Receta Tropical',
  'Consejo del Día',
  'Preparación Fresca',
  'Receta Saludable',
  'Aguacate Perfecto',
  'Cocina con Aguacate',
  'Recetas del Chef',
  'Video Educativo',
  'Tutorial de Cocina',
  'Truco Culinario',
  'Ingrediente Secreto',
  'Preparación Express',
];

// Gradientes para las miniaturas (alternando colores de la marca)
const THUMBNAIL_GRADIENTS = [
  'from-green-600 to-green-800',
  'from-green-500 to-emerald-700',
  'from-emerald-600 to-green-700',
  'from-lime-600 to-green-700',
  'from-yellow-500 to-green-600',
  'from-orange-400 to-green-600',
  'from-amber-500 to-lime-600',
  'from-yellow-400 to-emerald-600',
];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [viewedCount, setViewedCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const MAX_FREE_VIDEOS = 10;

  useEffect(() => {
    // Cargar lista de vídeos
    const videoList: Video[] = [];
    for (let i = 1; i <= 183; i++) {
      const titleIndex = (i - 1) % VIDEO_TITLES.length;
      const variation = Math.floor((i - 1) / VIDEO_TITLES.length) + 1;
      const title = variation > 1 
        ? `${VIDEO_TITLES[titleIndex]} #${variation}` 
        : VIDEO_TITLES[titleIndex];
        
      videoList.push({
        id: `video-${i}`,
        filename: `video-${i}.mp4`,
        url: `${VIDEOS_BASE_URL}/video-${i}.mp4`,
        thumbnailUrl: `${VIDEOS_BASE_URL}/thumbnails/video-${i}.jpg`,
        title: `${title} ${i}`
      });
    }
    setVideos(videoList);
    // Cargar lista de vídeos
    const videoList: Video[] = [];
    for (let i = 1; i <= 183; i++) {
      const titleIndex = (i - 1) % VIDEO_TITLES.length;
      const variation = Math.floor((i - 1) / VIDEO_TITLES.length) + 1;
      const title = variation > 1 
        ? `${VIDEO_TITLES[titleIndex]} #${variation}` 
        : VIDEO_TITLES[titleIndex];
        
      videoList.push({
        id: `video-${i}`,
        filename: `video-${i}.mp4`,
        url: `${VIDEOS_BASE_URL}/video-${i}.mp4`,
        title: `${title} ${i}`
      });
    }
    setVideos(videoList);

    // Verificar vídeos vistos desde localStorage
    const viewed = localStorage.getItem('videosViewed');
    if (viewed) {
      setViewedCount(parseInt(viewed, 10));
    }
    setLoading(false);
  }, []);

  // Manejar swipe up/down
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (currentVideoIndex === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    // Swipe up (positive diff > 50px)
    if (diff > 50 && currentVideoIndex < videos.length - 1) {
      goToNextVideo();
    }
    // Swipe down (negative diff < -50px)
    else if (diff < -50 && currentVideoIndex > 0) {
      goToPrevVideo();
    }
  };

  // Manejar teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentVideoIndex === null) return;
      
      if (e.key === 'ArrowUp' || e.key === 'w') {
        goToPrevVideo();
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        goToNextVideo();
      } else if (e.key === 'Escape') {
        closeVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length]);

  const goToNextVideo = useCallback(() => {
    if (currentVideoIndex === null) return;
    if (currentVideoIndex < videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      updateViewCount(newIndex);
    }
  }, [currentVideoIndex, videos.length]);

  const goToPrevVideo = useCallback(() => {
    if (currentVideoIndex === null) return;
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(newIndex);
      updateViewCount(newIndex);
    }
  }, [currentVideoIndex]);

  const updateViewCount = (index: number) => {
    const newCount = index + 1;
    if (newCount > viewedCount) {
      setViewedCount(newCount);
      localStorage.setItem('videosViewed', newCount.toString());
    }
  };

  const handleVideoClick = (index: number) => {
    if (index >= MAX_FREE_VIDEOS && !localStorage.getItem('userRegistered')) {
      setShowLimitModal(true);
      return;
    }
    
    setCurrentVideoIndex(index);
    updateViewCount(index);
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentVideoIndex(null);
    setIsFullscreen(false);
  };

  // Compartir vídeo
  const shareVideo = async (video: Video) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: 'Mira este vídeo de Tus Aguacates',
          url: video.url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(video.url);
      alert('Enlace copiado al portapapeles');
    }
  };

  // Scroll to video when opened
  useEffect(() => {
    if (currentVideoIndex !== null && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    }
  }, [currentVideoIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.crema }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.verdeBosque }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.crema }}>
      {/* Header - Using brand colors */}
      <div 
        className="text-white py-3 px-4 sticky top-0 z-40 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${COLORS.verdeBosque}, ${COLORS.verdeAguacate})` }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥑</span>
            <h1 className="text-lg font-bold">Vídeos</h1>
          </div>
          <span 
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: COLORS.naranja, color: '#000' }}
          >
            {viewedCount}/{MAX_FREE_VIDEOS} gratis
          </span>
        </div>
      </div>

      {/* Video Grid - Vertical Format (9:16 like Instagram Stories) */}
      <div className="max-w-lg mx-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="relative cursor-pointer overflow-hidden rounded-xl group shadow-md"
              style={{ aspectRatio: '9/16' }}
              onClick={() => handleVideoClick(index)}
            >
              {/* Video Thumbnail - Real thumbnail from server */}
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 opacity-90 ml-1 text-white" />
                </div>
              </div>
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length]} flex items-center justify-center`}
              >
                <div className="text-white text-center p-3">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 opacity-90 ml-1" />
                  </div>
                  <span className="text-xs font-medium opacity-80">#{index + 1}</span>
                </div>
              </div>
              
              {/* Video Number Badge */}
              <div 
                className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-bold shadow-lg"
                style={{ backgroundColor: COLORS.naranja, color: '#000' }}
              >
                #{index + 1}
              </div>
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-md">
                  {video.title}
                </p>
              </div>

              {/* Brand watermark */}
              <div className="absolute top-2 right-2 opacity-50">
                <span className="text-xl">🥑</span>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay vídeos disponibles</p>
          </div>
        )}
      </div>

      {/* Fullscreen Video Player - TikTok/Instagram Stories Style */}
      {currentVideoIndex !== null && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: '#000' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeVideo}
            className="absolute top-4 right-4 z-20 text-white p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Progress indicators */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {videos.slice(currentVideoIndex, currentVideoIndex + 5).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>

          {/* Video Container */}
          <div className="flex-1 flex items-center justify-center relative">
            <video
              ref={videoRef}
              src={videos[currentVideoIndex].url}
              controls
              autoPlay
              playsInline
              className="h-full max-w-full object-contain"
              controlsList="nodownload"
              onEnded={goToNextVideo}
            />
            
            {/* Swipe hints - Only show on mobile */}
            <div className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <ChevronUp className="w-8 h-8" />
            </div>
            <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <ChevronDown className="w-8 h-8" />
            </div>
          </div>

          {/* Video Info */}
          <div className="absolute bottom-20 left-4 right-20 z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🥑</span>
              <h3 className="text-white font-bold text-lg">
                {videos[currentVideoIndex].title}
              </h3>
            </div>
            <p className="text-white/70 text-sm">
              Vídeo {currentVideoIndex + 1} de {videos.length} • Tus Aguacates
            </p>
          </div>

          {/* Action Buttons - Brand colors */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-5">
            <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-xs mt-1">Like</span>
            </button>
            <button className="flex flex-col items-center text-white hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs mt-1">Comment</span>
            </button>
            <button 
              onClick={() => shareVideo(videos[currentVideoIndex])}
              className="flex flex-col items-center text-white hover:scale-110 transition-transform"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.naranja }}
              >
                <Share2 className="w-6 h-6 text-black" />
              </div>
              <span className="text-xs mt-1 text-white/80">Share</span>
            </button>
          </div>

          {/* Brand watermark */}
          <div className="absolute bottom-20 left-4 z-10">
            <div className="flex items-center gap-1 text-white/50 text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Tus Aguacates</span>
            </div>
          </div>

          {/* Swipe instruction - desktop only */}
          <div className="hidden md:block absolute bottom-4 left-0 right-20 text-center text-white/30 text-xs">
            ↑↓ or W/S to navigate
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: COLORS.verdeBosque + '20' }}
            >
              <Play className="w-10 h-10" style={{ color: COLORS.verdeBosque }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.verdeBosque }}>
              ¡Has alcanzado el límite!
            </h2>
            <p className="text-gray-600 mb-6">
              Has visto <strong>{MAX_FREE_VIDEOS}</strong> vídeos gratuitos. 
              Regístrate para ver todos los vídeos sin límite y guarda tus favoritos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.verdeBosque, color: COLORS.verdeBosque }}
              >
                Ahora no
              </button>
              <a
                href="/auth/registro"
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: COLORS.verdeBosque }}
              >
                Registrarse
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
