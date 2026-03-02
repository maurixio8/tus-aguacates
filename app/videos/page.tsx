'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, X, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Video {
  id: string;
  filename: string;
  url: string;
}

// Lista de vídeos del servidor
const VIDEOS_BASE_URL = 'https://tusaguacates.com/media/videos';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [viewedCount, setViewedCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const MAX_FREE_VIDEOS = 10;

  useEffect(() => {
    // Cargar lista de vídeos (simulado - en producción vendría de API)
    const videoList: Video[] = [];
    // Los vídeos se generan dinámicamente -ixer
    for (let i = 1; i <= 183; i++) {
      videoList.push({
        id: `video-${i}`,
        filename: `video-${i}.mp4`,
        url: `${VIDEOS_BASE_URL}/video-${i}.mp4`
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

  const handleVideoClick = (video: Video) => {
    const newCount = viewedCount + 1;
    if (newCount > MAX_FREE_VIDEOS && !localStorage.getItem('userRegistered')) {
      setShowLimitModal(true);
      return;
    }
    
    setViewedCount(newCount);
    localStorage.setItem('videosViewed', newCount.toString());
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-4 px-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Vídeos</h1>
          <span className="text-sm bg-green-700 px-3 py-1 rounded-full">
            {viewedCount}/{MAX_FREE_VIDEOS} gratuitos
          </span>
        </div>
      </div>

      {/* Video Grid - Instagram Style */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-1">
          {videos.map((video) => (
            <div
              key={video.id}
              className="aspect-square bg-gray-200 relative cursor-pointer overflow-hidden group"
              onClick={() => handleVideoClick(video)}
            >
              {/* Video Thumbnail - Using gradient as placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> Reproducir
                  </span>
                </div>
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

      {/* Video Modal - Full Screen */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeVideo}
            className="absolute top-4 right-4 z-10 text-white p-2"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Video */}
          <video
            ref={videoRef}
            src={selectedVideo.url}
            controls
            autoPlay
            className="max-h-screen max-w-full"
            controlsList="nodownload"
          />

          {/* Bottom info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 hover:text-green-400">
                  <Heart className="w-6 h-6" />
                  <span>Me gusta</span>
                </button>
                <button className="flex items-center gap-1 hover:text-green-400">
                  <MessageCircle className="w-6 h-6" />
                  <span>Comentar</span>
                </button>
              </div>
              <button className="flex items-center gap-1 hover:text-green-400">
                <Share2 className="w-6 h-6" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">¡Has alcanzado el límite!</h2>
            <p className="text-gray-600 mb-6">
              Has visto {MAX_FREE_VIDEOS} vídeos gratuitos. Regístrate para ver todos los vídeos sin límite 
              y guarda tus favoritos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Ahora no
              </button>
              <a
                href="/auth/registro"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
