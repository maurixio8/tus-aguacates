'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, X, Heart, MessageCircle, Share2, Sparkles, ShoppingBag, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Video {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  title: string;
}

interface VideoComment {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  full_name?: string;
}

// Probamos con la ruta base que parece ser la más probable según Nginx
const VIDEOS_BASE_URL = 'https://tusaguacates.com/media/videos';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/invites/contact/?igsh=aw5gc4o2dib7&utm_content=mb2lvuk',
  facebook: 'https://www.facebook.com/aguacates.laesmeralda?mibextid=ZbWKwL',
  whatsapp: 'https://wa.me/573042587277',
};

const COLORS = {
  verdeBosque: '#2D5016',
  verdeAguacate: '#6B8E23',
  naranja: '#E8A838',
  crema: '#FFFEF5',
};

const VIDEO_TITLES = [
  'Receta de Aguacate', 'Cómo hacer Guacamole', 'Tips con Aguacate', 'Receta Tropical',
  'Consejo del Día', 'Preparación Fresca', 'Receta Saludable', 'Aguacate Perfecto',
  'Cocina con Aguacate', 'Recetas del Chef', 'Video Educativo', 'Tutorial de Cocina',
  'Truco Culinario', 'Ingrediente Secreto', 'Preparación Express',
];

const SIMULATED_LIKES = Array.from({ length: 183 }, () => Math.floor(Math.random() * 48) + 2);

