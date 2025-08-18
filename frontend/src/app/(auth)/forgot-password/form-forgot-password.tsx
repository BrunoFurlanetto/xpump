"use client";

import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState } from "react";
import { ActionResponse, submitForgotPassword } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

const initialState: ActionResponse = {
  success: false,
  message: "",
};

export default function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(submitForgotPassword, initialState);
  const [emailSent, setEmailSent] = useState(false);

  // Estado para manter os valores do formulário
  const [formValues, setFormValues] = useState({
    email: "",
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
        description: "Verifique o email e tente novamente",
      });
    }
    if (state.message && state.success) {
      toast.success(state.message, {
        description: "Verifique sua caixa de entrada",
      });
      setEmailSent(true);
      // Limpar formulário apenas quando há sucesso
      setFormValues({
        email: "",
      });
    }
  }, [state]);

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Email enviado!</h3>
          <p className="text-slate-300 text-sm">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left">
          <p className="text-blue-300 text-xs">
            <strong>Dica:</strong> Se não encontrar o email, verifique sua pasta de spam ou lixo eletrônico.
          </p>
        </div>

        <Button
          onClick={() => setEmailSent(false)}
          variant="outline"
          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
        >
          Enviar para outro email
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Campo de Email */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
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
            placeholder="Digite seu email cadastrado"
          />
        </div>
        {state?.errors?.email && <p className="text-red-400 text-xs flex items-center gap-1">{state.errors.email}</p>}
      </motion.div>

      {/* Informação adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
      >
        <p className="text-amber-300 text-xs">
          Enviaremos um link seguro para redefinir sua senha. O link expira em 30 minutos.
        </p>
      </motion.div>

      {/* Botão de Envio */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button
          disabled={isPending}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Enviando...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              Enviar instruções
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}
