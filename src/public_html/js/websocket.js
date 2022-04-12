
globalThis.webSocket = null

const isOpen = (ws) => ws && ws.readyState === ws.OPEN

const connect = () => {
    const {host, port = 80, secure} = config.server
    const ws = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}:${port}`)

    globalThis.webSocket = ws

    ws.onmessage = event => {
        try {
            const content = JSON.parse(event.data)
            if (typeof wsMessageController === 'function') {
                wsMessageController.apply(null, [ws, content])
            }
        } catch (e) {
            console.log(e.message)
            console.log(event.data)
            console.log(e.stack)
        }
    }

    ws.onerror = error => {
        error('Socket encountered error: ', error.message, 'Closing socket');
        ws.close();
    }

    ws.onclose = event => {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(connect, 1000)
    }

    ws.onopen = event => {
        console.log('Connected to Aptos Wallet Server');
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestBalance = (ws) => {
        if (isOpen(ws)) {
            ws.send(JSON.stringify({channel: 'balance', data: {address: wallet.address}}))
        }
    }

    const requestSentCoins = (ws) => {
        if (isOpen(ws)) {
            // ws.send(JSON.stringify({channel: 'transactions', data: {address: wallet.address, limit: 1000, start: 0}}))
            ws.send(JSON.stringify({channel: 'last-sent-coins', data: {address: wallet.address, limit: 25}}))
        }
    }

    const requestReceivedCoins = (ws) => {
        if (isOpen(ws)) {
            ws.send(JSON.stringify({channel: 'last-received-coins', data: {address: wallet.address, limit: 25}}))
        }
    }



    switch(channel) {
        case 'welcome': {
            requestBalance(ws)
            requestSentCoins(ws)
            requestReceivedCoins(ws)
            break
        }
        case 'balance': {
            updateBalance(data)
            setTimeout(requestBalance, 10000, ws)
            break
        }
        case 'transactions': {
            updateLastSentCoins(data)
            setTimeout(requestSentCoins, 10000, ws)
            break
        }
        case 'last-received-coins': {
            updateLastReceivedCoins(data)
            setTimeout(requestReceivedCoins, 10000, ws)
            break
        }
        case 'last-sent-coins': {
            updateLastSentCoins(data)
            setTimeout(requestReceivedCoins, 10000, ws)
            break
        }
    }
}

connect()

globalThis.refreshBalance = () => {
    const ws = globalThis.webSocket
    if (ws && isOpen(ws)) {
        ws.send(JSON.stringify({channel: 'balance', data: {address: wallet.address}}))
    }
}

globalThis.initAddress = (address) => {
    const ws = globalThis.webSocket
    if (ws && isOpen(ws)) {
        ws.send(JSON.stringify({channel: 'init', data: {address}}))
    }
}

