import React from "react";
import ForgotPasswordForm from "./form-forgot-password";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const Page = () => {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-3">Recuperar senha</h3>
        <p className="text-slate-300">Insira seu email para receber as instruções de recuperação</p>
      </div>

      <ForgotPasswordForm />

      {/* Links Adicionais */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default Page;
