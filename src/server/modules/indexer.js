import {query} from "./postgres.js";

export const getReceivedEvents = async (address, {limit = 25, offset = 0} = {}) => {
    const sql = `
    select 
        ut.sender,
        t.hash,
        e.key,
        e.sequence_number,
        e.type,
        e.data->>'amount' as amount,
        iif(e.type = '0x1::TestCoin::ReceivedEvent', e.data->>'from', e.data->>'to') as target,
        e.inserted_at,
        t.version,
        t.gas_used,
        ut.gas_unit_price,
        t.success,
        t.vm_status,
        ut.expiration_timestamp_secs,
        ut.timestamp
    from events e
    left join transactions t on e.transaction_hash = t.hash
    left join user_transactions ut on t.hash = ut.hash
    where e.data->>'to' = $1
    order by e.inserted_at desc
    limit $2 offset $3
    `

    return (await query(sql, [address, limit, offset])).rows
}

export const getSentEvents = async (address, {limit = 25, offset = 0} = {}) => {
    const sql = `
    select 
        ut.sender,
        t.hash,
        e.key,
        e.sequence_number,
        e.type,
        e.data->>'amount' as amount,
        iif(e.type = '0x1::TestCoin::ReceivedEvent', e.data->>'from', e.data->>'to') as target,
        e.inserted_at,
        t.version,
        t.gas_used,
        ut.gas_unit_price,
        t.success,
        t.vm_status,
        ut.expiration_timestamp_secs,
        ut.timestamp
    from events e
    left join transactions t on e.transaction_hash = t.hash
    left join user_transactions ut on t.hash = ut.hash
    where ut.sender = $1 and e.type = '0x1::TestCoin::SentEvent'
    order by e.inserted_at desc
    limit $2 offset $3
    `

    return (await query(sql, [address, limit, offset])).rows
}

