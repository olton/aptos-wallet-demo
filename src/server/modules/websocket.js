import {WebSocketServer, WebSocket} from "ws";
import {getReceivedEvents, getSentEvents} from "./indexer.js";

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
                    let balance
                    try {
                        balance = await aptos.getAccountBalance(address)
                    } catch (e) {
                        balance = 0
                    }
                    response(ws, channel, {balance, address})
                    break
                }
                case "transactions": {
                    const {address, limit} = data
                    let transactions
                    try {
                        transactions = await aptos.getAccountTransactionsLast(address, limit)
                    } catch (e) {
                        transactions = []
                    }
                    response(ws, channel, {transactions, address})
                    break
                }
                case "sent-coins": {
                    const {address, limit = 25} = data
                    let coins
                    try {
                        coins = await getSentEvents(address, {limit})
                    } catch (e) {
                        coins = []
                    }
                    response(ws, channel, {address, coins})
                    break
                }
                case "received-coins": {
                    const {address, limit = 25} = data
                    let coins
                    try {
                        coins = await getReceivedEvents(address, {limit})
                    } catch (e) {
                        coins = []
                    }
                    response(ws, channel, {address, coins})
                    break
                }
                case "init": {
                    const {address} = data
                    await faucet.fundAddress(address)
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
