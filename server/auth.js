const passport = require("passport");
const pool = require('./db.js');
const SteamStrategy = require("passport-steam");


passport.use(new SteamStrategy({
    returnURL: process.env.APP_BASE_URL + "/api/auth/steam/return",
    realm: process.env.APP_BASE_URL + "/",
    apiKey: process.env.steamApiKey,
}, async function (identifier, profile, done) {
    try {
    // Стим юзер = 
    let dbUser;
    const result = await pool.query('SELECT * FROM "User" WHERE "steamId" = $1', [profile.id])
    if(result.rows.length == 0){
        const insertResult = await pool.query('INSERT INTO "User" ("personaname", "avatarLink", "steamId") VALUES ($1, $2, $3) RETURNING *', [profile.displayName, profile.photos[2].value, profile.id]);
        dbUser = insertResult.rows[0];
    }
    if(result.rows.length){
        const updateResult = await pool.query('UPDATE "User" SET personaname=$1, "avatarLink"=$2 WHERE "steamId"=$3 RETURNING *', [profile.displayName, profile.photos[2].value, profile.id])
        dbUser = updateResult.rows[0];
    }

    console.log('Steam user profile:', profile);
    done(null, dbUser); // that mean authentication was successful, and we pass the user profile to the next step
    } catch (err) {
    console.error('❌ Ошибка в Steam verify-callback:', err.message);
    done(err);
}
}));

// passport.serializeUser(function (#profile(это как раз таки user), done(прошло успешно)) {

passport.serializeUser(function (user, done) {
    done(null, user.userId);
});

passport.deserializeUser(async function(id, done) {
    try { 
        const result = await pool.query('SELECT * FROM "User" WHERE "userId" = $1', [id])
        done(null, result.rows[0] || false); 
    } catch (err) {
        done(err);
    }
    
});