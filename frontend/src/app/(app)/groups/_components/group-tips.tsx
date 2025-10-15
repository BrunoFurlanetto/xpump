import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import React from 'react'

const GroupTips = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                Dicas para Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Como criar um grupo eficaz:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Escolha um nome motivador e descritivo</li>
                    <li>• Defina metas claras para o grupo</li>
                    <li>• Compartilhe o código de convite com amigos</li>
                    <li>• Mantenha a interação ativa no feed</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Benefícios dos grupos:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Competição saudável aumenta motivação</li>
                    <li>• Apoio mútuo para manter consistência</li>
                    <li>• Rankings semanais e mensais</li>
                    <li>• Conquistas em grupo exclusivas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
  )
}

export default GroupTips