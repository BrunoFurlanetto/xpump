"use client";

import { Button } from "@/components/ui/button";
import { useActionState, useEffect } from "react";
import { ActionResponse, submitLogin } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight } from "lucide-react";

const initialState: ActionResponse = {
  success: false,
  message: "",
};

export default function LoginForm() {
  const [state, action, isPending] = useActionState(submitLogin, initialState);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message, {
        description: "Verifique suas credenciais e tente novamente",
      });
    }
  }, [state]);

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Campo de Usuário */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="username" className="text-sm font-medium text-white">
          Usuário
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Digite seu usuário"
          />
        </div>
        {state?.errors?.username && (
          <p className="text-red-400 text-sm flex items-center gap-1">{state.errors.username}</p>
        )}
      </motion.div>

      {/* Campo de Senha */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="password" className="text-sm font-medium text-white">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Digite sua senha"
          />
        </div>
        {state?.errors?.password && (
          <p className="text-red-400 text-sm flex items-center gap-1">{state.errors.password}</p>
        )}
      </motion.div>

      {/* Botão de Login */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button
          disabled={isPending}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Entrando...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              Entrar na plataforma
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
