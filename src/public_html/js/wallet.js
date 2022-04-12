;$(()=>{
    $("#address").attr("data-value", wallet.address).text(shorten(wallet.address, 12))
    $("#address-balance").attr("data-value", wallet.balance).text(0)
})

const checkWallet = async () => {
    const url = '/ping'
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                address: wallet.address
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json()

        if (!result.error) {
            globalThis.wallet = result.wallet
        }

        if (!wallet || !wallet.address) {
            Metro.toast.create(parseJson(result.error).message, null, 5000, "alert")
            setTimeout( () => {
                window.location.href = '/login'
            }, 3000)
        }

    } catch (e) {
        Metro.toast.create(e.message, null, 5000, "alert")
    } finally {
        setTimeout(checkWallet, 60000)
    }
}

globalThis.updateBalance = data => {
    $("#address-balance").attr("data-value", data.balance).text(n2f(data.balance))
}

globalThis.chargeAccount = async button => {
    const url = '/charge'
    const data = {
        authKey: wallet.authKey,
        amount: 100
    }
    try {
        button.disabled = true
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json();
        if (result.error) {
            Metro.toast.create(result.error, null, 5000, "alert")
        } else {
            refreshBalance()
        }
    } catch (error) {
        Metro.toast.create(error.message, null, 5000, "alert")
    } finally {
        button.disabled = false
    }
}

