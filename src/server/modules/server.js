import {info} from "../helpers/logging.js"
import fs from "fs"
import {runWebServer} from "./webserver.js"
import {FaucetClient, RestClient} from "@olton/aptos";

const readConfig = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))

const runProcesses = () => {
    setImmediate( () => {} )
}

export const run = (configPath) => {
    info("Starting Aptos Wallet Server...")

    try {

        globalThis.config = readConfig(configPath)
        globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
        globalThis.cache = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value
                return true
            }
        })

        globalThis.rest = new RestClient(config.api.rest)
        globalThis.faucet = new FaucetClient(config.api.faucet, rest)

        runProcesses()
        runWebServer()

        info("Welcome to Aptos Wallet Server!")
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}