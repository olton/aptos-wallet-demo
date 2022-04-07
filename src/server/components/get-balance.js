import {RestClient} from "../aptos/rest-client.js";

export const getAddressBalance = async (address) => {
    const rest = new RestClient(config.api.rest)

    let account, balance

    try {
        account = await rest.account(address)
        if (!account.authentication_key) {
            return 0
        }
        balance = await rest.accountBalance(address)
        return balance
    } catch (e) {
        return 0
    }
}