import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LeadRow } from "@/lib/leads.functions";

function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

export function exportLeadsCsv(leads: LeadRow[]): void {
  const headers = ["Data e hora", "Chave Pix", "WhatsApp", "IP", "Status"];
  const rows = leads.map((lead) => [lead.created_at, lead.pix_key, lead.whatsapp, lead.ip_address, lead.status]);
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

export function LeadHeaderActions({ leads, wiping, onDeleteAll }: { leads: LeadRow[]; wiping: boolean; onDeleteAll: () => void }) {
  return <div className="flex flex-wrap gap-2">
    <Button variant="outline" size="sm" disabled={leads.length === 0} onClick={() => exportLeadsCsv(leads)}><Download /> Baixar CSV</Button>
    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={leads.length === 0 || wiping}><Trash2 /> {wiping ? "Excluindo..." : "Excluir todos"}</Button></AlertDialogTrigger>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir todos os leads?</AlertDialogTitle><AlertDialogDescription>Essa ação apaga permanentemente todos os leads e não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDeleteAll} className="bg-destructive text-destructive-foreground">Excluir todos</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
}

export function DeleteLeadButton({ busy, onDelete }: { busy: boolean; onDelete: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button aria-label="Excluir lead" variant="ghost" size="icon" disabled={busy}><Trash2 /></Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este lead?</AlertDialogTitle><AlertDialogDescription>As informações deste lead serão removidas permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}