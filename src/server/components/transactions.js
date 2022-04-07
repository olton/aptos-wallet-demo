import {RestClient} from "../aptos/rest-client.js";

export const getAddressTransactions = async (address, limit = 25, start = 0) => {
    if (!address) {
        return []
    }

    const rest = new RestClient(config.api.rest)

    return await rest.accountTransactions(address, limit, start)
}
