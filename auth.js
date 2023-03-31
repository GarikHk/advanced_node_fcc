const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');

module.exports = function (app, myDataBase) {
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
				if (!isValid) {
					console.log('Invalid password!')
					return done(null, false)
				};
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

}