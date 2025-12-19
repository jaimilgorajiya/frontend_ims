import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, Search } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AvailableProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${BASE_URL}/api/stock/summary`)
        const data = res.data
        if (data.success === false) throw new Error(data.message || 'Failed to fetch stock summary')
        if (!ignore) {
          setProducts(data.data || [])
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

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalInventoryValue = filteredProducts.reduce((acc, curr) => acc + (curr.inventoryValue || 0), 0)

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)
  }

  return (
    <div className="page">
      <header className="form-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px'}}>
        <div>
          <h2>Available Products</h2>
        </div>
        <div className="total-preview" style={{fontSize: '1.2rem', background: 'rgba(91, 103, 255, 0.1)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(91, 103, 255, 0.2)'}}>
          <span className="muted" style={{fontSize: '0.9rem', display: 'block', marginBottom: '4px'}}>Total Inventory Value</span>
          <strong style={{color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px'}}>
            {formatCurrency(totalInventoryValue)}
          </strong>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-input">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Size</th>
                <th>Color</th>
                <th className="num">In Stock</th>
                <th className="num">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No products found</td>
                </tr>
              ) : (
                filteredProducts.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '6px', 
                          background: 'rgba(91, 103, 255, 0.1)', color: '#5b67ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Package size={16} />
                        </div>
                        {row.productName}
                      </div>
                    </td>
                    <td><span className="badge">{row.productCode}</span></td>
                    <td>{row.category}</td>
                    <td>{row.size}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <span style={{
                          display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', 
                          backgroundColor: row.color.toLowerCase(), border: '1px solid rgba(255,255,255,0.2)'
                        }} />
                        {row.color}
                      </div>
                    </td>
                    <td className="num">
                      <span style={{
                        fontWeight: 'bold', 
                        color: row.availableQuantity < 10 ? '#fbbf24' : '#4ade80'
                      }}>
                        {row.availableQuantity} 
                      </span>
                    </td>
                    <td className="num value-text" style={{fontWeight: 600}}>{formatCurrency(row.inventoryValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
