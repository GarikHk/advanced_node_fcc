'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
//const { ObjectID } = require('mongodb');
//const LocalStrategy = require('passport-local');
//const res = require('express/lib/response');
//const bcrypt = require('bcrypt');
const routes = require('./routes.js');
const auth = require('./auth.js');
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

  //Routes
  routes(app, myDataBase);

  //Authentication
  auth(app, myDataBase);

  //Not Found
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    console.log("User Not Found!")
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
