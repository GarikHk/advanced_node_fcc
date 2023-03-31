'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
//const res = require('express/lib/response');
const bcrypt = require('bcrypt');
const app = express();

app.set('view engine', 'pug');
app.set('views', './views/pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

myDB(async client => {
  const myDataBase = await client.db('MyDataBase').collection('users');
  console.log('Connected to the database');
  const users = await myDataBase.find().toArray();
  console.log(users);

  //Routes
  //Default Route
  app.route('/').get((req, res) => {
    console.log('Get request for index.pug')
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
    });
  });

  //Login Route
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    console.log('Post request for login')
    res.redirect('/profile');
  });

  //Profile Route
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    console.log('Get request for profile.pug')
    res.render('profile', {
      username: req.user.username,
    });
  });

  //Logout Route
  app.route('/logout').get((req, res, next) => {
    req.logout((err) => {
      if (err) return next(err)
    });
    res.redirect('/');
    console.log('User logges out!')
  });
  
  //Register Route
  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hash,
          },
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          );
          console.log("User created!");
        }
      });
    },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/profile');
      }
    );

  //Not Found
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    console.log("User Not Found!")
  });

  //Create a strategy and serialize 
  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`);
        console.log(user)
        if (err) return done(err);
        if (!user) {
          console.log('User not found')
          return done(null, false)
        };
        const isValid = bcrypt.compareSync(password, user.password)
        if (!isValid) return done(null, false);
        console.log('User is logged in!')
        return done(null, user);
      });
    })
  );

  passport.serializeUser((user, done) => {
    console.log('User serialized');
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log('User deserialized');
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

}).catch(e => {
  console.log('Uable to connect to the database');
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e,
      message: 'Unable to connect to database',
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
