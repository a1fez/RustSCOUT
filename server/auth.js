const SteamStrategy = require("passport-steam");

new SteamStrategy({
    returnURL: process.env.APP_BASE_URL + "/api/auth/steam/return",
    realm: process.env.APP_BASE_URL + "/",
    apiKey: process.env.steamApiKey,
})