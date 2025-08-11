export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao XPump! Aqui você pode acompanhar seus treinos e progresso.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Treinos desta semana</h3>
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 desde a semana passada</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Grupos ativos</h3>
          </div>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">Participando de 3 grupos</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tempo total</h3>
          </div>
          <div className="text-2xl font-bold">45h</div>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Streak</h3>
          </div>
          <div className="text-2xl font-bold">7</div>
          <p className="text-xs text-muted-foreground">dias consecutivos</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Próximos treinos</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <div>
              <p className="font-medium">Treino de peito e tríceps</p>
              <p className="text-sm text-muted-foreground">Hoje às 18:00</p>
            </div>
            <div className="text-sm text-primary font-medium">Em 2h</div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <div>
              <p className="font-medium">Treino de costas e bíceps</p>
              <p className="text-sm text-muted-foreground">Amanhã às 07:00</p>
            </div>
            <div className="text-sm text-muted-foreground">Em 15h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
