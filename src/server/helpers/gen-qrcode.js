import QRCode from 'qrcode'

export const genQRCode = async data => {
    return QRCode.toDataURL(data);
}