import {RestClient} from "../aptos/rest-client.js";
import {Account} from "../aptos/account.js";

export const sendCoins = async (sender, receiver, amount = 0) => {
    const account = new Account(sender)
    const rest = new RestClient(config.api.rest)

    return await rest.transfer(account, receiver, amount)
}