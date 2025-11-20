import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { generateStockOutBarcode } from '../utils/generateStockOutBarcode'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function StockOut() {
  const genDispatchNo = () => `DN-${Date.now().toString().slice(-6)}`
  const [form, setForm] = useState({
    partyName: '',
    partyContact: '',
    productName: '',
    productCode: '',
    category: '',
    size: '',
    color: '',
    quantity: '',
    unit: 'pcs',
    pricePerUnit: '',
    dispatchNoteNo: genDispatchNo(),
    issuedBy: '',
    approvedBy: '',
    deliveryMode: 'Courier',
    destination: '',
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const [stock, setStock] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [availableQty, setAvailableQty] = useState(0)
  const [validationMsg, setValidationMsg] = useState('')

  const fetchStock = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/stock/summary`)
      if (data?.success) setStock(data.data || [])
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => { await fetchStock() }
    load()
    return () => { mounted = false }
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSelectProduct = (e) => {
    const key = e.target.value
    setSelectedKey(key)
    const item = stock.find((s) => makeKey(s) === key)
    if (item) {
      setForm((f) => ({
        ...f,
        productName: item.productName,
        productCode: item.productCode,
        category: item.category,
        size: item.size,
        color: item.color,
        unit: item.unit || 'pcs'
      }))
      setAvailableQty(Number(item.availableQuantity || 0))
      setValidationMsg('')
    } else {
      setAvailableQty(0)
      setValidationMsg('Selected product not in stock')
    }
  }

  const makeKey = (p) => [p.productCode, p.productName, p.category, p.size, p.color, p.unit || 'pcs'].join(' | ')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      // Validate product selection exists in stock and quantity
      const chosen = stock.find((s) => makeKey(s) === selectedKey)
      if (!chosen) {
        throw new Error('Please select a product from stock')
      }
      const qty = Number(form.quantity)
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('Enter a valid quantity')
      }
      if (qty > Number(chosen.availableQuantity || 0)) {
        throw new Error(`Only ${chosen.availableQuantity} ${chosen.unit || 'pcs'} available for this product`)
      }
      const { data } = await axios.post(`${BASE_URL}/api/stock-out`, {
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit)
      })
      if (data.success === false) throw new Error(data.message || 'Failed')
      setResult({ success: true, data: data.data })
      try {
        const url = await generateStockOutBarcode(
          {
            productName: form.productName,
          },
          { format: 'png', filename: `stock-out-${form.productCode || 'item'}`, autoDownload: false, width: 1, height: 48 }
        )
        setQrPreview(url)
      } catch (e) {
        // ignore barcode generation errors to not block form submit
      }
      setForm({ partyName: '', partyContact: '', productName: '', productCode: '', category: '', size: '', color: '', quantity: '', unit: 'pcs', pricePerUnit: '', dispatchNoteNo: genDispatchNo(), issuedBy: '', approvedBy: '', deliveryMode: 'Courier', destination: '', remarks: '' })
      setSelectedKey('')
      setAvailableQty(0)
      // Refresh stock so exhausted items disappear and counts update
      await fetchStock()
    } catch (err) {
      setResult({ success: false, message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Stock Out</h2>
   
      </header>

      <form className="form" onSubmit={onSubmit}>
        <h3 className="section-title">Party & Dispatch</h3>
        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="partyName">Party Name</label>
            <input id="partyName" name="partyName" value={form.partyName} onChange={onChange} placeholder="Customer / Department" required />
          </div>
          <div className="field">
            <label htmlFor="partyContact">Party Contact</label>
            <input id="partyContact" name="partyContact" value={form.partyContact} onChange={onChange} placeholder="Phone or email" required />
          </div>
          <div className="field">
            <label htmlFor="dispatchNoteNo">Dispatch Note No.</label>
            <input id="dispatchNoteNo" name="dispatchNoteNo" value={form.dispatchNoteNo} onChange={onChange} placeholder="DN-0001" required />
          </div>
          <div className="field">
            <label htmlFor="deliveryMode">Delivery Mode</label>
            <select id="deliveryMode" name="deliveryMode" value={form.deliveryMode} onChange={onChange} required>
              <option value="Courier">Courier</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="destination">Destination</label>
            <input id="destination" name="destination" value={form.destination} onChange={onChange} placeholder="Address / Location" required />
          </div>
          <div className="field">
            <label htmlFor="issuedBy">Issued By</label>
            <input id="issuedBy" name="issuedBy" value={form.issuedBy} onChange={onChange} placeholder="Staff name" required />
          </div>
          <div className="field">
            <label htmlFor="approvedBy">Approved By</label>
            <input id="approvedBy" name="approvedBy" value={form.approvedBy} onChange={onChange} placeholder="Manager name" required />
          </div>
        </div>

        <h3 className="section-title">Product Details</h3>
        <div className="grid grid-3">
          <div className="field">
            <label htmlFor="productSelect">Select Product (in stock)</label>
            <select id="productSelect" value={selectedKey} onChange={onSelectProduct} onFocus={fetchStock} required>
              <option value="" disabled>Select a product</option>
              {stock.map((s) => (
                <option key={makeKey(s)} value={makeKey(s)}>
                  {`${s.productName} • ${s.size} • ${s.color} • ${s.category} • ${s.productCode} (${s.availableQuantity} ${s.unit || 'pcs'})`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="productName">Product Name</label>
            <input id="productName" name="productName" value={form.productName} onChange={onChange} placeholder="e.g., Cotton Shirt" required readOnly />
          </div>
          <div className="field">
            <label htmlFor="productCode">Product Code</label>
            <input id="productCode" name="productCode" value={form.productCode} onChange={onChange} placeholder="SKU-123" required readOnly />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" name="category" value={form.category} onChange={onChange} placeholder="Category" required readOnly />
          </div>
          <div className="field">
            <label htmlFor="size">Size</label>
            <input id="size" name="size" value={form.size} onChange={onChange} placeholder="M, L, 42, etc." required readOnly />
          </div>
          <div className="field">
            <label htmlFor="color">Color</label>
            <input id="color" name="color" value={form.color} onChange={onChange} placeholder="e.g., Navy" required readOnly />
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
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={form.quantity}
              onChange={(e) => {
                const v = e.target.value
                setForm((f) => ({ ...f, quantity: v }))
                const num = Number(v || 0)
                if (availableQty && num > availableQty) setValidationMsg(`Max available: ${availableQty} ${form.unit}`)
                else setValidationMsg('')
              }}
              placeholder="0"
              min="0"
              required
            />
            {availableQty > 0 && (
              <small style={{ display: 'block', marginTop: 4 }}>Available: {availableQty} {form.unit}</small>
            )}
            {validationMsg && (
              <small style={{ display: 'block', marginTop: 4, color: 'var(--danger, #b00020)' }}>{validationMsg}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="unit">Unit</label>
            <input id="unit" name="unit" value={form.unit} onChange={onChange} placeholder="pcs" required readOnly />
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
          <button className="btn" type="button" onClick={() => setForm({ partyName: '', partyContact: '', productName: '', productCode: '', category: '', size: '', color: '', quantity: '', unit: 'pcs', pricePerUnit: '', dispatchNoteNo: '', issuedBy: '', approvedBy: '', deliveryMode: '', destination: '', remarks: '' })} disabled={submitting}>Clear</button>
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
          <img src={qrPreview} alt="Stock Out Barcode" style={{ maxWidth: 240, border: '1px solid #ddd' }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <a className="btn" href={qrPreview} download={`stock-out-${form.productCode || 'item'}.png`}>Download</a>
          </div>
        </div>
      )}
    </div>
  )
}

