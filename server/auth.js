const passport = require("passport");
const SteamStrategy = require("passport-steam");

passport.use(new SteamStrategy({
    returnURL: process.env.APP_BASE_URL + "/api/auth/steam/return",
    realm: process.env.APP_BASE_URL + "/",
    apiKey: process.env.steamApiKey,
}, function (identifier, profile, done) {
    // Стим юзер = 

    console.log('Steam user profile:', profile);
    done(null, profile); // that mean authentication was successful, and we pass the user profile to the next step
}));

// passport.serializeUser(function (#profile(это как раз таки user), done(прошло успешно)) {

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, [{ id }]);
});