import {WebSocketServer, WebSocket} from "ws";
import {getAddressTransactions} from "../components/transactions";
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
