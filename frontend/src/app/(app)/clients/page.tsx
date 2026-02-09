import { Metadata } from "next";
import { ClientsView } from "./clients-view";

export const metadata: Metadata = {
  title: "Gerenciar Clientes | Start",
  description: "Gerencie todos os clientes da plataforma",
};

export default function ClientsPage() {
  return <ClientsView />;
}
