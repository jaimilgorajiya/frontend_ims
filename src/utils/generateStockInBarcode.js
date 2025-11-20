import * as JsBarcodeNS from 'jsbarcode'

export async function generateStockInBarcode(detailsObject, { filename = 'stock-in-barcode', format = 'png', autoDownload = false, width = 2, height = 80, displayValue = false } = {}) {
  const JsBarcode = JsBarcodeNS.default || JsBarcodeNS

  const t = (s, n) => (s == null ? '' : String(s).slice(0, n))
  const payload = [
    `Product Name :${t(detailsObject?.productName, 24)}`,
  ].join('\n')

  const canvas = document.createElement('canvas')
  JsBarcode(canvas, payload, { format: 'CODE128', width, height, displayValue })
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const dataUrl = canvas.toDataURL(mime)
  if (autoDownload) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return dataUrl
}
