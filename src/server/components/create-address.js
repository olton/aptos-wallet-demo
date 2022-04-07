import {entropyToMnemonic} from "bip39";
import {Account} from "../aptos/account";

export const createAddress = () => {
    const account = new Account()

    let address, seed, mnemonic, publicKey, authKey

    address = account.address()
    seed = account.seed()
    publicKey = account.seed()
    authKey = account.authKey()
    mnemonic = entropyToMnemonic(seed)

    return {
        address,
        publicKey,
        authKey,
        mnemonic
    }
}