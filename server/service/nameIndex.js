const redisClient = require('../redis.js');
const { resolveServerNames} = require("./serverNames.js");

const REBUILD_INTERVAL_MS = 60 * 1000;
const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 10;

let index = [];

async function rebuildNameIndex() {
    const byBmId = new Map();

    for await ( const keys of redisClient.scanIterator({ MATCH: 'server:*:players', COUNT: 500})) {
        if (keys.length === 0) continue;
        const values = await redisClient.mGet(keys);

        keys.forEach((key, i) => {
            if (!values[i]) return;
            const serverId = key.split(':')[1];
            for ( const p of JSON.parse(values[i])) {
                byBmId.set(p.bmId, { bmId: p.bmId, name: p.name, nameLower: p.name.toLowerCase(), serverId});
            }
        });
    }
    index = [...byBmId.values()];
}

async function searchByName(query) {
    const q = query.trim().toLowerCase();
    if(q.length < MIN_QUERY_LENGTH) return [];
    
    const matches = [];
    for (const p of index) {
        const pos = p.nameLower.indexOf(q);
        if (pos === -1) continue;
        const rank = p.nameLower === q ? 0 : pos === 0 ? 1 : 2;
        matches.push( { ...p, rank});
    }
    matches.sort((a, b) => a.rank - b.rank || a.name.length - b.name.length);
    const top = matches.slice(0, MAX_RESULTS);
    if (top.length === 0) return [];

    const freshServerIds = await redisClient.mGet(top.map((p) => `player:${p.bmId}:server`));

    const serverIds = top.map((p, i) => freshServerIds[i] || p.serverId);
    const serverNames = await resolveServerNames(serverIds);

    return top.map((p, i) => ({
        bmId: p.bmId,
        name: p.name,
        serverId: serverIds[i],
        serverName: serverNames[serverIds[i]] ?? null,
        isOnline: Boolean(freshServerIds[i]),
    }))
}

function startNameIndex() {
    const run = () => 
        rebuildNameIndex().catch((err) => 
             console.error('❌ [NameIndex] Не удалось пересобрать индекс:', err.message)
        );
    run();
    setInterval(run, REBUILD_INTERVAL_MS);
}

module.exports = { startNameIndex, searchByName, MIN_QUERY_LENGTH };