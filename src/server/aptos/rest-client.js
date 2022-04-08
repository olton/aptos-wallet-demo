import fetch from "cross-fetch"
import assert from "assert"
import Nacl from "tweetnacl"

const {sign} = Nacl

export class RestClient {
    url = ""

    constructor(url = "") {
        this.url = url
    }

    /**
     * Returns the sequence number and authentication key for an account
     * @param accountAddress
     * @returns {Promise<unknown>}
     */
    async account(accountAddress = ""){
        const response = await fetch(`${this.url}/accounts/${accountAddress}`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    /**
     * Returns the coin balance associated with the account
     * @param accountAddress
     * @param coin
     * @returns {Promise<null|number>}
     */
    async accountBalance(accountAddress, coin = 'TestCoin') {
        const resources = await this.accountResources(accountAddress)
        for (const key in resources) {
            const resource = resources[key]
            if (resource["type"] === `0x1::${coin}::Balance`) {
                return parseInt(resource["data"]["coin"]["value"])
            }
        }
        return null
    }

    async accountEvents(accountAddress = "", event, field, limit = 25, start = 0){
        try {
            const response = await fetch(`${this.url}/accounts/${accountAddress}/events/${event}/${field}?limit=${limit}&start=${start}`, {method: "GET"})
            if (response.status !== 200) {
                assert(response.status === 200, await response.text())
            }
            return await response.json()
        } catch (e) {
            console.log(e.message)
            return null
        }
    }

    async accountSentCoins(accountAddress = "", coin = "TestCoin", limit = 25, start = 0){
        return await this.accountEvents(accountAddress, `0x1::${coin}::TransferEvents`, 'sent_events', limit, start)
    }

    async accountReceivedCoins(accountAddress = "", coin = "TestCoin", limit = 25, start = 0){
        return await this.accountEvents(accountAddress, `0x1::${coin}::TransferEvents`, 'received_events', limit, start)
    }


    /**
     * Returns all resources associated with the account
     * @param accountAddress
     * @returns {Promise<unknown>}
     */
    async accountResources(accountAddress = ""){
        const response = await fetch(`${this.url}/accounts/${accountAddress}/resources`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    async accountResourcesTyped(accountAddress = ""){
        const response = await fetch(`${this.url}/accounts/${accountAddress}/resources`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        const resources = await response.json()
        const result = []

        for(let r of resources) {
            result[r.type] = r.data
        }
        return result
    }

    /**
     * Generates a transaction request that can be submitted to produce a raw transaction that
     *    can be signed, which upon being signed can be submitted to the blockchain
     * @param sender
     * @param payload
     * @returns {Promise<{sequence_number: string, gas_currency_code: string, sender: string, payload: {}, gas_unit_price: string, max_gas_amount: string, expiration_timestamp_secs: string}>}
     */
    async generateTransaction(sender = "", payload = {}){
        const account = await this.account(sender)
        const seqNum = parseInt(account["sequence_number"])
        return {
            "sender": `0x${sender}`,
            "sequence_number": seqNum.toString(),
            "max_gas_amount": "1000",
            "gas_unit_price": "1",
            "gas_currency_code": "XUS",
            "expiration_timestamp_secs": (Math.floor(Date.now() / 1000) + 600).toString(), // Unix timestamp, in seconds + 10 minutes ???
            "payload": payload,
        }
    }

    /**
     * Converts a transaction request produced by `generate_transaction` into a properly signed
     *    transaction, which can then be submitted to the blockchain
     * @param accountFrom
     * @param txnRequest
     * @returns {Promise<{}>}
     */
    async signTransaction(/* Account */ accountFrom, txnRequest = {}){
        const response = await fetch(`${this.url}/transactions/signing_message`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 200) {
            assert(response.status === 200, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        const result = await response.json()
        const toSign = Buffer.from(result["message"].substring(2), "hex")
        const signature = sign(toSign, accountFrom.signingKey.secretKey)
        const signatureHex = Buffer.from(signature).toString("hex").slice(0, 128)
        txnRequest["signature"] = {
            "type": "ed25519_signature",
            "public_key": `0x${accountFrom.pubKey()}`,
            "signature": `0x${signatureHex}`,
        }
        return txnRequest
    }

    /**
     * Submits a signed transaction to the blockchain
     * @param txnRequest
     * @returns {Promise<unknown>}
     */
    async submitTransaction(txnRequest = {}){
        const response = await fetch(`${this.url}/transactions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(txnRequest)
        })
        if (response.status !== 202) {
            assert(response.status === 202, (await response.text()) + " - " + JSON.stringify(txnRequest))
        }
        return await response.json()
    }

    /**
     *
     * @param txnHash
     * @returns {Promise<boolean>}
     */
    async transactionPending(txnHash){
        const response = await fetch(`${this.url}/transactions/${txnHash}`, {method: "GET"})
        if (response.status === 404) {
            return true
        }
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return (await response.json())["type"] === "pending_transaction"
    }

    /**
     * Waits up to 10 seconds for a transaction to move past pending state
     * @param txnHash
     * @returns {Promise<void>}
     */
    async waitForTransaction(txnHash) {
        let count = 0
        while (await this.transactionPending(txnHash)) {
            assert(count < 10)
            await new Promise(resolve => setTimeout(resolve, 1000))
            count += 1
            if (count >= 10) {
                throw new Error(`Waiting for transaction ${txnHash} timed out!`)
            }
        }
    }

    /**
     * Get Address transactions
     * @param accountAddress
     * @param limit
     * @param start
     * @returns {Promise<any>}
     */
    async accountTransactions(accountAddress, limit = 25, start = 0){
        const response = await fetch(`${this.url}/accounts/${accountAddress}/transactions?limit=${limit}&start=${start}`, {method: "GET"})
        if (response.status !== 200) {
            assert(response.status === 200, await response.text())
        }
        return await response.json()
    }

    /**
     * Transfer a given coin amount from a given Account to the recipient's account address.
     *    Returns the sequence number of the transaction used to transfer
     * @param accountFrom
     * @param recipient
     * @param amount
     * @returns {Promise<string>}
     */
    async transfer(accountFrom, recipient = "", amount = 0){
        const payload = {
            type: "script_function_payload",
            function: "0x1::TestCoin::transfer",
            type_arguments: [],
            arguments: [
                `0x${recipient}`,
                amount.toString(),
            ]
        };
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }

    /**
     * Create a new account in blockchain
     * @param accountFrom
     * @param accountNew
     * @returns {Promise<string>}
     */
    async createAccount(accountFrom, accountNew){
        const payload = {
            "type": "script_function_payload",
            "function": "0x1::AptosAccount::create_account",
            "type_arguments": [],
            "arguments": [
                "0x" + accountNew.address(),
                "0x" + accountNew.authKey(), // ???
            ]
        }
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }

    /**
     * Publish a new module to the blockchain within the specified account
     * @param accountFrom
     * @param moduleHex
     * @returns {Promise<string>}
     */
    async publishModule(accountFrom, moduleHex = ""){
        const payload = {
            "type": "module_bundle_payload",
            "modules": [
                {"bytecode": `0x${moduleHex}`},
            ],
        }
        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }

    /**
     * Retrieve the resource Message
     * @param contractAddress
     * @param accountAddress
     * @returns {Promise<*>}
     */
    async getMessage(contractAddress, accountAddress){
        const resources = await this.accountResources(accountAddress);
        for (const key in resources) {
            const resource = resources[key];
            if (resource["type"] === `0x${contractAddress}::Message::MessageHolder`) {
                return resource["data"]["message"];
            }
        }
    }

    /**
     * Potentially initialize and set the resource Message
     * @returns {Promise<string>}
     * @param contractAddress
     * @param accountFrom
     * @param message
     */
    async setMessage(contractAddress, accountFrom, message){
        let payload = {
            "type": "script_function_payload",
            "function": `0x${contractAddress}::Message::set_message`,
            "type_arguments": [],
            "arguments": [
                Buffer.from(message, "utf-8").toString("hex")
            ]
        };

        const txnRequest = await this.generateTransaction(accountFrom.address(), payload)
        const signedTxn = await this.signTransaction(accountFrom, txnRequest)
        const res = await this.submitTransaction(signedTxn)
        return res["hash"].toString()
    }
}