const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('./db');
require('dotenv').config();

const ADMIN_EMAILS = ['jasminexu0812@gmail.com'];

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  const googleId = profile.id;
  const email = profile.emails[0].value;
  const name = profile.displayName;
  const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'student';

  db.get('SELECT * FROM users WHERE google_id = ?', [googleId], (err, user) => {
    if (err) return done(err);
    if (user) return done(null, user);

    db.run(
      'INSERT INTO users (google_id, email, name, role) VALUES (?, ?, ?, ?)',
      [googleId, email, name, role],
      function (err) {
        if (err) return done(err);
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
          done(err, newUser);
        });
      }
    );
  });
}));

module.exports = passport;
