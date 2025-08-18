"use client";

import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState } from "react";
import { ActionResponse, submitRegister } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Lock, Mail, UserPlus, ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

const initialState: ActionResponse = {
  success: false,
  message: "",
};

export default function RegisterForm() {
  const [state, action, isPending] = useActionState(submitRegister, initialState);
  const router = useRouter();

  // Estado para manter os valores do formulário
  const [formValues, setFormValues] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    company_code: "",
    password: "",
    password2: "",
  });

  // Função para atualizar valores do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message, {
        description: "Verifique os dados e tente novamente",
      });
    }
    if (state.message && state.success) {
      toast.success(state.message, {
        description: "Redirecionando para o login...",
      });
      // Limpar formulário apenas quando há sucesso
      setFormValues({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        company_code: "",
        password: "",
        password2: "",
      });
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    }
  }, [state, router]);

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Nome e Sobrenome */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="first_name" className="text-sm font-medium text-white">
            Nome
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              value={formValues.first_name}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Nome"
            />
          </div>
          {state?.errors?.first_name && (
            <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.first_name}</p>
          )}
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="last_name" className="text-sm font-medium text-white">
            Sobrenome
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              value={formValues.last_name}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Sobrenome"
            />
          </div>
          {state?.errors?.last_name && (
            <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.last_name}</p>
          )}
        </motion.div>
      </div>

      {/* Campo de Usuário */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="username" className="text-sm font-medium text-white">
          Usuário
        </label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={formValues.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="Escolha seu nome de usuário"
          />
        </div>
        {state?.errors?.username && (
          <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.username}</p>
        )}
      </motion.div>

      {/* Campo de Email */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="email" className="text-sm font-medium text-white">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formValues.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="Digite seu email"
          />
        </div>
        {state?.errors?.email && <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.email}</p>}
      </motion.div>

      {/* Campo de Código da Empresa */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label htmlFor="company_code" className="text-sm font-medium text-white">
          Código da Empresa
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="company_code"
            name="company_code"
            type="text"
            autoComplete="organization"
            value={formValues.company_code}
            onChange={(e) => handleInputChange("company_code", e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            placeholder="Digite o código da empresa"
          />
        </div>
        {state?.errors?.company_code && (
          <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.company_code}</p>
        )}
      </motion.div>

      {/* Senhas */}
      <div className="grid grid-cols-1 gap-3">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="password" className="text-sm font-medium text-white">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formValues.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Crie uma senha segura"
            />
          </div>
          {state?.errors?.password && (
            <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.password}</p>
          )}
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label htmlFor="password2" className="text-sm font-medium text-white">
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="password2"
              name="password2"
              type="password"
              autoComplete="new-password"
              value={formValues.password2}
              onChange={(e) => handleInputChange("password2", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Confirme sua senha"
            />
          </div>
          {state?.errors?.password2 && (
            <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.password2}</p>
          )}
        </motion.div>
      </div>

      {/* Botão de Registro */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Button
          disabled={isPending}
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Criando conta...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              Solicitar acesso
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
