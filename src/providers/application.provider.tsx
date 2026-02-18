"use client";
import { ToasterGlobal, ToasterLocal } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme.provider";

export default function ApplicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        {children}
        <ToasterGlobal />
        <ToasterLocal />
      </TooltipProvider>
    </ThemeProvider>
  );
}
