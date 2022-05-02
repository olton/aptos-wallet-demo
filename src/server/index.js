import path from "path"
import { fileURLToPath } from 'url'
import {run} from "./modules/server.js"
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))

globalThis.rootPath = path.dirname(path.dirname(__dirname))
globalThis.serverPath = __dirname
globalThis.clientPath = rootPath + "/src/public_html"
globalThis.srcPath = rootPath + "/src"
globalThis.pkg = readJson(""+path.resolve(rootPath, "package.json"))
globalThis.config = readJson(""+path.resolve(serverPath, "config.json"))
globalThis.version = pkg.version

run()