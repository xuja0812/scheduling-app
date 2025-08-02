const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const { pool } = require("./db");
const jwt = require("jsonwebtoken");

const ADMIN_EMAILS = ["jasminexu0812@gmail.com"];

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "student";

      try {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE google_id = $1",
          [googleId]
        );
        
        let user;
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        } else {
          const insertResult = await pool.query(
            "INSERT INTO users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [googleId, email, name, role]
          );
          user = insertResult.rows[0];
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }, 
          process.env.JWT_SECRET,
          { expiresIn: '24h'}
        );

        return done(null, { user, token });
      } catch (err) {
        console.error('OAuth callback error:', err);
        return done(err);
      }
    }
  )
);

module.exports = passport;