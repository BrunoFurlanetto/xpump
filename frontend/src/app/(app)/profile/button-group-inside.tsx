"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";
import React from "react";

const ButtonGroupInside = () => {
  return (
    <Link
      href="/groups"
      className={buttonVariants({
        variant: "outline",
        className: "w-full justify-center",
      })}
    >
      <Users className="h-4 w-4 mr-2" />
      Ver todos
    </Link>
  );
};

export default ButtonGroupInside;
