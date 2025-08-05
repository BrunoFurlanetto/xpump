import Image from "next/image";
import React from "react";
import LoginForm from "./form-login";

const Page = () => {
  return (
    <div className="bg-background flex w-full h-full justify-center">
      <div className="w-full max-w-2xl h-[calc(100vh-200px)] bg-background relative">
        <Image src="/lucasphelps.png" alt="Lucas Phelps" layout="fill" objectFit="cover" />
      </div>

      <div className="w-full flex-col h-screen flex justify-end pb-2 bottom-0 absolute items-center bg-gradient-to-t from-background via-background  to-background/10">
        <Image src={"/logo/logo.png"} alt="Logo" width={400} height={20} />
        <LoginForm />
      </div>
    </div>
  );
};

export default Page;
