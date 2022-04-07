import QRCode from 'qrcode'

export const genQRCode = async data => {
    const result = await QRCode.toDataURL(data)
    return result
}