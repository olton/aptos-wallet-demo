import {entropyToMnemonic} from "bip39";
import {Account} from "../aptos/account";
import {FaucetClient} from "../aptos/faucet-client";

export const createAddress = async () => {
    const account = new Account()
    const faucet = new FaucetClient(config.api.faucet)

    let address, seed, mnemonic, publicKey

    address = account.address()
    seed = account.seed()
    publicKey = account.seed()
    mnemonic = entropyToMnemonic(seed)

    await faucet.fundAccount(address, 0)

    return {
        address,
        publicKey,
        seed,
        mnemonic
    }
}