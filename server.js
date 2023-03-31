'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const { ObjectID } = require('mongodb');
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

//Connect to the database and serialize/deserialize the user
myDB( async client => {
  const myDataBase = await client.db('database').collection('users');
  
  console.log('Connected to the database');
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
    });
  });

  passport.serializeUser((user, done) => {
    console.log('User serialized');
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log('User deserialized');
    myDataBase.findById(id, (err, doc) => {
      done(null, doc);
    });
  });
}).catch( e => {
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
