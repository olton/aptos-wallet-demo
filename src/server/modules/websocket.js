import {WebSocketServer, WebSocket} from "ws";
import {getAddressTransactions, getLastReceivedCoins, getLastSentCoins} from "../components/transactions";
import {getAddressBalance} from "../components/get-balance.js";
import {fundAddress} from "../components/fund-address.js";

export const websocket = (server) => {
    globalThis.wss = new WebSocketServer({ server })

    wss.on('connection', (ws, req) => {

        const ip = req.socket.remoteAddress

        ws.send(JSON.stringify({
            channel: "welcome",
            data: `Welcome to Aptos Wallet Server v${version}`
        }))

        ws.on('message', async (msg) => {
            const {channel, data} = JSON.parse(msg)
            switch (channel) {
                case "balance": {
                    const {address} = data
                    response(ws, channel, {balance: await getAddressBalance(address), address})
                    break
                }
                case "transactions": {
                    const {address, limit, start} = data
                    response(ws, channel, {transactions: await getAddressTransactions(address, limit, start), address})
                    break
                }
                case "last-sent-coins": {
                    const {address, limit} = data
                    const coins = await getLastSentCoins(address, limit)
                    response(ws, channel, {address, coins})
                    break
                }
                case "last-received-coins": {
                    const {address, limit = 25} = data
                    const coins = await getLastReceivedCoins(address, limit)
                    response(ws, channel, {address, coins})
                    break
                }
                case "init": {
                    const {address} = data
                    await fundAddress(address)
                    response(ws, channel, {address})
                    break
                }
            }
        })
    })
}

export const response = (ws, channel, data) => {
    ws.send(JSON.stringify({
        channel,
        data
    }))
}

export const broadcast = (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    })
}
