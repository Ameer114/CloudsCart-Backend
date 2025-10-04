import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import passport from 'passport';

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SEC_KEY,
    callbackURL: "https://cloudscart-backend.onrender.com/api/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
 }
));
