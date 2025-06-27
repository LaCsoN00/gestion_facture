import { Invoice, InvoiceLine } from '@/type'
import { Plus, Trash } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { getProducts } from '@/app/actions'
import { useUser } from '@clerk/nextjs'

interface Product {
    id: string;
    name: string;
    description: string | null;
    unitPrice: number;
    categoryId: string | null;
    category?: {
        id: string;
        name: string;
        description: string | null;
    } | null;
}

interface Props {
    invoice: Invoice
    setInvoice: (invoice: Invoice) => void
    isReadOnly?: boolean
}

const InvoiceLines: React.FC<Props> = ({ invoice, setInvoice, isReadOnly = false }) => {
    const { user } = useUser();
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const loadProducts = async () => {
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            if (!userEmail) return;
            try {
                const fetchedProducts = await getProducts(userEmail);
                setProducts(fetchedProducts);
            } catch (error) {
                console.error('Erreur lors du chargement des produits:', error);
            }
        };
        loadProducts();
    }, [user?.primaryEmailAddress?.emailAddress]);

    const handleAddLine = () => {
        if (isReadOnly) return;
        const newLine: InvoiceLine = {
            id: `${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            productId: null,
            invoiceId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setInvoice({ ...invoice, lines: [...invoice.lines, newLine] });
    };

    const handleQuantityChange = (index: number, value: string) => {
        if (isReadOnly) return;
        const updatedLines = [...invoice.lines]
        updatedLines[index].quantity = value === "" ? 0 : parseInt(value)
        setInvoice({ ...invoice, lines: updatedLines })
    }

    const handleProductChange = (index: number, productId: string) => {
        if (isReadOnly) return;
        const updatedLines = [...invoice.lines]
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
            updatedLines[index].description = selectedProduct.name;
            updatedLines[index].unitPrice = selectedProduct.unitPrice;
        }
        setInvoice({ ...invoice, lines: updatedLines })
    }

    const handleUnitPriceChange = (index: number, value: string) => {
        if (isReadOnly) return;
        const updatedLines = [...invoice.lines]
        updatedLines[index].unitPrice = value === "" ? 0 : parseFloat(value)
        setInvoice({ ...invoice, lines: updatedLines })
    }

    const handleRemoveLine = (index: number) => {
        if (isReadOnly) return;
        const updatedLines = invoice.lines.filter((_, i) => i !== index)
        setInvoice({ ...invoice, lines: updatedLines })
    }

    return (
        <div className='bg-base-200 rounded-xl p-5 mb-4'>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='badge badge-accent'>Lignes de Facture</h2>
                <button
                    className='btn btn-sm btn-accent'
                    onClick={handleAddLine}
                    disabled={isReadOnly}
                >
                    <Plus className='w-4' />
                    Ajouter une ligne
                </button>
            </div>

            <div className='overflow-x-auto'>
                <table className='table table-zebra w-full'>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.lines.map((line, index) => (
                            <tr key={line.id}>
                                <td>
                                    <select
                                        className='select select-bordered select-sm w-full'
                                        value={products.find(p => p.name === line.description)?.id || ""}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        disabled={isReadOnly}
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type='text'
                                        className='input input-bordered input-sm w-full'
                                        value={line.description}
                                        onChange={(e) => {
                                            const updatedLines = [...invoice.lines];
                                            updatedLines[index].description = e.target.value;
                                            setInvoice({ ...invoice, lines: updatedLines });
                                        }}
                                        disabled={isReadOnly}
                                    />
                                </td>
                                <td>
                                    <input
                                        type='number'
                                        className='input input-bordered input-sm w-full'
                                        value={line.quantity}
                                        min={1}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                </td>
                                <td>
                                    <input
                                        type='number'
                                        className='input input-bordered input-sm w-full'
                                        value={line.unitPrice}
                                        min={0}
                                        step="0.01"
                                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                                        disabled={isReadOnly}
                                    />
                                </td>
                                <td>
                                    <span className='font-bold'>
                                        {(line.quantity * line.unitPrice).toFixed(2)} Fcfa
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleRemoveLine(index) }
                                        className='btn btn-sm btn-circle btn-accent'
                                        disabled={isReadOnly}
                                    >
                                        <Trash className="w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default InvoiceLines
