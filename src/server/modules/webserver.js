import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {alert, info} from "../helpers/logging.js";
import favicon from "serve-favicon"
import {decodeMnemonic} from "../components/mnemonic.js";
import {Account} from "../aptos/account.js";
import assert from "assert";
import {fundAddress} from "../components/fund-address.js";
import {checkAddress} from "../components/get-balance.js";

const app = express()

const route = () => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
        resave: false,
        saveUninitialized: true,
        secret: 'Russian warship - Fuck You!',
        cookie: {
            maxAge: 24 * 3600000,
            secure: 'auto'
        }
    }))
    app.use(express.static(path.join(srcPath, 'public_html')))
    app.use(favicon(path.join(srcPath, 'public_html', 'favicon.ico')))
    app.locals.pretty = true
    app.set('views', path.resolve(srcPath, 'public_html'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify(config.client)
    const dateFormat = JSON.stringify(config['date-format'])

    app.get('/', async (req, res) => {
        res.redirect('/wallet')
    })

    app.get('/wallet', async (req, res) => {

        const session = req.session

        if (!session.wallet) {
            res.redirect('/login')
            return
        }

        res.render('wallet', {
            title: `Aptos Wallet Server v${version}`,
            version,
            clientConfig,
            dateFormat,
            wallet: JSON.stringify(session.wallet)
        })
    })

    app.get('/login', async (req, res) => {
        res.render('login', {
            title: `Login to Aptos Wallet Server v${version}`,
            version,
            clientConfig,
            dateFormat,
            walletError: req.session.error ? req.session.error : false
        })
    })

    app.get('/logout',(req,res) => {
        req.session.destroy()
        res.redirect('/')
    })

    app.post('/auth', async (req, res) => {
        let seed, account, wallet

        try {
            if (!req.body.mnemonic) {
                assert(req.body.mnemonic, "Mnemonic required")
            }

            seed = decodeMnemonic(req.body.mnemonic)
            account = new Account(seed)
            wallet = await checkAddress(account.address())

            assert(wallet !== false, "Bad mnemonic, address not found in blockchain!")

            req.session.wallet = wallet
            res.send(wallet)
        } catch (e) {
            alert(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/charge', async(req, res) => {
        try {
            assert(req.session.wallet, "Authentication required")
            assert(req.body.address, "Address required")

            console.log(req.body)

            await fundAddress(req.body.address, req.body.amount)

            res.send({ok: true})
        } catch (e) {
            alert(e.message)
            res.send({error: e.message})
        }
    })
}

export const runWebServer = () => {
    let httpWebserver, httpsWebserver

    if (ssl) {
        const {cert, key} = config.server.ssl
        httpWebserver = http.createServer((req, res)=>{
            res.writeHead(301,{Location: `https://${req.headers.host}${req.url}`});
            res.end();
        })

        httpsWebserver = https.createServer({
            key: fs.readFileSync(key[0] === "." ? path.resolve(rootPath, key) : key),
            cert: fs.readFileSync(cert[0] === "." ? path.resolve(rootPath, cert) : cert)
        }, app)
    } else {
        httpWebserver = http.createServer({}, app)
    }

    route()

    const runInfo = `Aptos Wallet Server running on ${ssl ? "HTTPS" : "HTTP"} on port ${ssl ? config.server.ssl.port : config.server.port}`

    httpWebserver.listen(config.server.port, () => {
        info(runInfo)
    })

    if (ssl) {
        httpsWebserver.listen(config.server.ssl.port || config.server.port, () => {
            info(runInfo)
        })
    }

    websocket(ssl ? httpsWebserver : httpWebserver)
}
