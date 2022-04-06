import {info} from "../helpers/logging.js"
import fs from "fs"
import {runWebServer} from "./webserver.js"

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

        runProcesses()
        runWebServer()

        info("Welcome to Aptos Wallet Server!")
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}