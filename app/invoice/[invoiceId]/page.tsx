"use client";
import { deleteInvoice, getInvoiceById, updateInvoice } from '@/app/actions';
import InvoiceInfo from '@/app/components/InvoiceInfo';
import InvoiceLines from '@/app/components/InvoiceLines';
import InvoicePDF from '@/app/components/InvoicePDF';
import VATControl from '@/app/components/VATControl';
import Wrapper from '@/app/components/Wrapper';
import { Invoice, Totals } from '@/type';
import { Save, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';

const Page = ({ params }: { params: Promise<{ invoiceId: string }> }) => {
  const { user } = useClerk(); // Utilisation de Clerk pour vérifier l'authentification
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Vérifie si l'utilisateur est connecté avant de continuer
  useEffect(() => {
    if (!user) {
      router.push('/sign-in'); // Redirige vers la page de connexion si l'utilisateur n'est pas connecté
    }
  }, [user, router]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      const fetchedInvoice = await getInvoiceById(invoiceId);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
        setInitialInvoice(fetchedInvoice);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la facture", error);
    }
  };

  // Utilisation de React.use() pour déballer le paramètre `invoiceId`
  useEffect(() => {
    const fetchParams = async () => {
      const { invoiceId } = await params; // Utilisation de React.use() pour déballer les params
      if (invoiceId) {
        fetchInvoice(invoiceId);
      }
    };

    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!invoice) return;

    const ht = invoice.lines.reduce((acc, { quantity, unitPrice }) => acc + quantity * unitPrice, 0);
    const vat = invoice.vatActive ? ht * (invoice.vatRate / 100) : 0;
    setTotals({ totalHT: ht, totalVAT: vat, totalTTC: ht + vat });
  }, [invoice]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = parseInt(e.target.value);
    if (invoice) {
      const updatedInvoice = { ...invoice, status: newStatus };
      setInvoice(updatedInvoice);
    }
  };

  useEffect(() => {
    setIsSaveDisabled(JSON.stringify(invoice) === JSON.stringify(initialInvoice));
  }, [invoice, initialInvoice]);

  const handleSave = async () => {
    if (!invoice) return;
    setIsLoading(true);
    try {
      await updateInvoice(invoice);
      const updatedInvoice = await getInvoiceById(invoice.id);
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
        setInitialInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la facture :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice?.id) return;
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?");

    if (confirmed) {
      try {
        await deleteInvoice(invoice.id);
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la suppression de la facture.", error);
      }
    }
  };

  // Vérifier si la facture est payée (read-only)
  const isReadOnly = invoice?.status === 3;

  if (!invoice || !totals) return (
    <div className='flex justify-center items-center h-screen w-full '>
      <span className='font-bold'>Facture Non Trouvée</span>
    </div>
  );

  return (
    <Wrapper>
      <div>
        <div className='flex flex-col md:flex-row md:justify-between md:items-center mb-4'>
          <p className='badge badge-ghost badge-lg uppercase'>
            <span>Facture-</span>{invoice?.id}
          </p>
          <div className='flex md:mt-0 mt-4'>
            <select
              className='select select-sm select-bordered w-full'
              value={invoice?.status}
              onChange={handleStatusChange}
              disabled={isReadOnly}
            >
              <option value={1}>Brouillon</option>
              <option value={2}>En attente</option>
              <option value={3}>Payée</option>
              <option value={4}>Annulée</option>
              <option value={5}>Impayée</option>
            </select>

            <button className='btn btn-sm btn-accent ml-4'
              disabled={isSaveDisabled || isLoading || isReadOnly}
              onClick={handleSave}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  Sauvegarder
                  <Save className="w-4 ml-2" />
                </>
              )}
            </button>

            <button
              onClick={handleDelete}
              className='btn btn-sm btn-accent ml-4'
              disabled={isReadOnly}
            >
              <Trash className='w-4' />
            </button>
          </div>
        </div>

        {/* Message d'information si la facture est payée */}
        {isReadOnly && (
          <div className="alert alert-info mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Cette facture est payée et ne peut plus être modifiée.</span>
          </div>
        )}

        <div className='flex flex-col md:flex-row w-full'>

          <div className='flex w-full md:w-1/3 flex-col'>
            <div className='mb-4 bg-base-200 rounded-xl p-5'>
              <div className='flex justify-between items-center mb-4'>
                <div className='badge badge-accent'>Résumé des Totaux</div>
                <VATControl invoice={invoice} setInvoice={setInvoice} isReadOnly={isReadOnly} />
              </div>

              <div className='flex justify-between'>
                <span>Total Hors Taxes</span>
                <span>{totals?.totalHT.toFixed(2) ?? "0.00"} Fcfa</span>
              </div>

              <div className='flex justify-between'>
                <span>TVA ({invoice?.vatActive ? `${invoice?.vatRate}` : '0'} %)</span>
                <span>{totals?.totalVAT.toFixed(2) ?? "0.00"} Fcfa</span>
              </div>

              <div className='flex justify-between font-bold'>
                <span>Total TTC</span>
                <span>{totals?.totalTTC.toFixed(2) ?? "0.00"} Fcfa</span>
              </div>
            </div>

            <InvoiceInfo invoice={invoice} setInvoice={setInvoice} isReadOnly={isReadOnly} />
          </div>

          <div className='flex w-full md:w-2/3 flex-col md:ml-4'>
            <InvoiceLines invoice={invoice} setInvoice={setInvoice} isReadOnly={isReadOnly} />
            <InvoicePDF invoice={invoice} totals={totals} />
          </div>

        </div>
      </div>
    </Wrapper>
  );
};

export default Page;
