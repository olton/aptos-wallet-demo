import {FaucetClient} from "../aptos/faucet-client";
import {RestClient} from "../aptos/rest-client";

export const fundAddress = async (address, amount = 0) => {
    const rest = new RestClient(config.api.rest)
    const faucet = new FaucetClient(config.api.faucet, rest)

    await faucet.fundAccount(address, +amount)

    const balance = rest.accountBalance(address)

    return {
        address,
        balance
    }
}