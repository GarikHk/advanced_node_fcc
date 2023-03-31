const passport = require('passport')
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
	const ensureAuthenticated = (req, res, next) => {
		if (req.isAuthenticated()) {
			return next();
		}
		res.redirect('/');
	};
  
	//Index Route
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
		console.log('User logged out!')
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
}