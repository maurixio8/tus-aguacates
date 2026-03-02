import { Metadata, ResolvingMetadata } from 'next';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

const VIDEOS_BASE_URL = 'https://tusaguacates.com/media/videos';

// Esta función genera los metadatos dinámicos para redes sociales (OpenGraph)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  // Extraemos el número del video (ej: "video-42" -> 42)
  const videoNumber = id.replace('video-', '');
  const title = `Vídeo #${videoNumber} - Tus Aguacates`;
  const description = 'Mira este increíble contenido de Tus Aguacates Premium. ¡Recetas, tips y mucho más!';
  const imageUrl = `${VIDEOS_BASE_URL}/thumbnails/${id}.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tusaguacates.com/videos/${id}`,
      siteName: 'Tus Aguacates',
      images: [
        {
          url: imageUrl,
          width: 720,
          height: 1280,
          alt: title,
        },
      ],
      locale: 'es_CO',
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function VideoDynamicPage({ params }: Props) {
  const { id } = await params;
  
  // Redirigimos a la página principal de videos pasando el ID como parámetro
  // para que el cliente sepa qué video abrir automáticamente.
  redirect(`/videos?v=${id}`);
}
