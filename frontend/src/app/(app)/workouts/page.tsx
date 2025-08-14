export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Treinos</h1>
        <p className="text-muted-foreground">Gerencie seus treinos e exercícios.</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Seus treinos</h3>
        <p className="text-muted-foreground">Em breve você poderá visualizar e gerenciar todos os seus treinos aqui.</p>
      </div>
    </div>
  );
}
