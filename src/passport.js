import passport from "passport";
import { usersManager } from "./dao/managers/MongoDb/usersManager.js";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GithubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { hashData, compareData } from "./utils.js";
import config from "./config.js";

passport.use(
"signup",
new LocalStrategy(
    {
    usernameField: "email",
    passReqToCallback: true,
    },
    async (req, email, password, done) => {
    try {
        const userDB = await usersManager.findByEmail(email);
        if (userDB) {
        return done(null, false);
        }
        const hashedPassword = await hashData(password);
        const createdUser = await usersManager.createOne({
        ...req.body,
        password: hashedPassword,
        });
        return done(null, createdUser);
    } catch (error) {
        return done(error);
    }
    }
)
);

passport.use(
"login",
new LocalStrategy(
{
    usernameField: "email",
},
async (email, password, done) => {
    try {
    const userDB = await usersManager.findByEmail(email);
    if (!userDB) {
        return done(null, false);
    }
    const isValid = await compareData(password, userDB.password);
    if (!isValid) {
        return done(null, false);
    }
    done(null, userDB);
    } catch (error) {
    done(error);
    }
}
)
);

passport.use(
    new GithubStrategy(
    {
        clientID: config.github_client_id,
        clientSecret: config.github_client_secret,
        callbackURL: config.github_callback_url,
        scope: ['user:email', 'read:user'],
    },
    async function (accessToken, refreshToken, profile, done) {
        console.log("profile", profile);
        try {
        const userDB = await usersManager.findByEmail(profile.email);
        if (userDB) {
            if (userDB.from_github) {
            return done(null, userDB);
            } else {
                return done(null, false);
            }
        }
        const newUser = {
            first_name: profile.user,
            last_name: "github user",
            email: profile.email,
            password: "1234",
            from_github: true,
        };
        const createdUser = await usersManager.createOne(newUser);
        return done(null, createdUser);
        } catch (error) {
        return done(error);
        }
    }
    )
    );

passport.use(
"google",
new GoogleStrategy(
{
clientID: config.google_client_id,
clientSecret: config.google_client_secret,
callbackURL: config.google_callback_url,
},
async (accessToken, refreshToken, profile, done) => {
console.log("profile", profile._json);
try {
    const user = await usersManager.findByEmail(profile._json.email);
    if (user) {
    if (user.fromGoogle) {
        return done(null, user);
    } else {
        return done(null, false);
    }
    }
    const createdCart = await cartsManager.createOne({ products: [] });
    const infoUser = {
    first_name: profile._json.given_name,
    last_name: profile._json.family_name,
    email: profile._json.email,
    password: " ",
    cart: createdCart._id,
    fromGoogle: true,
    };
    const createdUser = await usersManager.createOne(infoUser);
    done(null, createdUser);
} catch (error) {
    done(error);
}
done(null, false);
}
)
);

passport.serializeUser(function (user, done) {
console.log("test");
done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
try {
const user = await usersManager.getById(id);
done(null, user);
} catch (error) {
done(error);
}
});