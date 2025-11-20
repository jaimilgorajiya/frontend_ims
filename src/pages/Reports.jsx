import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Eye, Download, Search, ArrowUpDown } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Reports({ filter }) {
  const [stockIns, setStockIns] = useState([])
  const [stockOuts, setStockOuts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [queryIn, setQueryIn] = useState('')
  const [queryOut, setQueryOut] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [toast, setToast] = useState('')

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

  const norm = (v) => (v ?? '').toString().toLowerCase()
  const matchAnyField = (row, q) => {
    try {
      return Object.values(row).some((val) => norm(val).includes(q))
    } catch {
      return false
    }
  }
  const filteredIns = stockIns.filter((r) => {
    if (!queryIn) return true
    const q = norm(queryIn)
    return matchAnyField(r, q)
  })
  const filteredOuts = stockOuts.filter((r) => {
    if (!queryOut) return true
    const q = norm(queryOut)
    return matchAnyField(r, q)
  })

  const getVal = (row, key) => {
    if (key === 'date') return new Date(row.createdAt || row.date || 0).getTime()
    if (key === 'quantity') return Number(row.quantity) || 0
    if (key === 'total') return Number(row.totalAmount) || 0
    return 0
  }
  const sortRows = (rows) => {
    const key = sortKey === 'total' ? 'total' : sortKey // keep mapping
    return [...rows].sort((a, b) => {
      const av = getVal(a, key)
      const bv = getVal(b, key)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }
  const sortedIns = sortRows(filteredIns)
  const sortedOuts = sortRows(filteredOuts)

  const toggleSort = (key) => {
    setSortKey((k) => (k === key ? k : key))
    setSortDir((d) => (sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'desc'))
  }

  const onConfirmDownload = (fileUrl) => {
    try {
      const a = document.createElement('a')
      a.href = fileUrl
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setToast('Download started')
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('Download failed')
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <div className="page">
      <header className="form-header">
        <h2>Reports</h2>
       
      </header>
      {loading && <div>Loading...</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && (
        <>
          {showIn && (
          <section>
            <h3 className="section-title">Stock In</h3>
            <div className="table-wrap">
              <div className="toolbar toolbar-inset">
                <div className="field full">
                  <div className="search-input">
                    <Search size={16} />
                    <input id="searchIn" value={queryIn} onChange={(e) => setQueryIn(e.target.value)} placeholder="Search by Vendor, Product, Code, Quantity, Price, Total" />
                  </div>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th-click" onClick={() => toggleSort('date')}>Date <ArrowUpDown size={14} className={`sort ${sortKey==='date'?sortDir:''}`} /></th>
                    <th>Vendor</th>
                    <th>Product</th>
                    <th>Code</th>
                    <th className="th-click" onClick={() => toggleSort('quantity')}>Qty <ArrowUpDown size={14} className={`sort ${sortKey==='quantity'?sortDir:''}`} /></th>
                    <th>Price</th>
                    <th className="th-click" onClick={() => toggleSort('total')}>Total <ArrowUpDown size={14} className={`sort ${sortKey==='total'?sortDir:''}`} /></th>
                    <th style={{minWidth:120}}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedIns.map((row) => (
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
              <div className="toolbar toolbar-inset">
                <div className="field full">
                  <div className="search-input">
                    <Search size={16} />
                    <input id="searchOut" value={queryOut} onChange={(e) => setQueryOut(e.target.value)} placeholder="Search by Party, Product, Code, Quantity, Price, Total" />
                  </div>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th-click" onClick={() => toggleSort('date')}>Date <ArrowUpDown size={14} className={`sort ${sortKey==='date'?sortDir:''}`} /></th>
                    <th>Party</th>
                    <th>Product</th>
                    <th>Code</th>
                    <th className="th-click" onClick={() => toggleSort('quantity')}>Qty <ArrowUpDown size={14} className={`sort ${sortKey==='quantity'?sortDir:''}`} /></th>
                    <th>Price</th>
                    <th className="th-click" onClick={() => toggleSort('total')}>Total <ArrowUpDown size={14} className={`sort ${sortKey==='total'?sortDir:''}`} /></th>
                    <th style={{minWidth:120}}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOuts.map((row) => (
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
