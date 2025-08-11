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

      <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
        <div className="flex-shrink-0 flex md:block justify-center">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
            <span className="material-icons text-white">analytics</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-3 text-center md:text-left">Avaliação Física</h3>
          <p className="text-gray-700 text-justify">
            Os treinamentos começam com uma avaliação física completa envolvendo composição corporal e capacidades
            físicas (potência, força, resistência muscular localizada e condicionamento físico específico da
            modalidade). Desta forma, é possível entender as necessidades, limitações e objetivos específicos,
            garantindo um programa de treinamento de qualidade.
          </p>
        </div>
      </div>
    </div>
  );
}
