var config = require('./Config');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var session = require('express-session');
var request = require('request-promise');
var jwt = require('jwt-simple');

var path = config.get('path');

var validateToken = function (req, res, next) {
    var token = req.get('Authorization').slice(7);
    
    var decodedToken = jwt.decode(token, config.get('publicKey'));
    if (!!decodedToken.error) {
        res.status(498).send('Invalid Token');
    } else {
        next();
    }
};

var initialize = function (app) {

    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.  However, since this example does not
    //   have a database of user records, the complete GitHub profile is serialized
    //   and deserialized.
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    //TODO: passing here without need for publics
    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });


    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(new GitHubStrategy({
        clientID: config.get('github').clientID,
        clientSecret: config.get('github').clientSecret,
        callbackURL: config.get('github').callbackURL
    },
        function (accessToken, refreshToken, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                var allowedTeams = config.get('github').allowedTeams;
                var options = {
                    method: 'GET',
                    uri: 'https://api.github.com/user/teams',
                    headers: {
                        'User-Agent': 'prodest-push-server',
                        'Authorization': 'token ' + accessToken
                    },
                    json: true
                };

                request(options)
                    .then(function (res) {
                        //Search for user teams in allowed teams list
                        var firstAllowedTeam = res.find(function (team) {
                            return allowedTeams.find(function (id) {
                                return id == team.id;
                            });
                        });

                        return firstAllowedTeam;
                    })
                    .then(function (team) {
                        if (team) {
                            return done(null, profile);
                        }
                        else {
                            return done('User is not a member of the allowed teams.');
                        }
                    });
            });
        }
    ));

    app.use(session({ secret: 'prodest-push-server-secret', resave: false, saveUninitialized: false }));
    // Initialize Passport!  
    app.use(passport.initialize());
    // Use passport.session() middleware, to support persistent login sessions.
    app.use(passport.session());

    // GET /auth/github
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in GitHub authentication will involve redirecting
    //   the user to github.com.  After authorization, GitHub will redirect the user
    //   back to this application at /auth/github/callback
    app.get('/auth/github',
        passport.authenticate('github', { scope: ['user:email', 'read:org'] }),
        function (req, res) {
            // TODO: REMOVE?!?!
            // The request will be redirected to GitHub for authentication, so this
            // function will not be called.
        });

    // GET /auth/github/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/github/callback',
        passport.authenticate('github', { failureRedirect: path + '/auth/github' }),
        function (req, res) {
            res.redirect(path + '/');
        });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect(path + '/');
    });

    return app;
};

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect(path + '/auth/github')
};


module.exports = {
    initialize: initialize,
    ensureAuthenticated: ensureAuthenticated,
    validateToken: validateToken
}
