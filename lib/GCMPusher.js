/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 13/06/13
 * Time: 16:42
 * To change this template use File | Settings | File Templates.
 */

var config = require( './Config' );
var _ = require( 'lodash' );
var gcm = require( 'node-gcm' );
var pushAssociations = require( './PushAssociations' );


var push = function( tokens, message ) {
    while ( tokens.length > 0 ) {
        let currentTokens = tokens.splice( 0, 1000 );

        gcmSender().send( message, currentTokens, 4, function( err, res ) {
            if ( err ) {
                console.log( err );
            }

            if ( res ) {
                let mappedResults = _.map( _.zip( currentTokens, res.results ), function( arr ) {
                    return _.merge( { token: arr[ 0 ] }, arr[ 1 ] );
                } );

                handleResults( mappedResults );
            }
        } );
    }
};

let handleResults = function( results ) {
    let idsToUpdate = [];
    let idsToDelete = [];

    results.forEach( function( result ) {
        if ( result.registration_id ) {
            idsToUpdate.push( { from: result.token, to: result.registration_id } );

        } else if ( result.error === 'InvalidRegistration' || result.error === 'NotRegistered' ) {
            idsToDelete.push( result.token );
        }
    } );

    if ( idsToUpdate.length > 0 ) {
        pushAssociations.updateTokens( idsToUpdate );
    }
    if ( idsToDelete.length > 0 ) {
        pushAssociations.removeDevices( idsToDelete );
    }
};

var buildPayload = ( options ) => {
    return new gcm.Message( options );
};

var gcmSender = _.once( () => {
    return new gcm.Sender( config.get( 'gcm' ).apiKey );
} );

module.exports = {
    push: push,
    buildPayload: buildPayload
};
