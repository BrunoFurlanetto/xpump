import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Menu } from "lucide-react";

const TopBar = () => {
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

          {/* <Link href={`/profile/${user.id}`} className="flex items-center">
            Profile
          </Link> */}
        </div>
      </div>
    </section>
  );
};

export default TopBar;
