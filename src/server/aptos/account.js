import SHA3 from "js-sha3"
import Nacl from "tweetnacl"
import { Buffer } from 'buffer'

const {sign} = Nacl
const {sha3_256} = SHA3
const KEY_SIZE = 32

export class Account {
    signingKey = {}

    constructor(seed){
        if (seed) {
            if (typeof seed === "string") {
                seed = Uint8Array.from(Buffer.from(seed, 'hex'))
            }
            this.signingKey = sign.keyPair.fromSeed(seed)
        } else {
            this.signingKey = sign.keyPair()
        }
    }

    seed(){
        return Buffer.from(this.signingKey.secretKey).toString("hex").slice(0, 64)
    }

    address(){
        return this.authKey()
    }

    authKey(){
        let hash = sha3_256.create()
        hash.update(Buffer.from(this.signingKey.publicKey))
        hash.update("\x00")
        return hash.hex()
    }

    pubKey(){
        return Buffer.from(this.signingKey.publicKey).toString("hex")
    }
}