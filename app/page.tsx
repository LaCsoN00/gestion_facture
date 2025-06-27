"use client"
import Wrapper from "./components/Wrapper";
import { Layers, Filter, Search, Calendar, DollarSign } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createEmptyInvoice, getInvoicesByEmail, checkAndAddUser } from "./actions";
import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti"
import { Invoice } from "@/type";
import InvoiceComponent from "./components/InvoiceComponent";

export default function Home() {
  const { user, isLoaded } = useUser();
  const [invoiceName, setInvoiceName] = useState("");
  const [isNameValid, setIsNameValid] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // États pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  
  const email = user?.primaryEmailAddress?.emailAddress || "test@example.com";
  const userName = user?.fullName || "Utilisateur Test";

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await getInvoicesByEmail(email);
      if (data) {
        setInvoices(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des factures", error instanceof Error ? error.message : error);
    }
  }, [email]);

  useEffect(() => {
    if (isLoaded) {
      checkAndAddUser(email, userName).then(() => {
        fetchInvoices();
      }).catch(error => {
        console.error("Erreur lors de la création de l'utilisateur:", error);
      });
    }
  }, [isLoaded, email, userName, fetchInvoices]);

  useEffect(() => {
    setIsNameValid(invoiceName.length <= 60);
  }, [invoiceName]);

  // Fonction pour calculer le total d'une facture
  const calculateInvoiceTotal = (invoice: Invoice) => {
    const totalHT = invoice.lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
    const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
    return totalHT + totalVAT;
  };

  // Fonction pour obtenir la date de la facture
  const getInvoiceDate = (invoice: Invoice) => {
    return invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(0);
  };

  // Filtrage des factures
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filtre par recherche (nom de la facture)
      if (searchTerm && !invoice.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par statut
      if (statusFilter !== "all" && invoice.status !== parseInt(statusFilter)) {
        return false;
      }

      // Filtre par date
      if (dateFilter !== "all") {
        const invoiceDate = getInvoiceDate(invoice);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case "today":
            const todayStart = new Date(today);
            const todayEnd = new Date(today);
            todayEnd.setDate(todayEnd.getDate() + 1);
            if (invoiceDate < todayStart || invoiceDate >= todayEnd) return false;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (invoiceDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (invoiceDate < monthAgo) return false;
            break;
        }
      }

      // Filtre par montant
      if (amountFilter !== "all") {
        const total = calculateInvoiceTotal(invoice);
        
        switch (amountFilter) {
          case "low":
            if (total >= 10000) return false;
            break;
          case "medium":
            if (total < 10000 || total >= 50000) return false;
            break;
          case "high":
            if (total < 50000) return false;
            break;
        }
      }

      return true;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter, amountFilter]);

  const handleCreateInvoice = async () => {
    try {
      await createEmptyInvoice(email, invoiceName);
      fetchInvoices();
      setInvoiceName("");
      const modal = document.getElementById('my_modal_3') as HTMLDialogElement;
      if (modal) {
        modal.close();
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
  };

  if (!isLoaded) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">Mes factures</h1>
          <button
            className="btn btn-sm btn-accent"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </button>
        </div>

        {/* Section des filtres */}
        {showFilters && (
          <div className="bg-base-200 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Filtres</h3>
              <button
                className="btn btn-xs btn-ghost"
                onClick={clearFilters}
              >
                Effacer
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    Recherche
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Nom de la facture..."
                  className="input input-bordered input-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Statut */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Statut</span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="1">Brouillon</option>
                  <option value="2">En attente</option>
                  <option value="3">Payée</option>
                  <option value="4">Annulée</option>
                  <option value="5">Impayée</option>
                </select>
              </div>

              {/* Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Date
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                </select>
              </div>

              {/* Montant */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Montant
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                >
                  <option value="all">Tous les montants</option>
                  <option value="low">&lt; 10 000 Fcfa</option>
                  <option value="medium">10 000 - 50 000 Fcfa</option>
                  <option value="high">&gt; 50 000 Fcfa</option>
                </select>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            <div className="text-sm text-gray-600">
              {filteredInvoices.length} facture(s) trouvée(s) sur {invoices.length} total
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="cursor-pointer border border-accent rounded-xl flex flex-col justify-center items-center p-5"
            onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
          >
            <div className="font-bold text-accent">
              Créer une facture
            </div>
            <div className='bg-accent-content text-accent rounded-full p-2 mt-2'>
              <Layers className='h-6 w-6' />
            </div>
          </div>

          {filteredInvoices.length > 0 && (
            filteredInvoices.map((invoice, index) => (
              <div key={index}>
                <InvoiceComponent invoice={invoice} index={index} />
              </div>
            ))
          )}
        </div>

        {/* Message si aucune facture trouvée */}
        {filteredInvoices.length === 0 && invoices.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune facture ne correspond aux critères de recherche.</p>
            <button
              className="btn btn-sm btn-accent mt-2"
              onClick={clearFilters}
            >
              Effacer les filtres
            </button>
          </div>
        )}

        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>

            <h3 className="font-bold text-lg">Nouvelle Facture</h3>

            <input
              type="text"
              placeholder="Nom de la facture (max 60 caractères)"
              className="input input-bordered w-full my-4"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
            />

            {!isNameValid && <p className="mb-4 text-sm">Le nom ne peut pas dépasser 60 caractères.</p>}

            <button
              className="btn btn-accent"
              disabled={!isNameValid || invoiceName.length === 0}
              onClick={handleCreateInvoice}
            >
              Créer
            </button>

          </div>
        </dialog>

      </div>
    </Wrapper>
  );
}
