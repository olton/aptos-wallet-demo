export const parseJson = val => {
    try {
        return JSON.parse(val)
    } catch (e) {
        return val
    }
}