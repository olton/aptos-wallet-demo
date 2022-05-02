import {info} from "../helpers/logging.js"
import {runWebServer} from "./webserver.js"
import {FaucetClient, Aptos} from "@olton/aptos";
import {createDBConnection} from "./postgres.js";

const runProcesses = () => {
    setImmediate( () => {} )
}

export const run = () => {
    info("Starting Aptos Wallet Server...")

    try {
        globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
        globalThis.cache = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value
                return true
            }
        })

        globalThis.aptos = new Aptos(config.api.rest)
        globalThis.faucet = new FaucetClient(config.api.faucet, aptos)

        aptos.setGasValue({
            max_gas_amount: 100
        })

        createDBConnection()
        runProcesses()
        runWebServer()

        info("Welcome to Aptos Wallet Server!")
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}