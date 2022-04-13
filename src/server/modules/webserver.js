import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {alert, info} from "../helpers/logging.js";
import favicon from "serve-favicon"
import assert from "assert";
import {genQRCode} from "../helpers/gen-qrcode.js";
import {Account} from "@olton/aptos";
import {parseJson} from "../helpers/parse-json.js";

const app = express()

const route = () => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
        resave: false,
        saveUninitialized: false,
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

    app.post('/create', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            const account = new Account()
            res.send({
                address: account.address(),
                publicKey: account.pubKey(),
                authKey: account.authKey(),
                mnemonic: account.mnemonic()
            })
        } catch (e) {
            alert(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/init', async (req, res) => {
        try {
            assert(req.body.address, "Address required")
            await faucet.fundAddress(req.body.address)
            res.send({
                ok: true
            })
        } catch (e) {
            alert(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/send-coins', async (req, res) => {
        try {
            let {sender, receiver, amount = 0} = req.body
            if (receiver.substr(0, 2) === "0x") {
                receiver = receiver.substr(2)
            }
            assert(sender, "Sender address required")
            assert(receiver, "Receiver address required")
            assert(receiver.length === 64, "Receiver address length not right")
            const result = await rest.sendCoins(new Account(req.session.seed), receiver, amount)
            if (result) {
                res.send({
                    tx_hash: rest.getLastTransaction().hash
                })
            } else {
                res.send({
                    error: rest.getLastTransaction().vm_status
                })
            }
        } catch (e) {
            const error = parseJson(e.message)
            const message = error.message ? error.message : JSON.stringify(error)
            req.session.error = message
            res.send({error: message})
        }
    })

    app.post('/auth', async (req, res) => {
        let account, wallet = {}

        try {
            assert(req.body.mnemonic, "Mnemonic required")

            account = Account.fromMnemonic(req.body.mnemonic)
            assert(account.privateKey().length === 64, 'Invalid Mnemonic')

            wallet.address = account.address()
            wallet.publicKey = account.pubKey()
            wallet.authKey = account.authKey()
            wallet.mnemonic = account.mnemonic()

            req.session.wallet = wallet
            req.session.seed = account.privateKey()
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
            assert(req.body.authKey, "AuthKey required")

            await faucet.fundAddress(req.body.authKey, req.body.amount)

            res.send({ok: true})
        } catch (e) {
            alert(e.message)
            res.send({error: e.message})
        }
    })

    app.post('/qrcode', async(req, res) => {
        try {
            assert(req.body.address, "Address required")
            const qrcode = await genQRCode(req.body.address)
            res.send({qrcode})
        } catch (e) {
            alert(e.message)
            res.send({error: e.message})
        }
    })

    app.post('/ping', async(req, res) => {
        try {
            assert(req.session.wallet, "Authentication required")
            res.send({wallet: req.session.wallet})
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
