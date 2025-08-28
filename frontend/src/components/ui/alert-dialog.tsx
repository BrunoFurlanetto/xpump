"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface AlertDialogContentProps {
  children: React.ReactNode;
}

export function AlertDialogContent({ children }: AlertDialogContentProps) {
  return (
    <DialogContent>
      {children}
    </DialogContent>
  );
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return (
    <DialogHeader>
      {children}
    </DialogHeader>
  );
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return (
    <DialogTitle>
      {children}
    </DialogTitle>
  );
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return (
    <DialogDescription>
      {children}
    </DialogDescription>
  );
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      {children}
    </div>
  );
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AlertDialogAction({ children, onClick, disabled, className }: AlertDialogActionProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </Button>
  );
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export function AlertDialogCancel({ children, disabled }: AlertDialogCancelProps) {
  return (
    <Button variant="outline" disabled={disabled}>
      {children}
    </Button>
  );
}
