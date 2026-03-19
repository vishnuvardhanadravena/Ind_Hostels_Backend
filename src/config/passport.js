
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const users = require("../models/userschema.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL: process.env.CALLBACK_URL,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await users.findOne({
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value },
          ],
        });

        if (!user) {
          const nameParts = profile.displayName?.trim()?.split(" ") || [];
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ")|| "";

          user = await users.create({
            googleId: profile.id,
            email: profile.emails[0]?.value || "",
            firstname: firstName,
            lastname: lastName,
            status: "active",
            isTermsAndConditions: true,
          });
        }

        // You can save the token in the session, or send it manually in a custom callback
        const token = jwt.sign(
          { id: user._id, email: user.email, status: user.status },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, {user, token}); //pass token with the user 
      } catch (error) {
        console.log("OAuth Error", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((obj, done) => {
  // store both user._id and token
  if (!obj || !obj.user || !obj.user._id || !obj.token) {
    return done(new Error("User or token missing"));
  }

  // You could store just the user._id if using DB, but to keep token, we include both
  done(null, { id: obj.user._id, token: obj.token });
});

passport.deserializeUser(async (obj, done) => {
  try {
    const user = await users.findById(obj.id);
    if (!user) return done(new Error("User not found"));

    // Attach token back to the user object if needed
    const token = obj.token;
    done(null, {user, token});
  } catch (err) {
    done(err);
  }
});


module.exports = passport;
