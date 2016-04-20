"use strict";

var	express = require( 'express' ),
	app = express(),
	Members = require( '../../src/js/database' ).Members,
	config = require( '../../config/config.json'),
	auth = require( '../../src/js/authentication.js' );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Profile",
		url: "/profile"
	} );
	res.locals.activeApp = 'profile';
	next();
} );

app.get( '/', auth.isLoggedIn, function( req, res ) {
	Members.findById( req.user._id ).populate( 'permissions.permission' ).exec( function( err, user ) {
		res.render( 'profile', { user: user } );
	} );
} );

app.get( '/update', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Update"
	} );
	res.render( 'update', { user: req.user } );
} );

app.post( '/update', auth.isLoggedIn, function( req, res ) {
	var profile = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		address: req.body.address
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status !== null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[ k ];
				req.flash( 'danger', status.errors[ key ].message );
			}
		} else {
			req.flash( 'success', 'Your profile has been updated' );
		}
		res.redirect( '/profile' );
	} );
} );

app.get( '/tag', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Tag"
	} );
	res.render( 'tag', { user: req.user } );
} );

app.post( '/tag', auth.isLoggedIn, function( req, res ) {
	var hashed_tag = auth.hashCard( req.body.tag );
	var profile = {
		tag: req.body.tag,
		tag_hashed: hashed_tag
	};

	Members.update( { _id: req.user._id }, { $set: profile }, { runValidators: true }, function( status ) {
		if ( status !== null ) {
			var keys = Object.keys( status.errors );
			for ( var k in keys ) {
				var key = keys[ k ];
				req.flash( 'danger', status.errors[ key ].message );
			}
		} else {
			req.flash( 'success', 'Your profile has been updated' );
		}
		res.redirect( '/profile/tag' );
	} );
} );

app.get( '/change-password', auth.isLoggedIn, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: "Change Password"
	} );
	res.render( 'change-password' );
} );

app.post( '/change-password', auth.isLoggedIn, function( req, res ) {
	Members.findOne( { _id: req.user._id }, function( err, user ) {
		auth.hashPassword( req.body.current, user.password_salt, function( hash ) {
			if ( hash != user.password_hash ) {
				req.flash( 'danger', 'Current password is wrong' );
				res.redirect( '/profile/change-password' );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.new );
			if ( passwordRequirements != true ) {
				req.flash( 'danger', passwordRequirements );
				res.redirect( '/profile/change-password' );
				return;
			}

			if ( req.body.new != req.body.verify ) {
				req.flash( 'danger', 'Passwords did not match' );
				res.redirect( '/profile/change-password' );
				return;
			}

			auth.generatePassword( req.body.new, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					password_salt: password.salt,
					password_hash: password.hash,
					password_reset_code: null,
				} }, function( status ) {
					req.flash( 'success', 'Password changed' );
					res.redirect( '/profile' );
				} );
			} );
		} );
	} );
} );

module.exports = app;