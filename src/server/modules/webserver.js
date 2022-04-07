import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {alert, info} from "../helpers/logging.js";
import favicon from "serve-favicon"
import {decodeMnemonic, encodeMnemonic} from "../components/mnemonic.js";
import {Account} from "../aptos/account.js";
import assert from "assert";
import {fundAddress} from "../components/fund-address.js";
import {checkAddress} from "../components/check-address.js";
import {entropyToMnemonic} from "bip39";
import {createAddress} from "../components/create-address.js";
import {sendCoins} from "../components/send-coins";
import {genQRCode} from "../components/gen-qrcode.js";

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

    app.post('/create', async (req, res) => {
        try {
            assert(req.body.timestamp, "Bad request")
            const account = createAddress()
            res.send({
                ...account
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
            await fundAddress(req.body.address)
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
            const {sender, receiver, amount = 0} = req.body
            assert(sender, "Sender address required")
            assert(receiver, "Receiver address required")
            assert(receiver.length === 64, "Receiver address length not right")
            const tx_hash = await sendCoins(req.session.seed, receiver, amount)
            res.send({
                tx_hash
            })
        } catch (e) {
            alert(e.message)
            req.session.error = e.message
            res.send({error: e.message})
        }
    })

    app.post('/auth', async (req, res) => {
        let seed, account, wallet

        try {
            assert(req.body.mnemonic, "Mnemonic required")

            seed = decodeMnemonic(req.body.mnemonic)
            account = new Account(seed)
            wallet = await checkAddress(account.address())

            assert(wallet !== false, "Bad mnemonic, address not found in blockchain!")

            wallet.publicKey = account.pubKey()
            wallet.authKey = account.authKey()
            wallet.mnemonic = req.body.mnemonic

            req.session.wallet = wallet
            req.session.seed = seed
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

            await fundAddress(req.body.address, req.body.amount)

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
