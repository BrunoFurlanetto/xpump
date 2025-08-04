import Image from "next/image";
import React from "react";
import LoginForm from "./form-login";

const Page = () => {
  return (
    <div className="bg-background flex  w-full h-screen justify-center">
      <div className="w-96 flex-col flex justify-center items-center">
        <Image src={"/logo/logo.png"} alt="Logo" width={400} height={20} />
        <LoginForm />
      </div>
    </div>
  );
};

export default Page;
