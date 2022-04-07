import {entropyToMnemonic, mnemonicToEntropy} from "bip39";

export const decodeMnemonic = m => mnemonicToEntropy(m)
export const encodeMnemonic = m => entropyToMnemonic(m)