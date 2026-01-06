"use client";

import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import Image from "next/image";
import React from "react";

interface MediaContentProps {
  content: Array<{
    id: number;
    file: string;
  }>;
}

const MediaContent = ({ content }: MediaContentProps) => {
  const imageModal = useImageModal();

  // Filtra apenas as imagens
  const images = content.filter((file) => {
    const fileUrl = file.file.toLowerCase();
    return !(
      fileUrl.includes(".mp4") ||
      fileUrl.includes(".webm") ||
      fileUrl.includes(".mov") ||
      fileUrl.includes(".avi") ||
      fileUrl.includes(".mkv") ||
      fileUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$|#)/i)
    );
  });

  const imageUrls = images.map((img) => img.file);

  return content.length > 0 ? (
    <>
      <div className="grid grid-cols-1 gap-2">
        {content.map((file, index) => {
          // Detecta vídeos por extensão ou parâmetros de query
          const fileUrl = file.file.toLowerCase();
          const isVideo =
            fileUrl.includes(".mp4") ||
            fileUrl.includes(".webm") ||
            fileUrl.includes(".mov") ||
            fileUrl.includes(".avi") ||
            fileUrl.includes(".mkv") ||
            fileUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$|#)/i);

          if (isVideo) {
            // Determina o tipo MIME baseado na extensão
            let videoType = "video/mp4";
            if (fileUrl.includes(".webm")) videoType = "video/webm";
            else if (fileUrl.includes(".mov")) videoType = "video/quicktime";
            else if (fileUrl.includes(".avi")) videoType = "video/x-msvideo";
            else if (fileUrl.includes(".mkv")) videoType = "video/x-matroska";

            return <VideoPlayer key={file.id} src={file.file} type={videoType} />;
          } else {
            // Encontra o índice da imagem no array de imagens
            const imageIndex = imageUrls.indexOf(file.file);

            return (
              <div
                key={file.id}
                className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => imageModal.openModal(imageUrls, imageIndex)}
              >
                <Image src={file.file} alt="Post media" fill className="object-cover" />
              </div>
            );
          }
        })}
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt="Imagem do post"
      />
    </>
  ) : null;
};

export default MediaContent;
