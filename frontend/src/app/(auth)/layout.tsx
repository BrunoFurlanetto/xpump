import Image from "next/image";
import React from "react";
import { Trophy, Flame, Target, Users } from "lucide-react";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:hidden space-y-8">
          <div className="text-center">
            <Image src="/logo/logo.png" alt="XPump Logo" width={180} height={45} className="brightness-110 mx-auto" />
          </div>

          <div className="w-full max-w-sm mx-auto">
            {children}

            {/* Badge de Segurança Mobile */}
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Conexão segura e privada
              </div>
            </div>
          </div>

          {/* Conteúdo Mobile */}
          <div className="text-center space-y-6">
            {/* Título Mobile */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white leading-tight">
                Transforme seus{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  treinos
                </span>
              </h1>
              <h2 className="text-xl font-semibold text-blue-300">em conquistas épicas</h2>
              <p className="text-base text-slate-300 px-4">
                Junte-se à comunidade que transforma fitness e nutrição em uma jornada gamificada e social.
              </p>
            </div>

            {/* Features Cards Mobile */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                <h3 className="text-white font-semibold text-xs">Rankings</h3>
                <p className="text-slate-300 text-xs">Compete e evolua</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Flame className="h-6 w-6 text-orange-400 mx-auto mb-1" />
                <h3 className="text-white font-semibold text-xs">Sequências</h3>
                <p className="text-slate-300 text-xs">Mantenha o foco</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Target className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <h3 className="text-white font-semibold text-xs">Metas</h3>
                <p className="text-slate-300 text-xs">Conquiste objetivos</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <h3 className="text-white font-semibold text-xs">Grupos</h3>
                <p className="text-slate-300 text-xs">Treine em equipe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Desktop: Layout original lado a lado */}
        <div className="hidden lg:grid grid-cols-2 gap-8 items-center">
          {/* Lado Esquerdo - Branding e Motivação */}
          <div className="text-left space-y-8">
            {/* Logo */}
            <div className="flex justify-start">
              <Image src="/logo/logo.png" alt="XPump Logo" width={200} height={50} className="brightness-110" />
            </div>

            {/* Título Principal */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                Transforme seus{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  treinos
                </span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold text-blue-300">em conquistas épicas</h2>
              <p className="text-lg text-slate-300 max-w-md">
                Junte-se à comunidade que transforma fitness e nutrição em uma jornada gamificada e social.
              </p>
            </div>

            {/* Features Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold text-sm">Rankings</h3>
                <p className="text-slate-300 text-xs">Compete e evolua</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold text-sm">Sequências</h3>
                <p className="text-slate-300 text-xs">Mantenha o foco</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold text-sm">Metas</h3>
                <p className="text-slate-300 text-xs">Conquiste objetivos</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold text-sm">Grupos</h3>
                <p className="text-slate-300 text-xs">Treine em equipe</p>
              </div>
            </div>

            {/* Estatísticas Motivacionais */}
            <div className="flex justify-between max-w-md bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">1000+</div>
                <div className="text-xs text-slate-300">Treinos realizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">50+</div>
                <div className="text-xs text-slate-300">Grupos ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">95%</div>
                <div className="text-xs text-slate-300">Taxa de sucesso</div>
              </div>
            </div>
          </div>

          {/* Lado Direito - Formulário de Login */}
          <div className="flex justify-end">{children}</div>
        </div>
      </div>

      {/* Elementos Decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}
