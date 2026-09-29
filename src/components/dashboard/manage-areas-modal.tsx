'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  StudyArea,
  COLOR_PALETTE,
  DEFAULT_STUDY_AREAS,
} from '@/types/database';
import { useData } from '@/lib/store/data-context';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface ManageAreasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageAreasModal: React.FC<ManageAreasModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { areas, addArea, updateArea, reorderAreas, deleteArea, resetDefaultAreas } = useData();

  // Estados para nova área
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(COLOR_PALETTE[0].hex);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleStartEdit = (area: StudyArea) => {
    setEditingId(area.id);
    setEditingName(area.name);
    setEditingColor(area.color);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      setIsSavingEdit(true);
      await updateArea(editingId, editingName.trim(), editingColor);
      setEditingId(null);
    } catch (err) {
      console.error('Erro ao atualizar grande área:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      setIsCreating(true);
      await addArea(newAreaName.trim(), newAreaColor);
      setNewAreaName('');
    } catch (err) {
      console.error('Erro ao criar grande área:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newAreas = [...areas];
    const temp = newAreas[index];
    newAreas[index] = newAreas[index - 1];
    newAreas[index - 1] = temp;
    await reorderAreas(newAreas);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= areas.length - 1) return;
    const newAreas = [...areas];
    const temp = newAreas[index];
    newAreas[index] = newAreas[index + 1];
    newAreas[index + 1] = temp;
    await reorderAreas(newAreas);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <Settings className="h-4 w-4" />
            <span>Personalização de Disciplinas</span>
          </div>
          <DialogTitle className="text-xl">Gerenciar Grandes Áreas</DialogTitle>
          <DialogDescription className="text-xs">
            Adapte as grandes áreas para o seu foco: altere nomes, cores e a sequência das disciplinas exibidas nos gráficos e cronogramas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2 flex-1 overflow-y-auto pr-1">
          {/* Formulário de Criação de Nova Área */}
          <form
            onSubmit={handleCreateArea}
            className="p-3.5 rounded-xl border border-dashed border-border bg-card/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" /> Adicionar Nova Grande Área
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: Direito Constitucional, Matemática, Infectologia..."
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newAreaName.trim() || isCreating}
                className="text-xs font-bold shrink-0 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> {isCreating ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>

            {/* Seletor de Cores */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                Escolha a cor da nova área:
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {COLOR_PALETTE.map(c => {
                  const isSelected = newAreaColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewAreaColor(c.hex)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        isSelected ? 'scale-125 border-foreground shadow-sm' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  );
                })}
              </div>
            </div>
          </form>

          {/* Lista de Grandes Áreas Atuais */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                Grandes Áreas Ativas ({areas.length}) — <span className="font-normal text-[11px]">use as setas para reordenar a sequência</span>
              </span>
              <button
                type="button"
                onClick={resetDefaultAreas}
                className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Restaurar Padrão
              </button>
            </div>

            <div className="space-y-2">
              {areas.map((item, index) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2.5 animate-in fade-in"
                    >
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="text-xs h-8 flex-1"
                          autoFocus
                          disabled={isSavingEdit}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editingName.trim() || isSavingEdit}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> {isSavingEdit ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="h-8 text-xs text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {COLOR_PALETTE.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setEditingColor(c.hex)}
                            className={`h-5 w-5 rounded-full border-2 transition-transform ${
                              editingColor === c.hex ? 'scale-125 border-foreground' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs hover:border-border/80 transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[10px] font-bold text-muted-foreground/70 w-4 text-center">
                        {index + 1}º
                      </span>
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-foreground truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botões de Reordenação de Sequência */}
                      <div className="flex items-center bg-muted/40 rounded-lg border border-border/60 p-0.5 mr-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover para cima na sequência"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === areas.length - 1}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover para baixo na sequência"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(item)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Editar nome e cor"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteArea(item.id)}
                        disabled={areas.length <= 1}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
                        title={areas.length <= 1 ? 'Mínimo de 1 grande área necessária' : 'Excluir grande área'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-xs font-bold">
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

