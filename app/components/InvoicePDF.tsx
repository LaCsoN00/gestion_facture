import React, { useState } from "react";
import { Invoice, Totals } from "@/type";
import { ArrowDownFromLine, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

interface FacturePDFProps {
  invoice: Invoice;
  totals: Totals;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("fr-FR", options);
}

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoLayers: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLayer: {
    backgroundColor: '#ffffff',
    marginBottom: 1,
  },
  logoLayer1: {
    width: 16,
    height: 2,
  },
  logoLayer2: {
    width: 14,
    height: 2,
  },
  logoLayer3: {
    width: 12,
    height: 2,
    marginBottom: 0,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#1f2937',
  },
  brandAccent: {
    color: '#3b82f6',
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1f2937',
    marginTop: 10,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 12,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 11,
    marginBottom: 4,
    color: '#374151',
  },
  dateLabel: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  addressesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  addressSection: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  addressName: {
    fontSize: 12,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 4,
    color: '#1f2937',
  },
  addressText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 30,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowZebra: {
    backgroundColor: '#f9fafb',
  },
  tableCol: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableColNumber: {
    width: '8%',
  },
  tableColDescription: {
    width: '42%',
  },
  tableColQuantity: {
    width: '15%',
  },
  tableColPrice: {
    width: '15%',
  },
  tableColTotal: {
    width: '20%',
    borderRightWidth: 0,
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableCellNumber: {
    textAlign: 'center',
  },
  tableCellPrice: {
    textAlign: 'right',
  },
  tableCellTotal: {
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totals: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#3b82f6',
    paddingTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalTTC: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    padding: '6 12',
    borderRadius: 6,
  },
  totalTTCValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});

// Composant PDF
const InvoiceDocument = ({ invoice, totals }: { invoice: Invoice; totals: Totals }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <View style={styles.logoLayers}>
                <View style={[styles.logoLayer, styles.logoLayer1]} />
                <View style={[styles.logoLayer, styles.logoLayer2]} />
                <View style={[styles.logoLayer, styles.logoLayer3]} />
              </View>
            </View>
            <Text style={styles.brandName}>
              In<Text style={styles.brandAccent}>Voice</Text>
            </Text>
          </View>
          <Text style={styles.title}>Facture</Text>
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>FACTURE ° {invoice.id}</Text>
          <Text style={styles.date}>
            <Text style={styles.dateLabel}>Date: </Text>{formatDate(invoice.invoiceDate)}
          </Text>
          <Text style={styles.date}>
            <Text style={styles.dateLabel}>Échéance: </Text>{formatDate(invoice.dueDate)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.addressesContainer}>
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Émetteur</Text>
            <Text style={styles.addressName}>{invoice.issuerName}</Text>
            <Text style={styles.addressText}>{invoice.issuerAddress}</Text>
          </View>
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.addressName}>{invoice.clientName}</Text>
            <Text style={styles.addressText}>{invoice.clientAddress}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, styles.tableColNumber]}>
              <Text style={styles.tableCellHeader}>N°</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColDescription]}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColQuantity]}>
              <Text style={styles.tableCellHeader}>Quantité</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColPrice]}>
              <Text style={styles.tableCellHeader}>Prix Unitaire</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColTotal]}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>
        </View>
        {invoice.lines.map((line, index) => {
          const rowStyle = index % 2 === 1 ? [styles.tableRow, styles.tableRowZebra] : [styles.tableRow];
          return (
            <View style={rowStyle} key={index}>
              <View style={[styles.tableCol, styles.tableColNumber]}>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>{index + 1}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColDescription]}>
                <Text style={styles.tableCell}>{line.description}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColQuantity]}>
                <Text style={[styles.tableCell, styles.tableCellNumber]}>{line.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColPrice]}>
                <Text style={[styles.tableCell, styles.tableCellPrice]}>{line.unitPrice.toFixed(2)} Fcfa</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColTotal]}>
                <Text style={[styles.tableCell, styles.tableCellTotal]}>{(line.quantity * line.unitPrice).toFixed(2)} Fcfa</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Hors Taxes</Text>
          <Text style={styles.totalValue}>{totals.totalHT?.toFixed(2) ?? "0.00"} Fcfa</Text>
        </View>
        {invoice.vatActive && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA {invoice.vatRate}%</Text>
            <Text style={styles.totalValue}>{totals.totalVAT.toFixed(2) ?? "0.00"} Fcfa</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalTTC}>Total TTC</Text>
          <Text style={styles.totalTTCValue}>{totals.totalTTC.toFixed(2) ?? "0.00"} Fcfa</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsLoading(true);
    // Confetti pour célébrer la génération du PDF
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
    setIsLoading(false);
  };

  return (
    <div className="mt-4 hidden lg:block">
      <div className="border-base-300 border-2 border-dashed rounded-xl p-5">
        <PDFDownloadLink
          document={<InvoiceDocument invoice={invoice} totals={totals} />}
          fileName={`facture-${invoice.name}.pdf`}
          onClick={handleDownloadPdf}
        >
          {({ loading }) => (
            <button
              className={`btn btn-sm btn-accent mb-4 ${loading || isLoading ? "loading" : ""}`}
              disabled={loading || isLoading}
              aria-label="Télécharger la facture en PDF"
            >
              {loading || isLoading ? "Génération..." : "Facture PDF"}
              <ArrowDownFromLine className="w-4" />
            </button>
          )}
        </PDFDownloadLink>

        {/* Aperçu de la facture pour l'écran */}
        <div className="p-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="bg-accent-content text-accent rounded-full p-2">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="ml-3 font-bold text-2xl italic">
                  In<span className="text-accent">Voice</span>
                </span>
              </div>
              <h1 className="text-7xl font-bold uppercase">facture</h1>
            </div>
            <div className="text-right uppercase">
              <p className="badge badge-ghost">FACTURE ° {invoice.id}</p>
              <p className="my-2">
                <strong>Date </strong>
                {formatDate(invoice.invoiceDate)}
              </p>
              <p>
                <strong>Date d&apos;échéance </strong>
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <div className="my-6 flex justify-between">
            <div>
              <p className="badge badge-ghost mb-2">Émetteur</p>
              <p className="text-sm font-bold italic">{invoice.issuerName}</p>
              <p className="text-sm text-gray-500 w-52 break-words">
                {invoice.issuerAddress}
              </p>
            </div>
            <div className="text-right">
              <p className="badge badge-ghost mb-2">Client</p>
              <p className="text-sm font-bold italic">{invoice.clientName}</p>
              <p className="text-sm text-gray-500 w-52 break-words">
                {invoice.clientAddress}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th></th>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix Unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((ligne, index) => (
                  <tr key={`${ligne.description}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{ligne.description}</td>
                    <td>{ligne.quantity}</td>
                    <td>{ligne.unitPrice.toFixed(2)} Fcfa</td>
                    <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} Fcfa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 text-md">
            <div className="flex justify-between">
              <div className="font-bold">Total Hors Taxes</div>
              <div>{totals.totalHT?.toFixed(2) ?? "0.00"} Fcfa</div>
            </div>

            {invoice.vatActive && (
              <div className="flex justify-between">
                <div className="font-bold">TVA {invoice.vatRate} %</div>
                <div>{totals.totalVAT.toFixed(2) ?? "0.00"} Fcfa</div>
              </div>
            )}

            <div className="flex justify-between">
              <div className="font-bold">Total TTC</div>
              <div className="badge badge-accent">
                {totals.totalTTC.toFixed(2) ?? "0.00"} Fcfa
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;