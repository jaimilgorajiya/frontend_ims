import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Eye, Download } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Records({ filter }) {
  const [stockIns, setStockIns] = useState([])
  const [stockOuts, setStockOuts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [inRes, outRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/stock-in`),
          axios.get(`${BASE_URL}/api/stock-out`)
        ])
        const inData = inRes.data
        const outData = outRes.data
        if (inData.success === false) throw new Error(inData.message || 'Failed to fetch stock-ins')
        if (outData.success === false) throw new Error(outData.message || 'Failed to fetch stock-outs')
        if (!ignore) {
          setStockIns(inData.data || [])
          setStockOuts(outData.data || [])
        }
      } catch (e) {
        if (!ignore) setError(e.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const showIn = !filter || filter === 'in'
  const showOut = !filter || filter === 'out'

  return (
    <div className="page">
      <header className="form-header">
        <h2>Records</h2>
    
      </header>
      {loading && <div>Loading...</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && (
        <>
          {showIn && (
          <section>
            <h3 className="section-title">Stock In</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th style={{minWidth:120}}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {stockIns.map((row) => (
                    <tr key={row._id}>
                      <td>{new Date(row.createdAt || row.date).toLocaleString()}</td>
                      <td>{row.vendorName}</td>
                      <td>{row.productName}</td>
                      <td>{row.productCode}</td>
                      <td>{row.quantity} {row.unit}</td>
                      <td>{row.pricePerUnit}</td>
                      <td>{row.totalAmount}</td>
                      <td>
                        {row.receiptPath ? (
                          <div className="actions">
                            <a className="btn sm" href={`${BASE_URL}${row.receiptPath}`} target="_blank" rel="noreferrer" title="View PDF">
                              <Eye size={16} style={{marginRight:6}} /> View
                            </a>
                            <a className="btn sm" href={`${BASE_URL}${row.receiptPath}`} download title="Download PDF">
                              <Download size={16} style={{marginRight:6}} /> Download
                            </a>
                          </div>
                        ) : (
                          <span className="muted">No PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}

          {showOut && (
          <section style={{ marginTop: 24 }}>
            <h3 className="section-title">Stock Out</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th style={{minWidth:120}}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {stockOuts.map((row) => (
                    <tr key={row._id}>
                      <td>{new Date(row.createdAt || row.date).toLocaleString()}</td>
                      <td>{row.partyName}</td>
                      <td>{row.productName}</td>
                      <td>{row.productCode}</td>
                      <td>{row.quantity} {row.unit}</td>
                      <td>{row.pricePerUnit}</td>
                      <td>{row.totalAmount}</td>
                      <td>
                        {row.receiptPath ? (
                          <div className="actions">
                            <a className="btn sm" href={`${BASE_URL}${row.receiptPath}`} target="_blank" rel="noreferrer" title="View PDF">
                              <Eye size={16} style={{marginRight:6}} /> View
                            </a>
                            <a className="btn sm" href={`${BASE_URL}${row.receiptPath}`} download title="Download PDF">
                              <Download size={16} style={{marginRight:6}} /> Download
                            </a>
                          </div>
                        ) : (
                          <span className="muted">No PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}
        </>
      )}
    </div>
  )
}
