import { VideoPlayer } from "@/components/VideoPlayer";
import Image from "next/image";
import React from "react";

interface MediaContentProps {
  content: Array<{
    id: number;
    file: string;
  }>;
}

const MediaContent = ({ content }: MediaContentProps) => {
  return content.length > 0 ? (
    <div className="grid grid-cols-1 gap-2">
      {content.map((file) => {
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
          return (
            <div key={file.id} className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
              <Image src={file.file} alt="Post media" fill className="object-cover" />
            </div>
          );
        }
      })}
    </div>
  ) : null;
};

export default MediaContent;