globalThis.sendCoins = () => {
    const dialogTitle = `
        <div class="d-flex flex-row flex-nowrap flex-align-center">
            <div class="aptos-logo"><img src="images/aptos_word.svg"></div>
            <div class="text-leader ml-2 reduce-2 mt-1">|</div>
            <div class="text-leader ml-1 mt-1">
                <span class="ml-1">SEND</span>
                <span class="">COINS</span>
            </div>
        </div>
        `
    const dialogContent = `
            <div>Send coins to specified address.</div>
            <form id="send_coins_form">
                <ul class="unstyled-list w-100">
                    <li>
                        <div class="text-bold">Receiver:</div>
                        <input class="small-size" data-role="input" name="receiver" placeholder="Enter Receiver Address">
                    </li>
                    <li class="mt-1">
                        <div class="text-bold">Amount:</div>
                        <input class="small-size" data-role="input" name="amount" value="0">
                    </li>
                    <li class="mt-1">
                        <div class="text-bold">Tx Hash:</div>
                        <div class="text-small border bd-system p-2" id="tx_hash">
                            &nbsp;
                        </div>
                    </li>
                </ul>
            </form>
        `

    Metro.dialog.create({
        title: dialogTitle,
        content: dialogContent,
        actionsAlign: "none",
        clsActions: "d-flex flex-row flex-no-wrap",
        actions: [
            {
                caption: "Send Coins",
                cls: "success",
                onclick: async () => {
                    const form = $("#send_coins_form")[0]
                    const sender = wallet.address
                    const receiver = form.elements.receiver.value.trim()
                    const amount = +(form.elements.amount.value.trim()) || 0

                    $("#tx_hash").html("&nbsp;")

                    if (!sender) {
                        window.location.href = "/login"
                        return
                    }

                    if (!receiver) {
                        Metro.toast.create(`You must specify a receiver address!`, null, 5000, "alert")
                        return
                    }
                    try {
                        const response = await fetch('/send-coins', {
                            method: 'POST',
                            body: JSON.stringify({
                                sender,
                                receiver,
                                amount
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })

                        const result = await response.json()

                        if (result.error) {
                            Metro.toast.create(result.error, null, 5000, "alert")
                        } else {
                            Metro.toast.create(`Transaction created with hash ${result.tx_hash}`, null, 5000, "success")
                            $("#tx_hash").text(result.tx_hash)
                        }
                    } catch (e) {
                        Metro.toast.create(e.message, null, 5000, "alert")
                    }
                }
            },
            {
                caption: "Close",
                cls: "js-dialog-close",
                onclick: function(){
                }
            }
        ]
    });
}

globalThis.showWalletInfo = () => {
    const dialogTitle = `
        <div class="d-flex flex-row flex-nowrap flex-align-center">
            <div class="aptos-logo"><img src="images/aptos_word.svg"></div>
            <div class="text-leader ml-2 reduce-2 mt-1">|</div>
            <div class="text-leader ml-1 mt-1">
                <span class="ml-1">WALLET</span>
                <span class="">INFO</span>
            </div>
        </div>
        `
    const dialogContent = `
            <ul class="unstyled-list w-100">
                <li>
                    <div class="text-bold">Mnemonic:</div>
                    <div class="text-small border bd-system p-2 overflow-fs no-overflow-md">
                        ${wallet.mnemonic}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Address:</div>
                    <div class="text-small border bd-system p-2 overflow-fs no-overflow-md">
                        ${wallet.address}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Public Key:</div>
                    <div class="text-small border bd-system p-2 overflow-fs no-overflow-md">
                        ${wallet.publicKey}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Auth Key:</div>
                    <div class="text-small border bd-system p-2 overflow-fs no-overflow-md">
                        ${wallet.authKey}        
                    </div>
                </li>
            </ul>
        `

    Metro.dialog.create({
        title: dialogTitle,
        content: dialogContent,
        actionsAlign: "left",
        actions: [
            {
                caption: "Close",
                cls: "js-dialog-close success",
                onclick: function(){
                }
            }
        ]
    });
}

globalThis.receiveCoins = async () => {
    const url = '/qrcode'
    const data = {
        address: wallet.address
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await response.json();
        if (result.error) {
            Metro.toast.create(result.error, null, 5000, "alert")
        } else {
            const dialogTitle = `
                <div class="d-flex flex-row flex-nowrap flex-align-center">
                    <div class="aptos-logo"><img src="images/aptos_word.svg"></div>
                    <div class="text-leader ml-2 reduce-2 mt-1">|</div>
                    <div class="text-leader ml-1 mt-1">
                        <span class="ml-1">RECEIVE</span>
                        <span class="">COINS</span>
                    </div>
                </div>
           `
            const dialogContent = `
                <div>To receive coins, provide the sender with the address or qr code:</div>
                <ul class="unstyled-list w-100">
                    <li>
                        <div class="text-bold">QR Code:</div>
                        <div class="text-small border bd-system p-2 text-center">
                            <img src="${result.qrcode}">        
                        </div>
                    </li>
                    <li>
                        <div class="text-bold">Address:</div>
                        <div class="text-small border bd-system p-2">
                            ${wallet.address}        
                        </div>
                    </li>
                </ul>
            `

            Metro.dialog.create({
                title: dialogTitle,
                content: dialogContent,
                actionsAlign: "left",
                actions: [
                    {
                        caption: "Close",
                        cls: "js-dialog-close success",
                        onclick: function(){
                        }
                    }
                ]
            });
        }
    } catch (error) {
        Metro.toast.create(error.message, null, 5000, "alert")
    } finally {
    }
}


globalThis.updateLastSentCoins = data => {
    const coins = data.coins.reverse()
    const target = $(".sent-coins-list").clear()

    for(let c of coins) {
        const {to, amount} = c.data
        target.append(
            $("<li>").html(`
                <div class="d-flex flex-align-center">
                    <div class="row-icon">
                        <span class="mif-user mif-2x fg-orange"></span>
                    </div>
                    <div class="row-icon">
                        <span class="mif-checkmark fg-green mif-2x"></span>
                    </div>
                    <div class="address-wrapper d-none-fs d-block-md">
                        <span class="address">${shorten(to, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${to}" title="Click to copy address to clipboard"></span>
                    </div>
                    <div class="amount total ml-auto text-right">${n2f(amount)}</div>
                </div>
                <div class="d-block d-none-md border-top bd-system pt-2">
                    <div class="address-wrapper text-center">
                        <span class="address">${shorten(to, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${to}" title="Click to copy address to clipboard"></span>
                    </div>
                </div>
            `)
        )
    }
}

globalThis.updateLastReceivedCoins = data => {
    const coins = data.coins.reverse()
    const target = $(".received-coins-list").clear()

    for(let c of coins) {
        const {from, amount} = c.data
        target.append(
            $("<li>").html(`
                <div class="d-flex flex-align-center">
                    <div class="row-icon">
                        <span class="mif-user mif-2x fg-orange"></span>                    
                    </div>
                    <div class="row-icon">
                        <span class="mif-checkmark fg-green mif-2x"></span>                    
                    </div>
                    <div class="address-wrapper d-none-fs d-block-md">
                        <span class="address">${shorten(from, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${from}" title="Click to copy address to clipboard"></span>
                    </div>                
                    <div class="amount total ml-auto text-right">${n2f(amount)}</div>                
                </div>
                <div class="d-block d-none-md border-top bd-system pt-2">
                    <div class="address-wrapper text-center">
                        <span class="address">${shorten(from, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${from}" title="Click to copy address to clipboard"></span>
                    </div>                
                </div>
            `)
        )
    }
}

globalThis.updateLastTransactions = data => {
    // console.log(data)
    const target = $(".sent-coins-list").clear()
    let index = 1
    for(let t of data.transactions.reverse()) {
        const [address, amount] = t.payload.arguments
        const {type, success, gas_currency_code, gas_used, gas_unit_price, timestamp, hash} = t
        target.append(
            $("<li>").html(`
                <div class="d-flex flex-align-center">
                    <div class="row-icon">
                        <span class="mif-user mif-2x fg-cyan"></span>                    
                    </div>
                    <div class="row-icon">
                        <span class="${success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red'} mif-2x"></span>                    
                    </div>
                    <div class="address-wrapper d-none-fs d-block-md">
                        <span class="address">${shorten(address, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${address}" title="Click to copy address to clipboard"></span>
<!--                        <div class="text-muted reduce-2">Hash: ${shorten(hash, 12)}</div>-->
                    </div>                
                    <div class="ml-auto">
                        <div class="d-flex flex-align-center flex-justify-center">
                            <div class="text-center" style="line-height: 1">
                                <div class="amount">${n2f(amount)}</div>                             
                                <div class="text-small text-muted">
                                    <span class="reduce-3 text-muted">${gas_currency_code}</span>
                                    <span>${gas_used}</span> 
                                    <span class="reduce-2 text-muted">x ${gas_unit_price}</span>                                
                                </div>                        
                            </div>
                            <div class="total mt-1-minus">
                                <span>${n2f(+(success ? amount : 0) + (gas_used * gas_unit_price))}</span>                            
                            </div>
                        </div>
                    </div>                
                </div>
                <div class="d-block d-none-md border-top bd-system pt-2">
                    <div class="address-wrapper text-center">
                        <span class="address">${shorten(address, 12)}</span>
                        <span class="mif-copy ml-2 mt-1 copy-data-to-clipboard c-pointer" data-value="${address}" title="Click to copy address to clipboard"></span>
                    </div>                
                </div>
            `)
        )
        index++
        if (index > 25 ) break
    }
}
