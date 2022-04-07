;$(()=>{
    $("#address").attr("data-value", wallet.address).text("0x"+shorten(wallet.address, 12))
    $("#address-balance").attr("data-value", wallet.balance).text(n2f(wallet.balance))
})

globalThis.updateBalance = data => {
    $("#address-balance").attr("data-value", data.balance).text(n2f(data.balance))
}

globalThis.chargeAccount = async button => {
    const url = '/charge'
    const data = {
        address: wallet.address,
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

globalThis.updateTransactions = data => {
    // console.log(data)
    const target = $("#transactions").clear()
    let index = 1
    for(let t of data.transactions.reverse()) {
        target.append(
            $("<tr>").html(`
                <td>
                    <span class="${t.type === 'user_transaction' ? 'mif-user fg-cyan' : 'mif-cog'}"></span>
                </td>
                <td>
                    <span class="${t.success ? 'mif-checkmark fg-green' : 'mif-blocked fg-red'}"></span>
                </td>
                <td>
                    <span>${shorten(t.payload.arguments[0], 12)}</span>
                    <div class="text-muted reduce-2">Hash: ${shorten(t.hash, 12)}</div>
                </td>
                <td>
                    <span>${t.payload.arguments[1]}</span>
                </td>
                <td>
                    <div>
                        <span class="reduce-3 text-muted">${t.gas_currency_code}</span>
                        <span>${t.gas_used}</span> 
                        <span class="reduce-2 text-muted">x ${t.gas_unit_price}</span>
                    </div>
                </td>
                <td>
                    <span>${+(t.payload.arguments[1]) + (t.gas_used * t.gas_unit_price)}</span>
                </td>
                <td>
                    <span>${datetime(+t.timestamp / 1000).format(dateFormat.log)}</span>
                </td>
            `)
        )
        index++
        if (index > 25 ) break
    }
}

const sendCoins = () => {
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

globalThis.sendCoins = sendCoins

const showWalletInfo = () => {
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
                    <div class="text-small border bd-system p-2">
                        ${wallet.mnemonic}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Address:</div>
                    <div class="text-small border bd-system p-2">
                        ${wallet.address}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Public Key:</div>
                    <div class="text-small border bd-system p-2">
                        ${wallet.publicKey}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Auth Key:</div>
                    <div class="text-small border bd-system p-2">
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

globalThis.showWalletInfo = showWalletInfo
