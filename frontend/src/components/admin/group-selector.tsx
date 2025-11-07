"use client";

import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Group } from "@/lib/api/groups";

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId: number | null;
  onGroupChange: (groupId: number) => void;
  className?: string;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onGroupChange,
  className,
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[300px] justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 opacity-50" />
            {selectedGroup ? (
              <span className="truncate">{selectedGroup.name}</span>
            ) : (
              <span className="text-muted-foreground">Selecione uma empresa...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
            <CommandGroup>
              {groups.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.name}
                  onSelect={() => {
                    onGroupChange(group.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{group.name}</span>
                    {group.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {group.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
