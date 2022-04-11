import {WebSocketServer, WebSocket} from "ws";

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
                        balance = await rest.getAccountBalance(address)
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
                        transactions = await rest.getAccountTransactionsLast(address, limit)
                    } catch (e) {
                        transactions = []
                    }
                    response(ws, channel, {transactions, address})
                    break
                }
                case "last-sent-coins": {
                    const {address, limit} = data
                    let coins
                    try {
                        coins = await rest.getAccountEventsSentCoinsLast(address, limit)
                    } catch (e) {
                        coins = []
                    }
                    response(ws, channel, {address, coins})
                    break
                }
                case "last-received-coins": {
                    const {address, limit = 25} = data
                    let coins
                    try {
                        coins = await rest.getAccountEventsReceivedCoinsLast(address, limit)
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
