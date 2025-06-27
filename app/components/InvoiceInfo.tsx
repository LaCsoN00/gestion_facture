import { Invoice } from "@/type";
import React from "react";

interface Props {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
  isReadOnly?: boolean;
}

const InvoiceInfo: React.FC<Props> = ({ invoice, setInvoice, isReadOnly = false }) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    if (isReadOnly) return;
    setInvoice({ ...invoice, [field]: e.target.value });
  };

  console.log(invoice);

  return (
    <div className="flex flex-col h-fit bg-base-200 p-5 rounded-xl mb-4 md:mb-0">
      <div className="space-y-4">
        <h2 className="badge badge-accent">Émetteur</h2>
        <input
          type="text"
          value={invoice?.issuerName}
          placeholder="Nom de l'entreprise émettrice"
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "issuerName")}
          disabled={isReadOnly}
        />

        <textarea
          value={invoice?.issuerAddress}
          placeholder="Adresse de l'entreprise émettrice"
          className="textarea textarea-bordered w-full resize-none h-40"
          rows={5}
          required
          onChange={(e) => handleInputChange(e, "issuerAddress")}
          disabled={isReadOnly}
        ></textarea>

        <h2 className="badge badge-accent">Client</h2>
        <input
          type="text"
          value={invoice?.clientName}
          placeholder="Nom de l'entreprise cliente"
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "clientName")}
          disabled={isReadOnly}
        />

        <textarea
          value={invoice?.clientAddress}
          placeholder="Adresse de l'entreprise cliente"
          className="textarea textarea-bordered w-full resize-none h-40"
          rows={5}
          required
          onChange={(e) => handleInputChange(e, "clientAddress")}
          disabled={isReadOnly}
        ></textarea>

        <h2 className="badge badge-accent">Date de la Facture</h2>
        <input
          type="date"
          value={invoice?.invoiceDate}
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "invoiceDate")}
          disabled={isReadOnly}
        />

        <h2 className="badge badge-accent">Date d&apos;échéance</h2>
        <input
          type="date"
          value={invoice?.dueDate}
          className="input input-bordered w-full resize-none"
          required
          onChange={(e) => handleInputChange(e, "dueDate")}
          disabled={isReadOnly}
        />
      </div>
    </div>
  );
};

export default InvoiceInfo;
