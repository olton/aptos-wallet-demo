;$(()=>{
    $("#address").attr("data-value", wallet.address).text("0x"+wallet.short)
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
            Metro.toast.create(result.error)
        } else {
            refreshBalance()
        }
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        button.disabled = false
    }

}
