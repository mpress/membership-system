"use strict";

var	express = require( 'express' ),
	app = express(),
	swig = require( 'swig'),
	nodemailer = require( 'nodemailer'),
	Members = require( '../../src/js/database' ).Members,
	config = require( '../../config/config.json'),
	auth = require( '../../src/js/authentication.js' );

app.set( 'views', __dirname + '/views' );

app.get( '/' , function( req, res ) {
	res.render( 'reset-password' );
} );

app.post( '/', function( req, res ) {
	Members.findOne( { email: req.body.email }, function( err, user ) {
		if ( user ) {
			auth.generateActivationCode( function( code ) {
				var password_reset_code = code;

				user.password_reset_code = password_reset_code;
				user.save( function( err ) {
				} );

				var message = {};

				message.text = swig.renderFile( __dirname + '/email-templates/reset.swig', {
					firstname: user.firstname,
					organisation: config.globals.organisation,
					reset_url: config.audience + '/password-reset/code/' + password_reset_code
				} );

				var transporter = nodemailer.createTransport( config.smtp.url );

				message.from = config.smtp.from;
				message.to = user.email;
				message.subject = 'Password Reset – ' + config.globals.organisation;

				transporter.sendMail( message, function( err, info ) {
				} );
			} );
		}
		req.flash( 'success', 'If there is an account associated with the email address you will receive an email shortly' );
		res.redirect( '/password-reset' );
	} );
} );

app.get( '/code', function( req, res ) {
	res.render( 'change-password' );
} );

app.get( '/code/:password_reset_code', function( req, res ) {
	res.render( 'change-password', { password_reset_code: req.params.password_reset_code } );
} );

app.post( '/change-password', function( req, res ) {
	Members.findOne( { password_reset_code: req.body.password_reset_code }, function( err, user ) {
		if ( user ) {
			if ( req.body.password !== req.body.verify ) {
				req.flash( 'danger', 'Passwords did not match' );
				res.redirect( '/password-reset/code/' + req.body.password_reset_code );
				return;
			}

			var passwordRequirements = auth.passwordRequirements( req.body.password );
			if ( passwordRequirements !== true ) {
				req.flash( 'danger', passwordRequirements );
				res.redirect( '/password-reset/code/' + req.body.password_reset_code );
				return;
			}

			auth.generatePassword( req.body.password, function( password ) {
				Members.update( { _id: user._id }, { $set: {
					password_salt: password.salt,
					password_hash: password.hash,
					password_reset_code: null
				} }, function( status ) {
					req.session.passport = { user: { _id: user._id } };
					req.flash( 'success', 'Password changed' );
					res.redirect( '/profile' );
				} );
			} );
		} else {
			req.flash( 'danger', 'Invalid password reset code' );
			res.redirect( '/login' );
		}
	} );
} );

module.exports = app;