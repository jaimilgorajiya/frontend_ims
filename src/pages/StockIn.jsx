import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { generateStockInBarcode } from '../utils/generateStockInBarcode'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function StockIn() {
  const [form, setForm] = useState({
    vendorName: '',
    vendorContact: '',
    productName: '',
    productCode: '',
    category: '',
    size: '',
    color: '',
    quantity: '',
    unit: 'pcs',
    pricePerUnit: '',
    invoiceNumber: '',
    purchaseOrderNumber: '',
    receivedBy: '',
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const [options, setOptions] = useState({ categories: [], sizes: [], colors: [] })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/stock/options`)
        if (data?.success && mounted) setOptions(data.data || { categories: [], sizes: [], colors: [] })
      } catch (e) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/stock-in`, {
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit)
      })
      if (data.success === false) throw new Error(data.message || 'Failed')
      setResult({ success: true, data: data.data })
      try {
        const url = await generateStockInBarcode(
          {
            productName: form.productName,
          },
          { format: 'png', filename: `stock-in-${form.productCode || 'item'}`, autoDownload: false, width: 1, height: 48 }
        )
        setQrPreview(url)
      } catch (e) {
        // ignore barcode generation errors to not block form submit
      }
      setForm({ vendorName: '', vendorContact: '', productName: '', productCode: '', category: '', size: '', color: '', quantity: '', unit: 'pcs', pricePerUnit: '', invoiceNumber: '', purchaseOrderNumber: '', receivedBy: '', remarks: '' })
    } catch (err) {
      setResult({ success: false, message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Stock In</h2>
       
      </header>

      <form className="form" onSubmit={onSubmit}>
        <h3 className="section-title">Vendor & Document</h3>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="vendorName">Vendor Name</label>
            <input id="vendorName" name="vendorName" value={form.vendorName} onChange={onChange} placeholder="e.g., Acme Supplies" required />
          </div>
          <div className="field">
            <label htmlFor="vendorContact">Vendor Contact</label>
            <input id="vendorContact" name="vendorContact" value={form.vendorContact} onChange={onChange} placeholder="Phone or email" required />
          </div>
          <div className="field">
            <label htmlFor="invoiceNumber">Invoice Number</label>
            <input id="invoiceNumber" name="invoiceNumber" value={form.invoiceNumber} onChange={onChange} placeholder="INV-00123" required />
          </div>
          <div className="field">
            <label htmlFor="purchaseOrderNumber">Purchase Order No.</label>
            <input id="purchaseOrderNumber" name="purchaseOrderNumber" value={form.purchaseOrderNumber} onChange={onChange} placeholder="PO-00456" />
          </div>
          <div className="field">
            <label htmlFor="receivedBy">Received By</label>
            <input id="receivedBy" name="receivedBy" value={form.receivedBy} onChange={onChange} placeholder="Staff name" required />
          </div>
        </div>

        <h3 className="section-title">Product Details</h3>
        <div className="grid grid-3">
          <div className="field">
            <label htmlFor="productName">Product Name</label>
            <input id="productName" name="productName" value={form.productName} onChange={onChange} placeholder="e.g., Cotton Shirt" required />
          </div>
          <div className="field">
            <label htmlFor="productCode">Product Code</label>
            <input id="productCode" name="productCode" value={form.productCode} onChange={onChange} placeholder="SKU-123" required />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" name="category" list="categoryOptions" value={form.category} onChange={onChange} placeholder="Category" required />
            <datalist id="categoryOptions">
              {options.categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="size">Size</label>
            <input id="size" name="size" list="sizeOptions" value={form.size} onChange={onChange} placeholder="M, L, 42, etc." required />
            <datalist id="sizeOptions">
              {options.sizes.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="color">Color</label>
            <input id="color" name="color" list="colorOptions" value={form.color} onChange={onChange} placeholder="e.g., Navy" required />
            <datalist id="colorOptions">
              {options.colors.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="remarks">Remarks</label>
            <input id="remarks" name="remarks" value={form.remarks} onChange={onChange} placeholder="Optional note" />
          </div>
        </div>

        <h3 className="section-title">Quantity & Pricing</h3>
        <div className="grid grid-4">
          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" value={form.quantity} onChange={onChange} placeholder="0" min="0" required />
          </div>
          <div className="field">
            <label htmlFor="unit">Unit</label>
            <input id="unit" name="unit" value={form.unit} onChange={onChange} placeholder="pcs" required />
          </div>
          <div className="field">
            <label htmlFor="pricePerUnit">Price Per Unit</label>
            <input type="number" step="0.01" id="pricePerUnit" name="pricePerUnit" value={form.pricePerUnit} onChange={onChange} placeholder="0.00" min="0" required />
          </div>
        </div>

        <div className="total-preview">
          <span>Total = </span>
          <strong>
            {(() => {
              const q = Number(form.quantity || 0)
              const p = Number(form.pricePerUnit || 0)
              return (q * p).toFixed(2)
            })()}
          </strong>
        </div>

        <div className="form-actions">
          <button className="btn" type="button" onClick={() => setForm({ vendorName: '', vendorContact: '', productName: '', productCode: '', category: '', size: '', color: '', quantity: '', unit: 'pcs', pricePerUnit: '', invoiceNumber: '', purchaseOrderNumber: '', receivedBy: '', remarks: '' })} disabled={submitting}>Clear</button>
          <button className="btn primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>

      {result && (
        <div className={`alert ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <div>
              <div>Created successfully.</div>
              {result.data?.receiptPath && (
                <a className="btn" href={`${BASE_URL}${result.data.receiptPath}`} target="_blank" rel="noreferrer">Download Receipt</a>
              )}
            </div>
          ) : (
            <div>{result.message}</div>
          )}
        </div>
      )}

      {qrPreview && (
        <div className="qr-preview" style={{ marginTop: 16 }}>
          <h4>Barcode</h4>
          <img src={qrPreview} alt="Stock In Barcode" style={{ maxWidth: 240, border: '1px solid #ddd' }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <a className="btn" href={qrPreview} download={`stock-in-${form.productCode || 'item'}.png`}>Download</a>
          </div>
        </div>
      )}
    </div>
  )
}
