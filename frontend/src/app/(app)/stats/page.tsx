export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e desempenho.</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Suas estatísticas</h3>
        <p className="text-muted-foreground">Em breve você verá gráficos e métricas do seu progresso aqui.</p>
      </div>
    </div>
  );
}
