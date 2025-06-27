import { Invoice as PrismaInvoice } from "@prisma/client";
import { InvoiceLine as PrismaInvoiceLine } from "@prisma/client";

export enum InvoiceStatus {
  DRAFT = 1,
  PENDING = 2,
  PAID = 3,
  CANCELLED = 4,
  UNPAID = 5
}

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Brouillon",
  [InvoiceStatus.PENDING]: "En attente",
  [InvoiceStatus.PAID]: "Payée",
  [InvoiceStatus.CANCELLED]: "Annulée",
  [InvoiceStatus.UNPAID]: "Impayée"
};

export interface Invoice extends PrismaInvoice {
  lines: InvoiceLine[];
}

export interface Totals {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type InvoiceLine = PrismaInvoiceLine;
