import {RestClient} from "../aptos/rest-client.js";

export const getAddressTransactions = async (address, limit = 25, start = 0) => {
    if (!address) {
        return []
    }
    try {
        const rest = new RestClient(config.api.rest)
        return await rest.accountTransactions(address, limit, start)
    } catch (e) {
        return []
    }
}

export const getAddressTransactionsSent = async (address, limit = 25, start = 0) => {
    if (!address) {
        return []
    }
    try {
        const coin = config.aptos.coin
        let limit = 25, start = 0
        const rest = new RestClient(config.api.rest)
        const resources = rest.accountResourcesTyped(address)

        start = resources[`0x1::${coin}::TransferEvents`].sent_events - 25
        if (start < 0) start = 0

        return await rest.accountTransactions(address, limit, start)
    } catch (e) {
        return []
    }
}

export const getLastSentCoins = async (address, limit) => {
    if (!address) {
        return []
    }
    try {
        const coin = config.aptos.coin
        let limit = 25, start
        const rest = new RestClient(config.api.rest)
        const resources = await rest.accountResourcesTyped(address)

        start = resources[`0x1::${coin}::TransferEvents`]["sent_events"].counter - 25
        if (start < 0) start = 0

        return await rest.accountSentCoins(address, coin, limit, start)
    } catch (e) {
        console.log("Get sent coins error.", e.message)
        return []
    }
}

export const getLastReceivedCoins = async (address, limit) => {
    if (!address) {
        return []
    }
    try {
        const coin = config.aptos.coin
        let limit = 25, start
        const rest = new RestClient(config.api.rest)
        const resources = await rest.accountResourcesTyped(address)

        console.log("R: ", resources[`0x1::${coin}::TransferEvents`]["received_events"])

        start = resources[`0x1::${coin}::TransferEvents`]["received_events"].counter - 25
        if (start < 0) start = 0

        return await rest.accountReceivedCoins(address, coin, limit, start)
    } catch (e) {
        console.log("Get received coins error.", e.message)
        return []
    }
}

