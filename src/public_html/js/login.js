;$(()=>{
    if (globalThis.walletError !== 'false') {
        Metro.toast.create(globalThis.walletError)
    }

    async function login(form){
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
                Metro.toast.create(result.error)
                button.disabled = false
                return
            }
            window.location.href = "/wallet"
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            button.disabled = false
        }
    }

    globalThis.login = login
})