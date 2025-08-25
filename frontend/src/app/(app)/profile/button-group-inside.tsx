"use client";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import React from "react";

const ButtonGroupInside = () => {
  return (
    <Button variant="outline" className="w-full">
      <Users className="h-4 w-4 mr-2" />
      Entrar em Novo Grupo
    </Button>
  );
};

export default ButtonGroupInside;
