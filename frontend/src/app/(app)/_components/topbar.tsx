"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Menu } from "lucide-react";
import { useUserAuth } from "@/context/userAuthContext";

const TopBar = () => {
  const user = useUserAuth();

  return (
    <section className="topbar">
      <div className="flex justify-between py-4 px-5 bg-black/20">
        <Link href={"/"} className="flex items-center">
          <Image src={"/logo/simple.png"} alt="Logo" width={100} height={50} className="h-10" />
        </Link>

        <div className="flex gap-4">
          <Button variant="ghost" className="hover:bg-muted">
            <Menu className="text-primary" />
          </Button>

          <Link href={`/profile`} className="flex items-center">
            {user.first_name} {user.last_name}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopBar;
