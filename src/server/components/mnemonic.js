import {mnemonicToEntropy} from "bip39";

export const decodeMnemonic = m => mnemonicToEntropy(m)