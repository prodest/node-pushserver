var config = require( './Config' );
var express = require( 'express' );
var _ = require( 'lodash' );
var pushAssociations = require( './PushAssociations' );
var push = require( './PushController' );
var authentication = require( './Authentication' );
var cors = require( 'cors' );

var app = express();

app.use( cors() );

// Middleware
app.use( express.compress() );
app.use( express.bodyParser() );
app.use( express.static( __dirname + '/../public' ) );

app.set( 'view engine', 'ejs' );

app.use( function( err, req, res, next ) {
    res.status( 500 );
    console.error( err );
    res.json( err );
} );

app.get( '/', authentication.ensureAuthenticated, function( req, res ) {
    res.render( '../views/index' );
} );

app.post( '/*', function( req, res, next ) {
    if ( req.is( 'application/json' ) ) {
        next();
    } else {
        res.status( 406 ).send();
    }
} );

// Main API
app.post( '/subscribe', authentication.validateSecret, authentication.decodeToken, function( req, res ) {
    var deviceInfo = req.body;

    if ( req.decodedToken ) {
        deviceInfo.sub = req.decodedToken.sub;
    }

    push.subscribe( deviceInfo );

    res.send();
} );

app.post( '/unsubscribe', authentication.validateSecret, authentication.decodeToken, function( req, res ) {
    var data = req.body;

    if ( data.user ) {
        push.unsubscribeUser( data.user );

        if ( req.decodedToken ) {
            push.unsubscribeUser( `${data.user}-${req.decodedToken.sub}` );
        }
    } else if ( data.token ) {
        push.unsubscribeDevice( data.token );
    } else {
        return res.status( 503 ).send();
    }

    res.send();
} );

app.post( '/send', authentication.ensureAuthenticated, function( req, res ) {
    try {
        let notifs = [ req.body ];

        let notificationsValid = sendNotifications( notifs );

        res.status( notificationsValid ? 200 : 400 ).send();
    } catch ( error ) {
        res.status( 400 ).send( error.message );
    }
} );

app.post( '/send-android-ios', authentication.ensureAuthenticated, function( req, res ) {
    const pushData = [ createPushObject( req.body.users, req.body.title, req.body.message, req.body.state, req.body.stateParams, req.body.icon ) ];

    var notificationsValid = sendNotifications( pushData );

    res.status( notificationsValid ? 200 : 400 ).send();
} );

app.post( '/sendBatch', authentication.ensureAuthenticated, function( req, res ) {
    var notifs = req.body.notifications;

    var notificationsValid = sendNotifications( notifs );

    res.status( notificationsValid ? 200 : 400 ).send();
} );

// Utils API
app.get( '/users/:sub/associations', authentication.ensureAuthenticated, function( req, res ) {
    pushAssociations.getForSub( req.params.sub, function( err, items ) {
        if ( !err ) {
            res.send( { 'associations': items } );
        } else {
            res.status( 503 ).send();
        }
    } );
} );

app.get( '/users', authentication.ensureAuthenticated, function( req, res ) {
    pushAssociations.getAll( function( err, pushAss ) {
        if ( !err ) {
            let users = _( pushAss ).map( 'sub' ).unique().value();
            res.send( {
                'users': users
            } );
        } else {
            res.status( 503 ).send();
        }
    } );
} );

app.delete( '/users/:user', authentication.ensureAuthenticated, function( req, res ) {
    push.unsubscribeUser( req.params.user );
    res.send( 'ok' );
} );


// Helpers
function sendNotifications( notifs ) {
    var areNotificationsValid = _( notifs ).map( validateNotification ).min().value();

    if ( !areNotificationsValid ) {
        throw 'Payload inválido';
    }

    notifs.forEach( function( notif ) {
        let users = notif.users;
        let sendToAll = notif.sendToAll;
        let androidPayload = notif.android;
        let iosPayload = notif.ios;
        let target;

        if ( !users && !sendToAll ) {
            throw 'Nenhum usuário de destino';
        }

        if ( androidPayload && iosPayload ) {
            target = 'all';
        } else if ( iosPayload ) {
            target = 'ios';
        } else if ( androidPayload ) {
            target = 'android';
        }

        let fetchUsers = users ? pushAssociations.getForSubs : pushAssociations.getAll;
        let callback = ( err, userPushAssociations ) => {
            if ( err ) {
                throw err;
            }

            if ( target !== 'all' ) {
                // TODO: do it in mongo instead of here ...
                userPushAssociations = _.where( userPushAssociations, { 'type': target } );
            }

            push.send( userPushAssociations, androidPayload, iosPayload );
        };
        let args = users ? [ users, callback ] : [ callback ];

        // TODO: optim. -> mutualise user fetching ?
        fetchUsers.apply( null, args );
    } );

    return true;
}

function validateNotification( notif ) {
    var valid = true;

    valid = valid && ( !!notif.ios || !!notif.android );
    // TODO: validate content

    return valid;
}

function createPushObject( users, title, message, state, stateParams, icon ) {
    if ( !icon ) {
        icon = 'notification';
    }

    return {
        users: users,
        android: {
            collapseKey: 'optional',
            data: {
                icon: icon,
                message: message,
                appData: {
                    state: state,
                    params: stateParams
                }
            }
        },
        ios: {
            notification: {
                badge: 0,
                title: title,
                body: message,
                sound: 'default',
                icon: icon
            },
            data: {
                appData: {
                    state: state,
                    params: stateParams
                }
            },
            priority: 'high'
        }
    };
}

let pathApp = express();
let path = config.get( 'path' ) || '';
let port = config.get( 'webPort' ) || 4242;
pathApp.use( path, app );

exports.start = function() {
    pathApp.listen( port );
    console.log( 'Listening on port ' + port + '...' );
};
