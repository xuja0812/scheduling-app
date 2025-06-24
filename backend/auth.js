const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const { pool } = require('./db');

const ADMIN_EMAILS = ['jasminexu0812@gmail.com'];

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

const CallBackURL = process.env.GOOGLE_CALLBACK_URL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CallBackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'student';

      console.log('Using database URL:', process.env.DATABASE_URL);

      try {
        const userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        if (userResult.rows.length > 0) {
          return done(null, userResult.rows[0]);
        }

        const insertResult = await pool.query(
          'INSERT INTO users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [googleId, email, name, role]
        );

        return done(null, insertResult.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
