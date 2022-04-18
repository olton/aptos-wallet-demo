const n2f = v => Number(v).format(0, null, " ", ".")
const shorten = (v, l = 5) => `${v.substring(0, l) + '...' + v.substring(v.length - l)}`
const parseJson = val => {
    try {
        return JSON.parse(val)
    } catch (e) {
        return val
    }
}

const copy2clipboard = (text) => {
    // navigator.clipboard.writeText(text)
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
}

$("body").on("click", " .copy-data-to-clipboard", function() {
    copy2clipboard($(this).attr("data-value"));
    Metro.toast.create("Data copied to clipboard!", null, 5000, "success")
})