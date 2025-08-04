"use client";

import { Button } from "@/components/ui/button";
import { useActionState, useEffect } from "react";
import { ActionResponse, submitLogin } from "./actions";
import { toast } from "sonner";

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
    <form action={action} className="w-96 flex-col flex justify-center mt-4 items-center">
      <label className="w-full mt-3 mb-5">
        <span className="text-white">Usuário:</span>
        <input
          name="user"
          type="text"
          className="outline-none border-b text-white border-[#6a7282] focus:bg-background w-full p-4 rounded-md"
          placeholder="Informe seu usuário..."
        />
        {state?.errors && <p className="text-red-400 text-end">{state.errors.user}</p>}
      </label>
      <label className="w-full mb-5">
        <span className="text-white">Senha:</span>
        <input
          name="passwd"
          type="password"
          className="outline-none border-b text-white border-[#6a7282] autofill:bg-transparent focus:bg-background w-full p-4 rounded-md"
          placeholder="Informe seu usuário..."
        />
        {state?.errors && <p className="text-red-400 text-end">{state.errors.passwd}</p>}
      </label>
      <div className="flex w-full justify-end border-b-gray-500 border-b-2 pb-3">
        <Button
          disabled={isPending}
          isLoading={isPending}
          loadingText="carregando"
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Logar-se
        </Button>
      </div>
    </form>
  );
}
