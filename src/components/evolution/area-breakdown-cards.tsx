'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { MEDICAL_AREAS, AREA_COLORS } from '@/types/database';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const AreaBreakdownCards: React.FC = () => {
  const { stats } = useData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MEDICAL_AREAS.map(area => {
        const areaData = stats.areaAccuracy[area];
        const color = AREA_COLORS[area];
        const isConsolidated = areaData.percentage >= 80;

        return (
          <Card key={area} className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color.primary }}
                />
                <CardTitle className="text-sm font-bold text-foreground">
                  {area}
                </CardTitle>
              </div>

              {areaData.total > 0 ? (
                isConsolidated ? (
                  <Badge variant="concluido" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Consolidada
                  </Badge>
                ) : (
                  <Badge variant="atrasado" className="text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Reforçar
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Sem dados
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-foreground">
                  {areaData.percentage}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {areaData.correct} de {areaData.total} questões
                </span>
              </div>

              <Progress
                value={areaData.percentage}
                className="h-2"
                indicatorClassName={isConsolidated ? 'bg-emerald-500' : 'bg-primary'}
              />

              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>{areaData.topicsCount} {areaData.topicsCount === 1 ? 'assunto' : 'assuntos'}</span>
                <span>Meta: 80%</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
