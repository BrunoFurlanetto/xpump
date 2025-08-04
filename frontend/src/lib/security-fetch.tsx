import { ErrorHandler } from "@/app/(app)/error-handler";
import { LogoutHandler } from "@/app/(app)/logout-handler";

export const securityFetch = async <T = unknown,>(handlerFunction: () => Promise<T>) => {
  let data: T | null = null;
  let error = "";
  let HandlerError = null;
  try {
    data = await handlerFunction();
  } catch (err) {
    error = (err as Error).message || "Erro desconhecido";
  }

  if (error) {
    HandlerError = <ErrorHandler error={error} />;
    if (error.includes("Unauthorized") || error.includes("Token expired")) {
      HandlerError = <LogoutHandler logout={true} />;
    }
  }

  return {
    data: data,
    handlerErrorComponent: HandlerError,
  };
};
