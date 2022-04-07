import {RestClient} from "../aptos/rest-client.js";

export const getAccount = async (address) => {
    const rest = new RestClient(config.api.rest)

    let account, balance

    account = await rest.account(address)

    if (!account.authentication_key) {
        return false
    }

    balance = await rest.accountBalance(address)

    return {
        address,
        account,
        balance
    }
}
