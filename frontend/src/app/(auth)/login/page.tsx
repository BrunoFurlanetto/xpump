import Link from "next/link";
import LoginForm from "./form-login";
import { RegistrationSuccess } from "./registration-success";
import { SessionCleaner } from "./session-cleaner";

const Page = () => {
  return (
    <div className="w-full max-w-md">
      <SessionCleaner />
      <RegistrationSuccess />

      {/* Card do Formulário */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h3>
          <p className="text-slate-300">Entre e continue sua jornada fitness</p>
        </div>

        <LoginForm />

        {/* Links Adicionais */}
        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            Esqueceu sua senha?
          </Link>
          <div className="text-slate-300 text-sm">
            Novo por aqui?{" "}
            <a href="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Crie sua conta
            </a>
          </div>
        </div>
      </div>

      {/* Badge de Segurança */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Conexão segura e privada
        </div>
      </div>
    </div>
  );
};

export default Page;
