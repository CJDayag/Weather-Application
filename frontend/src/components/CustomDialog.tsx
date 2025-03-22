import { ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  triggerText: string;
  children: ReactNode;
}

export const CustomDialog = ({
  open,
  onOpenChange,
  title,
  triggerText,
  children,
}: CustomDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="underline hover:text-primary">{triggerText}</button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
