import { useState } from "react";

interface UseImageModalReturn {
  isOpen: boolean;
  selectedImages: string[];
  selectedIndex: number;
  openModal: (images: string | string[], index?: number) => void;
  closeModal: () => void;
}

export function useImageModal(): UseImageModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openModal = (images: string | string[], index: number = 0) => {
    const imageArray = Array.isArray(images) ? images : [images];
    setSelectedImages(imageArray);
    setSelectedIndex(index);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Reset após animação de fechamento
    setTimeout(() => {
      setSelectedImages([]);
      setSelectedIndex(0);
    }, 200);
  };

  return {
    isOpen,
    selectedImages,
    selectedIndex,
    openModal,
    closeModal,
  };
}
