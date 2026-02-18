import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import Customer from '../models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const handleOAuthLogin = async (provider, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
            return done(new Error(`No email found from ${provider} provider`), null);
        }

        // Check if user exists
        let user = await Customer.findOne({ email: email.toLowerCase() });

        if (user) {
            // User exists
            if (user.oauthProvider && user.oauthProvider !== provider) {
                // User registered with a different provider
                return done(
                    new Error(`This email is already registered with ${user.oauthProvider}. Please login with that provider.`),
                    null
                );
            }

            // If user exists but no oauthProvider (manual signup), or same provider, we login/link
            if (!user.oauthProvider) {
                user.oauthProvider = provider;
                user.oauthId = profile.id;
                // Verify email if it's coming from a trusted provider
                user.emailVerified = true;
                await user.save();
            }

            return done(null, user);
        }

        // New User
        if (!process.env.DEFAULT_USER_ROLE) {
            // Fallback or ensure default is set in model
        }

        const newUser = new Customer({
            name: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
            email: email,
            oauthProvider: provider,
            oauthId: profile.id,
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
            emailVerified: true,
            role: 'user', // Default role
        });

        await newUser.save();
        return done(null, newUser);

    } catch (err) {
        return done(err, null);
    }
};

// Serialize/Deserialize (Required for session, though we might use stateless)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Customer.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
// clientID: process.env.GOOGLE_CLIENT_ID
// clientSecret: process.env.GOOGLE_CLIENT_SECRET
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/api/auth/google/callback",
            },
            (accessToken, refreshToken, profile, done) => handleOAuthLogin('google', profile, done)
        )
    );
}

// Microsoft Strategy
// clientID: process.env.MICROSOFT_CLIENT_ID
// clientSecret: process.env.MICROSOFT_CLIENT_SECRET
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(
        new MicrosoftStrategy(
            {
                clientID: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                callbackURL: "/api/auth/microsoft/callback",
                scope: ['user.read'],
            },
            (accessToken, refreshToken, profile, done) => handleOAuthLogin('microsoft', profile, done)
        )
    );
}

// Facebook Strategy
// clientID: process.env.FACEBOOK_APP_ID
// clientSecret: process.env.FACEBOOK_APP_SECRET
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: "/api/auth/facebook/callback",
                profileFields: ['id', 'emails', 'name', 'photos'],
            },
            (accessToken, refreshToken, profile, done) => handleOAuthLogin('facebook', profile, done)
        )
    );
}

// LinkedIn Strategy
// clientID: process.env.LINKEDIN_KEY
// clientSecret: process.env.LINKEDIN_SECRET
if (process.env.LINKEDIN_KEY && process.env.LINKEDIN_SECRET) {
    passport.use(
        new LinkedInStrategy(
            {
                clientID: process.env.LINKEDIN_KEY,
                clientSecret: process.env.LINKEDIN_SECRET,
                callbackURL: "/api/auth/linkedin/callback",
                scope: ['r_emailaddress', 'r_liteprofile'],
            },
            (accessToken, refreshToken, profile, done) => handleOAuthLogin('linkedin', profile, done)
        )
    );
}

export default passport;
