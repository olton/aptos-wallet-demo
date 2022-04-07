const login = async (form) => {
    const url = '/auth'
    const data = {
        mnemonic: form.elements.mnemonic.value
    }
    const button = $(form).find("button")
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
            const _message = "Invalid mnemonic or Account not found in blockchain!"
            throw new Error(_message)
        }
        window.location.href = "/wallet"
    } catch (e) {
        Metro.toast.create(e.message, null, 5000, "alert")
    } finally {
        button.disabled = false
    }
}

globalThis.login = login

const createWallet = async (button) => {
    const url = '/create'
    const data = {
        timestamp: datetime().time()
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
            const _message = "Invalid mnemonic or Account not found in blockchain!"
            throw new Error(_message)
        }

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
            <div>Store your new address info and next time use Mnemonic to login.</div>
            <ul class="unstyled-list w-100">
                <li>
                    <div class="text-bold">Mnemonic:</div>
                    <div class="text-small border bd-system p-2">
                        ${result.mnemonic}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Address:</div>
                    <div class="text-small border bd-system p-2">
                        ${result.address}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Public Key:</div>
                    <div class="text-small border bd-system p-2">
                        ${result.publicKey}        
                    </div>
                </li>
                <li class="mt-1">
                    <div class="text-bold">Auth Key:</div>
                    <div class="text-small border bd-system p-2">
                        ${result.authKey}        
                    </div>
                </li>
            </ul>
        `

        Metro.dialog.create({
            title: dialogTitle,
            content: dialogContent,
            actions: [
                {
                    caption: "Accept",
                    cls: "js-dialog-close success",
                    onclick: function(){
                        fetch('/init', {
                            method: 'POST',
                            body: JSON.stringify({
                                address: result.address
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                    }
                },
                {
                    caption: "Cancel",
                    cls: "js-dialog-close",
                    onclick: function(){
                    }
                }
            ]
        });

    } catch (e) {
        Metro.toast.create(e.message, null, 5000, "alert")
    } finally {
        button.disabled = false
    }
}

globalThis.createWallet = createWallet

;$(()=>{
    if (parseJson(globalThis.walletError)) {
        Metro.toast.create(globalThis.walletError, null, 5000, "alert")
    }
})