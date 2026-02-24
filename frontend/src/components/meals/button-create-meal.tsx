import { useState } from "react";
import { MealLogModal } from "./meal-log-modal";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export function ButtonCreateMeal() {
  const [showLogModal, setShowLogModal] = useState(false);
  return (
    <>
      {/* Modal de Registro */}
      <MealLogModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />
      <Button
        onClick={() => setShowLogModal(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Refeição
      </Button>
    </>
  );
}
