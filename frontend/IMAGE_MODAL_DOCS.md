# ImageModal - Componente de Visualização de Imagens em Fullscreen

## Componentes Criados

### 1. `ImageModal` (`src/components/ui/image-modal.tsx`)

Modal fullscreen para visualizar imagens com recursos avançados:

- ✨ Visualização em tela cheia
- 🔍 Zoom (1x até 3x)
- 👆 Pan/Drag quando com zoom
- ⬅️➡️ Navegação entre múltiplas imagens (teclado e botões)
- ⌨️ Suporte a atalhos (ESC para fechar, setas para navegar)
- 📱 Indicadores de paginação (dots)
- 🎨 Interface com gradiente e controles flutuantes

### 2. `useImageModal` (`src/hooks/useImageModal.ts`)

Hook customizado para gerenciar o estado do modal de forma simplificada.

## Como Usar

### Exemplo Básico - Uma Imagem

```tsx
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import Image from "next/image";

function MeuComponente() {
  const imageModal = useImageModal();

  return (
    <>
      <div className="cursor-pointer" onClick={() => imageModal.openModal("/caminho/para/imagem.jpg")}>
        <Image src="/caminho/para/imagem.jpg" alt="Foto" width={200} height={200} />
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt="Descrição da imagem"
      />
    </>
  );
}
```

### Exemplo - Múltiplas Imagens (Galeria)

```tsx
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import Image from "next/image";

function Galeria() {
  const imageModal = useImageModal();

  const fotos = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg"];

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {fotos.map((foto, index) => (
          <div
            key={index}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => imageModal.openModal(fotos, index)}
          >
            <Image src={foto} alt={`Foto ${index + 1}`} width={200} height={200} />
          </div>
        ))}
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt="Foto da galeria"
      />
    </>
  );
}
```

### Exemplo - Refeições (Nutrition)

```tsx
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import Image from "next/image";

function MealCard({ meal }) {
  const imageModal = useImageModal();

  return (
    <>
      <div className="meal-card">
        <h3>{meal.name}</h3>
        {meal.images && meal.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {meal.images.map((image, idx) => (
              <div
                key={idx}
                className="relative aspect-square cursor-pointer rounded-lg overflow-hidden"
                onClick={() => imageModal.openModal(meal.images, idx)}
              >
                <Image src={image} alt={`${meal.name} - foto ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt={`Foto da refeição: ${meal.name}`}
      />
    </>
  );
}
```

### Exemplo - Check-in de Treino

```tsx
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import Image from "next/image";

function WorkoutCheckin({ checkin }) {
  const imageModal = useImageModal();

  return (
    <>
      <div className="workout-checkin">
        <h4>{checkin.exercise}</h4>
        {checkin.photo && (
          <div
            className="relative w-full aspect-video cursor-pointer rounded-lg overflow-hidden"
            onClick={() => imageModal.openModal(checkin.photo)}
          >
            <Image
              src={checkin.photo}
              alt={`Check-in do exercício ${checkin.exercise}`}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt={`Check-in de treino: ${checkin.exercise}`}
      />
    </>
  );
}
```

### Exemplo - Foto de Perfil

```tsx
import { ImageModal } from "@/components/ui/image-modal";
import { useImageModal } from "@/hooks/useImageModal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

function UserProfile({ user }) {
  const imageModal = useImageModal();

  return (
    <>
      <div className="profile-header">
        <Avatar
          className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => user.avatar && imageModal.openModal(user.avatar)}
        >
          <AvatarImage src={user.avatar} alt={user.name} />
        </Avatar>
        <h2>{user.name}</h2>
      </div>

      <ImageModal
        images={imageModal.selectedImages}
        initialIndex={imageModal.selectedIndex}
        isOpen={imageModal.isOpen}
        onClose={imageModal.closeModal}
        alt={`Foto de perfil de ${user.name}`}
      />
    </>
  );
}
```

## Props do ImageModal

| Prop           | Tipo         | Obrigatório | Descrição                              |
| -------------- | ------------ | ----------- | -------------------------------------- |
| `images`       | `string[]`   | ✅          | Array de URLs das imagens              |
| `initialIndex` | `number`     | ❌          | Índice da imagem inicial (padrão: 0)   |
| `isOpen`       | `boolean`    | ✅          | Controla se o modal está aberto        |
| `onClose`      | `() => void` | ✅          | Função chamada ao fechar o modal       |
| `alt`          | `string`     | ❌          | Texto alternativo base para as imagens |

## Métodos do Hook useImageModal

| Método       | Parâmetros                                   | Descrição                            |
| ------------ | -------------------------------------------- | ------------------------------------ |
| `openModal`  | `images: string \| string[], index?: number` | Abre o modal com uma ou mais imagens |
| `closeModal` | -                                            | Fecha o modal                        |

## Propriedades Retornadas pelo Hook

| Propriedade      | Tipo       | Descrição                        |
| ---------------- | ---------- | -------------------------------- |
| `isOpen`         | `boolean`  | Estado do modal (aberto/fechado) |
| `selectedImages` | `string[]` | Array de imagens selecionadas    |
| `selectedIndex`  | `number`   | Índice da imagem atual           |

## Recursos e Controles

### Teclado

- `ESC` - Fecha o modal
- `←` (Seta Esquerda) - Imagem anterior
- `→` (Seta Direita) - Próxima imagem

### Mouse

- Click fora da imagem - Fecha o modal
- Click nos botões ← → - Navega entre imagens
- Click nos dots - Vai para imagem específica
- Scroll/Drag - Pan quando com zoom ativo

### Zoom

- Botão + - Aumenta zoom (até 3x)
- Botão - - Diminui zoom (até 1x)
- Drag - Move a imagem quando com zoom

## Integração Atual

O componente já está integrado em:

- ✅ Feed social (`media-content.tsx`)

Próximos lugares sugeridos para integração:

- 📸 Perfil de usuário
- 🍽️ Registro de refeições
- 💪 Check-ins de treino
- 🏆 Conquistas e badges
- 👥 Fotos de grupo
