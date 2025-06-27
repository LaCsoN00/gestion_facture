import { Invoice } from '@/type'
import React from 'react'


interface Props {
    invoice: Invoice
    setInvoice: (invoice: Invoice) => void
    isReadOnly?: boolean
}

const VATControl: React.FC<Props> = ({ invoice, setInvoice, isReadOnly = false }) => {

    const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        setInvoice({
            ...invoice,
            vatActive: e.target.checked,
            vatRate: e.target.checked ? (invoice.vatRate || 10) : 0
        })
    }


    const handleVatRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setInvoice({
                ...invoice,
                vatRate: value
            })
        }
    }


    return (
        <div className='flex items-center'>
            <label className='block text-sm font-bold'>TVA (%)</label>
            <input
                type="checkbox"
                className='toggle toggle-sm ml-2'
                onChange={handleVatChange}
                checked={invoice.vatActive}
                disabled={isReadOnly}
            />
            {invoice.vatActive && (
                <input
                    type="number"
                    value={invoice.vatRate || 10}
                    className='input input-sm input-bordered w-16 ml-2'
                    onChange={handleVatRateChange}
                    min={0}
                    disabled={isReadOnly}
                />
            )}
        </div>
    )
}

export default VATControl
