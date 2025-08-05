"use client";

import { Button } from "@/components/ui/button";
import { useActionState, useEffect } from "react";
import { ActionResponse, submitLogin } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";


const initialState: ActionResponse = {
  success: false,
  message: "",
};
export default function LoginForm() {
  const [state, action, isPending] = useActionState(submitLogin, initialState);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message, {
        description: "Tente novamente!",
      });
    }
  }, [state]);

  return (
    <motion.form
      action={action}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-96 flex-col flex justify-center mt-1 items-center  p-6 rounded-lg shadow-lg"
    >
      <label className="w-full mt-2 mb-5 relative">
        <span className="  text-white">Usuário:</span>
        <motion.input
          name="username"
          type="text"
          autoComplete="username"
          className=" outline-none bg-transparent  text-white w-full p-4 rounded-md border-b-2 border-orange-500"
          placeholder="seu usuário..."
        />
        {state?.errors && <p className="text-red-400 text-end absolute bottom-[-20px]">{state.errors.username}</p>}
      </label>
      <label className="w-full mb-5 relative">
        <span className="text-white">Senha:</span>
        <motion.input
          name="password"
          type="password"
          autoComplete="current-password"
          className=" outline-none bg-transparent text-white w-full p-4 rounded-md border-b-2 border-orange-500"
          placeholder="sua senha..."
        />
        {state?.errors && <p className="text-red-400 text-end absolute bottom-[-20px]">{state.errors.password}</p>}
      </label>
      <motion.div
        className="flex w-full justify-end border-b-gray-500 border-b-2 pb-3 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          disabled={isPending}
          isLoading={isPending}
          loadingText="carregando"
          variant="default"
          className="bg-orange-500 hover:bg-orange-700 text-white"
        >
          Logar-se
        </Button>
      </motion.div>
    </motion.form>
  );
}