export default function VideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const REMINDER_INTERVAL = 10; // Mostrar recordatorio cada 10 videos

  useEffect(() => {
    const videoList: Video[] = [];
    for (let i = 1; i <= 183; i++) {
      const titleIndex = (i - 1) % VIDEO_TITLES.length;
      const variation = Math.floor((i - 1) / VIDEO_TITLES.length) + 1;
      videoList.push({
        id: `video-${i}`,
        filename: `video-${i}.mp4`,
        url: `${VIDEOS_BASE_URL}/video-${i}.mp4`,
        // Las miniaturas están en la subcarpeta /thumbnails/ según estructura del servidor
        thumbnailUrl: `${VIDEOS_BASE_URL}/thumbnails/video-${i}.jpg`,
        title: `${variation > 1 ? `${VIDEO_TITLES[titleIndex]} #${variation}` : VIDEO_TITLES[titleIndex]} ${i}`
      });
    }
    setVideos(videoList);

    // Limpiar contador antiguo de videos bloqueados (ya no usamos límite)
    localStorage.removeItem('videosViewed');

    const urlParams = new URLSearchParams(window.location.search);
    const videoIdFromUrl = urlParams.get('v');
    if (videoIdFromUrl) {
      const index = videoList.findIndex(v => v.id === videoIdFromUrl);
      if (index !== -1) {
        setCurrentVideoIndex(index);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchLikes = async () => {
        const { data } = await supabase.from('video_likes').select('video_id').eq('user_id', user.id);
        if (data) {
          const likesMap: Record<string, boolean> = {};
          data.forEach(like => { likesMap[like.video_id] = true; });
          setLikedVideos(likesMap);
        }
      };
      fetchLikes();
    }
  }, [user]);

  useEffect(() => {
    if (currentVideoIndex !== null && videos.length > 0) {
      const videoId = videos[currentVideoIndex].id;
      const fetchComments = async () => {
        const { data } = await supabase.from('video_comments').select('*').eq('video_id', videoId).order('created_at', { ascending: false });
        if (data) setComments(data);
      };
      fetchComments();
    }
  }, [currentVideoIndex, videos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentVideoIndex === null) return;
      if (e.key === 'ArrowUp' || e.key === 'w') goToPrevVideo();
      else if (e.key === 'ArrowDown' || e.key === 's') goToNextVideo();
      else if (e.key === 'Escape') closeVideo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length]);

  const goToNextVideo = useCallback(() => {
    if (currentVideoIndex !== null && currentVideoIndex < videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      // Mostrar recordatorio cada 10 videos si no está registrado
      const isRegistered = !!user || localStorage.getItem('userRegistered') === 'true';
      if (!isRegistered && (newIndex + 1) % REMINDER_INTERVAL === 0) {
        setShowLimitModal(true);
      }
    }
  }, [currentVideoIndex, videos.length, user]);

  const goToPrevVideo = useCallback(() => {
    if (currentVideoIndex !== null && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  }, [currentVideoIndex]);

  const updateViewCount = (index: number) => {
    // Ya no guardamos contador - los videos son libres
  };

  const handleVideoClick = (index: number) => {
    setCurrentVideoIndex(index);
  };
  const toggleLike = async (videoId: string) => {
    if (!user) {
      setLikedVideos(prev => ({ ...prev, [videoId]: !prev[videoId] }));
      return;
    }
    const isLiked = likedVideos[videoId];
    setLikedVideos(prev => ({ ...prev, [videoId]: !isLiked }));
    if (isLiked) {
      await supabase.from('video_likes').delete().eq('user_id', user.id).eq('video_id', videoId);
    } else {
      await supabase.from('video_likes').insert({ user_id: user.id, video_id: videoId });
    }
  };

  const submitComment = async () => {
    if (!user || !newComment.trim() || currentVideoIndex === null) return;
    const videoId = videos[currentVideoIndex].id;
    setIsSubmittingComment(true);
    try {
      const { data } = await supabase.from('video_comments').insert({ user_id: user.id, video_id: videoId, content: newComment.trim(), status: 'pending' }).select().single();
      if (data) {
        setComments(prev => [data, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const closeVideo = () => {
    if (videoRef.current) videoRef.current.pause();
    setCurrentVideoIndex(null);
  };

  const shareVideo = async (video: Video) => {
    const shareUrl = `${window.location.origin}/videos/${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, text: 'Mira este vídeo de Tus Aguacates', url: shareUrl }); } catch (err) { }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (currentVideoIndex === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50 && currentVideoIndex < videos.length - 1) goToNextVideo();
    else if (diff < -50 && currentVideoIndex > 0) goToPrevVideo();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.crema }}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.verdeBosque }}></div></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.crema }}>
      <div className="text-white py-3 px-4 sticky top-0 z-40 shadow-lg" style={{ background: `linear-gradient(135deg, ${COLORS.verdeBosque}, ${COLORS.verdeAguacate})` }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-2xl">🥑</span><h1 className="text-lg font-bold">Vídeos</h1></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-3">
        <div className="grid grid-cols-2 gap-4">
          {videos.map((video, index) => (
            <div key={video.id} className="relative cursor-pointer overflow-hidden group shadow-lg bg-gray-100" style={{ aspectRatio: '9/16', borderRadius: '16px', border: `3px solid ${COLORS.verdeBosque}` }} onClick={() => handleVideoClick(index)}>
              {/* Cargamos el video como miniatura (poster) y usamos preload="metadata" para ahorrar datos */}
              <video
                src={video.url}
                poster={video.thumbnailUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center"><Play className="w-10 h-10 text-white opacity-80 group-hover:scale-125 transition-transform" /></div>
              <div className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: COLORS.naranja, color: '#000' }}>#{index + 1}</div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-bold line-clamp-1">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentVideoIndex !== null && (
        <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#000' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl drop-shadow-md">🥑</span>
                <h3 className="text-white font-bold text-base drop-shadow-md line-clamp-1">{videos[currentVideoIndex].title}</h3>
              </div>
              <p className="text-white/80 text-xs drop-shadow-sm ml-7">{currentVideoIndex + 1} / {videos.length} • Tus Aguacates</p>
            </div>
            <button onClick={closeVideo} className="pointer-events-auto text-white p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors shadow-lg"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <video ref={videoRef} src={videos[currentVideoIndex].url} controls autoPlay playsInline className="h-full max-w-full object-contain" controlsList="nodownload" onEnded={goToNextVideo} crossOrigin="anonymous" />

            <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-6 items-center">
              <button onClick={() => toggleLike(videos[currentVideoIndex].id)} className="flex flex-col items-center gap-1 text-white group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${likedVideos[videos[currentVideoIndex].id] ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-black/40 backdrop-blur-md border border-white/20'}`}>
                  <Heart className={`w-6 h-6 ${likedVideos[videos[currentVideoIndex].id] ? 'fill-white' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold drop-shadow-md ${likedVideos[videos[currentVideoIndex].id] ? 'text-orange-400' : 'text-white'}`}>
                  {likedVideos[videos[currentVideoIndex].id] ? '¡Me gusta!' : SIMULATED_LIKES[currentVideoIndex]}
                </span>
              </button>

              <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 text-white group">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform"><MessageCircle className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold drop-shadow-md">Comentar</span>
              </button>

              <button onClick={() => shareVideo(videos[currentVideoIndex])} className="flex flex-col items-center gap-1 text-white group">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform"><Share2 className="w-6 h-6" /></div>
                <span className="text-[10px] font-bold drop-shadow-md">Compartir</span>
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col gap-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <img src="https://i.ibb.co/WWj50Qdy/logo.png" alt="Tus Aguacates" className="w-10 h-10 rounded-full object-contain bg-white p-1" />
                <div className="flex gap-3">
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-600 text-white shadow-lg hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                  <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-green-500 text-white shadow-lg hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></a>
                </div>
              </div>
              <a href="/tienda" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold bg-green-600 shadow-xl hover:scale-105 transition-transform active:scale-95"><ShoppingBag className="w-4 h-4" /><span className="text-sm">Ir a la Tienda</span></a>
            </div>
          </div>
        </div>
      )}

      {showComments && currentVideoIndex !== null && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/40" onClick={() => setShowComments(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-lg" style={{ color: COLORS.verdeBosque }}>Comentarios</h3>
              <button onClick={() => setShowComments(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><MessageCircle className="w-12 h-12 opacity-20" /><p>Aún no hay comentarios. ¡Sé el primero!</p></div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-1 border-b border-gray-50 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs" style={{ color: COLORS.verdeAguacate }}>{comment.user_id === user?.id ? 'Tú' : 'Usuario'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    {comment.status === 'pending' && <span className="text-[10px] font-medium bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full self-start">Esperando verificación del admin</span>}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 pb-10">
              {user ? (
                <div className="flex gap-2 items-center">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario amable..." className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-verde-aguacate" style={{ borderColor: COLORS.crema }} onKeyPress={(e) => e.key === 'Enter' && submitComment()} />
                  <button onClick={submitComment} disabled={isSubmittingComment || !newComment.trim()} className="p-3 rounded-xl text-white disabled:opacity-50 transition-all active:scale-95" style={{ backgroundColor: COLORS.verdeBosque }}><Send className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="text-center py-2"><p className="text-sm text-gray-500 mb-2">Regístrate para dejar tu comentario</p><button onClick={() => { setShowComments(false); setShowLimitModal(true); }} className="text-sm font-bold underline" style={{ color: COLORS.verdeBosque }}>Unirse ahora</button></div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <img src="https://i.ibb.co/WWj50Qdy/logo.png" alt="Tus Aguacates" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.verdeBosque }}>¡Únete a nuestra comunidad!</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed text-center px-4">Regístrate gratis para guardar tus videos favoritos, comentar y disfrutar de contenido exclusivo.</p>
            <div className="flex flex-col gap-3">
              <a href="/auth/registro" className="w-full px-4 py-3 rounded-xl font-bold text-white text-center" style={{ backgroundColor: COLORS.verdeBosque }}>Registrarse gratis</a>
              <button onClick={() => setShowLimitModal(false)} className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Continuar sin registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
