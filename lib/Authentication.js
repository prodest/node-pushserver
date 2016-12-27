
const config = require( './Config' );
const auth = require( 'basic-auth' )
const jwt = require( 'jwt-simple' );

function sendInvalidToken( res ) {
    res.status( 498 ).send( 'Invalid Token' );
}

const validateSecret = function ( req, res, next ) {
    var clientSecret = req.body.secret;
    var secret = config.get( 'secret' ) || '';

    if ( clientSecret === secret ) {
        next();
    } else {
        res.status( 401 ).send( 'Invalid Secret' );
    }
}

const validateToken = function ( req, res, next ) {
    try {
        var authorization = req.get( 'Authorization' );
        var token = authorization.slice( 7 );
        var decodedToken = jwt.decode( token, config.get( 'publicKey' ) );

        if ( !!decodedToken.error ) {
            sendInvalidToken( res );
        } else {
            req.decodedToken = decodedToken;
            next();
        }
    } catch ( err ) {
        sendInvalidToken( res );
    }
};

const decodeToken = function ( req, res, next ) {
    try {
        var authorization = req.get( 'Authorization' );

        if ( authorization && authorization.length > 7 ) {
            var token = authorization.slice( 7 );
            var decodedToken = jwt.decode( token, config.get( 'publicKey' ) );

            if ( !decodedToken.error ) {
                req.decodedToken = decodedToken;
            }
        }
    } catch ( error ) {
        console.error( error );
    } finally {
        next();
    }
};



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
const ensureAuthenticated = function ( req, res, next ) {
    let credentials = auth( req );

    if ( !credentials || config.get( 'username' ) !== credentials.name || config.get( 'password' ) !== credentials.pass ) {
        res.statusCode = 401
        res.setHeader( 'WWW-Authenticate', 'Basic realm="example"' )
        res.end( 'Access denied' )
    } else {
        return next();
    }
};

module.exports = {
    ensureAuthenticated: ensureAuthenticated,
    validateToken: validateToken,
    validateSecret: validateSecret,
    decodeToken: decodeToken
}
