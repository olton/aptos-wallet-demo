import pkg from "../../package.json"
import path from "path"
import { fileURLToPath } from 'url'
import {run} from "./modules/server"
import {RestClient} from "@olton/aptos";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

globalThis.rootPath = path.dirname(path.dirname(__dirname))
globalThis.serverPath = __dirname
globalThis.clientPath = rootPath + "/src/public_html"
globalThis.srcPath = rootPath + "/src"
globalThis.version = pkg.version

run(path.resolve(serverPath, "config.json"))