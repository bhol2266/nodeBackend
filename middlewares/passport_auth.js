
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const passport = require("passport");



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/user/auth/google/callback",
            passReqToCallback: true

        },
        async function (request, accessToken, refreshToken, profile, done) {

            const data = {
                displayName: profile.displayName,
                email: profile.emails[0].value,
                profilePicUrl: profile.photos[0].value,
                accountType: "google"
            }

            return done(null, data);
        }
    )
);



passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "/user/auth/facebook/callback",
            profileFields: ['id', 'displayName', 'photos', 'email']

        },
        function (accessToken, refreshToken, profile, done) {
            const data = {
                displayName: profile.displayName,
                email: profile.emails[0].value,
                profilePicUrl: profile.photos[0].value,
                accountType: "facebook"
            }
            done(null, data);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
