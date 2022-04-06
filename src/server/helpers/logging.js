import {datetime} from "@olton/datetime";

export const log = (msg, marker = 'info', ...rest) => {
    const time = datetime().format("DD/MM/YYYY HH:mm:ss")
    console.log.apply(null, [`[${marker.toUpperCase()}] ${time} ${msg}`, ...rest])
}

export const info = (msg, ...rest) => log(msg, 'info', ...rest)
export const alert = (msg, ...rest) => log(msg, 'alert', ...rest)
export const debug = (msg, ...rest) => log(msg, 'debug', ...rest)