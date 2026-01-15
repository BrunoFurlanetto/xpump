import React, { Suspense } from "react";
import RegisterForm from "./form-register";

const Page = () => {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Solicite seu acesso!</h3>
        <p className="text-slate-300 text-sm">Preencha os dados para começar sua jornada</p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <RegisterForm />
      </Suspense>

      {/* Links Adicionais Mobile */}
      <div className="mt-4 text-center space-y-2">
        <div className="text-slate-300 text-sm">
          Já tem uma conta?{" "}
          <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Faça login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Page;
