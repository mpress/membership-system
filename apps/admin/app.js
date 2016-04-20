"use strict";

var	express = require( 'express' ),
	app = express(),
	Permissions = require( '../../src/js/database' ).Permissions,
	Members = require( '../../src/js/database' ).Members,
	auth = require( '../../src/js/authentication.js'),
	config = require( '../../config/config.json' );

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.breadcrumb.push( {
		name: "Admin",
		url: "/admin"
	} );
	res.locals.activeApp = 'admin';
	next();
} );

app.get( '/', auth.isAdmin, function( req, res ) {
	res.render( 'admin' );
} );

/*
 *	MEMBERS
 */

	var members = express();
	members.set( 'views', __dirname + '/views' );

	// Members
	//////////

	members.use( function( req, res, next ) {
		res.locals.breadcrumb.push( {
			name: "Members",
			url: "/admin/members"
		} );
		next();
	} );

	members.get( '/', auth.isAdmin, function( req, res ) {
		Members.find( function( err, members ) {
			res.render( 'members', { members: members } );
		} );
	} );

	// Member
	/////////

	members.get( '/:id', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id } ).populate( 'permissions.permission' ).exec( function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}
			res.locals.breadcrumb.push( {
				name: member.fullname
			} );
			res.render( 'member', { member: member, audience: config.audience, superadmin: ( config.superadmins.indexOf( member.email ) != -1 ? true : false ) } );
		} );
	} );

	// Update Member
	////////////////

	members.get( '/:id/update', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}
			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id
			} );
			res.locals.breadcrumb.push( {
				name: 'Update',
			} );
			res.render( 'member-update', { member: member } );
		} );
	} );

	members.post( '/:id/update', auth.isAdmin, function( req, res ) {
		var member = {
			firstname: req.body.firstname,
			lastname: req.body.lastname,
			email: req.body.email,
			address: req.body.address
		};

		Members.update( { _id: req.params.id }, member, function( status ) {
			req.flash( 'success', 'Profile updated' );
			res.redirect( '/admin/members/' + req.params.id );
		} );
	} );

	// Member Activation
	////////////////////

	members.get( '/:id/activation', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}
			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id
			} );
			res.locals.breadcrumb.push( {
				name: 'Activation',
			} );
			res.render( 'member-activation', { member: member } );
		} );
	} );

	members.post( '/:id/activation', auth.isAdmin, function( req, res ) {
		var member = {
			activated: ( req.body.activated ? true : false )
		};

		if ( req.body.activated ) {
			member.activation_code = null;
		}

		Members.update( { _id: req.params.id }, member, function( status ) {
			req.flash( 'success', 'Activation updated' );
			res.redirect( '/admin/members/' + req.params.id );
		} );
	} );

	// Member Tag
	/////////////

	members.get( '/:id/tag', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id
			} );
			res.locals.breadcrumb.push( {
				name: 'Tag'
			} );
			res.render( 'member-tag', { member: member } );
		} );
	} );

	members.post( '/:id/tag', auth.isAdmin, function( req, res ) {
		var hashed_tag = auth.hashCard( req.body.tag );
		var profile = {
			tag: req.body.tag,
			tag_hashed: hashed_tag
		};

		Members.update( { _id: req.params.id }, { $set: profile }, { runValidators: true }, function( status ) {
			if ( status != null ) {
				var keys = Object.keys( status.errors );
				for ( var k in keys ) {
					var key = keys[k];
					req.flash( 'danger', status.errors[key].message );
				}
			} else {
				req.flash( 'success', 'Tag updated' );
			}
			res.redirect( '/admin/members/' + req.params.id );
		} );
	} );

	// Member Discourse
	///////////////////

	members.get( '/:id/discourse', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id
			} );
			res.locals.breadcrumb.push( {
				name: 'Discourse'
			} );
			res.render( 'member-discourse', { member: member } );
		} );
	} );

	members.post( '/:id/discourse', auth.isAdmin, function( req, res ) {
		var member = {
			'discourse.id': req.body.id,
			'discourse.email': req.body.email,
			'discourse.activated': ( req.body.activated ? true : false )
		}

		Members.update( { _id: req.params.id }, { $set: member }, function( status ) {
			req.flash( 'success', 'Discourse updated' );
			res.redirect( '/admin/members/' + req.params.id );
		} );
	} );

	// Member GoCardless
	////////////////////

	members.get( '/:id/gocardless', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.id }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}

			res.locals.breadcrumb.push( {
				name: member.fullname,
				url: '/admin/members/' + member._id
			} );
			res.locals.breadcrumb.push( {
				name: 'GoCardless'
			} );
			res.render( 'member-gocardless', { member: member, minimum: config.gocardless.minimum } );
		} );
	} );

	members.post( '/:id/gocardless', auth.isAdmin, function( req, res ) {
		var member = {
			'gocardless.id': req.body.id,
			'gocardless.amount': req.body.amount,
			'gocardless.minimum': req.body.minimum
		}

		Members.update( { _id: req.params.id }, { $set: member }, function( status ) {
			req.flash( 'success', 'GoCardless updated' );
			res.redirect( '/admin/members/' + req.params.id );
		} );
	} );

	// Member Permissions
	/////////////////////

	members.get( '/:id/permissions', auth.isAdmin, function( req, res ) {
		Permissions.find( function( err, permissions ) {
			Members.findOne( { _id: req.params.id } ).populate( 'permissions.permission' ).exec( function( err, member ) {
				if ( member == undefined ) {
					req.flash( 'warning', 'Member not found' );
					res.redirect( '/admin/members' );
					return;
				}

				res.locals.breadcrumb.push( {
					name: member.fullname,
					url: '/admin/members/' + member._id
				} );
				res.locals.breadcrumb.push( {
					name: 'Permissions'
				} );
				res.render( 'member-permissions', { permissions: permissions, member: member, now: new Date() } );
			} );
		} );
	} );

	// Grant Member Permission
	//////////////////////////

	members.post( '/:id/permissions', auth.isAdmin, function( req, res ) {
		Permissions.findOne( { slug: req.body.permission }, function( err, permission ) {
			if ( permission != undefined ) {
				var new_permission = {
					permission: permission._id
				}

				new_permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );

				if ( req.body.expiry_date != '' && req.body.expiry_time != '' )
					new_permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

				if ( new_permission.date_added >= new_permission.date_expires ) {
					req.flash( 'warning', 'Expiry date must not be the same as or before the start date' );
					res.redirect( '/admin/members/' + req.params.id + '/permissions' );
					return;
				}

				Members.update( { _id: req.params.id }, {
					$push: {
						permissions: new_permission
					}
				}, function ( status ) {
				} );
			} else {
				req.flash( 'warning', 'Invalid permission selected' );
			}
			res.redirect( '/admin/members/' + req.params.id + '/permissions' );
		} );
	} );

	// Modify Member Permission
	///////////////////////////

	members.get( '/:mid/permissions/:pid/modify', auth.isAdmin, function( req, res ) {
		Permissions.find( function( err, permissions ) {
			Members.findOne( { _id: req.params.mid } ).populate( 'permissions.permission' ).exec( function( err, member ) {
				if ( member == undefined ) {
					req.flash( 'warning', 'Member not found' );
					res.redirect( '/admin/members' );
					return;
				}

				if ( member.permissions.id( req.params.pid ) == undefined ) {
					req.flash( 'warning', 'Permission not found' );
					res.redirect( '/admin/members' );
					return;
				}

				res.locals.breadcrumb.push( {
					name: member.fullname,
					url: '/admin/members/' + member._id
				} );
				res.locals.breadcrumb.push( {
					name: 'Permissions',
					url: '/admin/members/' + member._id + '/permissions'
				} );
				res.locals.breadcrumb.push( {
					name: member.permissions.id( req.params.pid ).permission.name
				} );
				res.render( 'member-permission', { permissions: permissions, member: member, current: member.permissions.id( req.params.pid ) } );
			} );
		} );
	} );

	members.post( '/:mid/permissions/:pid/modify', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.mid }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}

			if ( member.permissions.id( req.params.pid ) == undefined ) {
				req.flash( 'warning', 'Permission not found' );
				res.redirect( '/admin/members' );
				return;
			}

			Permissions.findOne( { slug: req.body.permission }, function( err, newPermission ) {
				if ( newPermission == undefined ) {
					req.flash( 'warning', 'New permission not found' );
					res.redirect( '/admin/members' );
					return;
				}

				var permission = member.permissions.id( req.params.pid );
				permission.permission = newPermission._id;

				if ( req.body.start_date != '' && req.body.start_time != '' ) {
					permission.date_added = new Date( req.body.start_date + 'T' + req.body.start_time );
				} else {
					permission.date_added = new Date();
				}

				if ( req.body.expiry_date != '' && req.body.expiry_time != '' ) {
					permission.date_expires = new Date( req.body.expiry_date + 'T' + req.body.expiry_time );

					if ( permission.date_added >= permission.date_expires ) {
						req.flash( 'warning', 'Expiry date must not be the same as or before the start date' );
						res.redirect( '/admin/members/' + req.params.mid + '/permissions' );
						return;
					}
				} else {
					permission.date_expires = null;
				}

				member.save( function ( err ) {
					req.flash( 'success', 'Permission updated' );
					res.redirect( '/admin/members/' + req.params.mid + '/permissions' );
				} );
			} );
		} );
	} );

	// Revoke Member Permission
	///////////////////////////

	members.get( '/:mid/permissions/:pid/revoke', auth.isAdmin, function( req, res ) {
		Members.findOne( { _id: req.params.mid }, function( err, member ) {
			if ( member == undefined ) {
				req.flash( 'warning', 'Member not found' );
				res.redirect( '/admin/members' );
				return;
			}

			if ( member.permissions.id( req.params.pid ) == undefined ) {
				req.flash( 'warning', 'Permission not found' );
				res.redirect( '/admin/members' );
				return;
			}

			member.permissions.pull( { _id: req.params.pid } );

			member.save( function ( err ) {
				req.flash( 'success', 'Permission removed' );
				res.redirect( '/admin/members/' + req.params.mid + '/permissions' );
			} );
		} );
	} );

	app.use( '/members', members );

/*
 *	PERMISSIONS
 */

	var permissions = express();
	permissions.set( 'views', __dirname + '/views' );

	permissions.use( function( req, res, next ) {
		res.locals.breadcrumb.push( {
			name: "Permissions",
			url: "/admin/permissions"
		} );
		next();
	} );

	permissions.get( '/', auth.isAdmin, function( req, res ) {
		Permissions.find( function( err, permissions ) {
			res.render( 'permissions', { permissions: permissions } );
		} );
	} );

	permissions.get( '/create', auth.isAdmin, function( req, res ) {
		res.locals.breadcrumb.push( {
			name: 'Create'
		} );
		res.render( 'create-permission' );
	} );

	permissions.post( '/create', auth.isAdmin, function( req, res ) {
		var permission = {
			name: req.body.name,
			slug: req.body.slug,
			description: req.body.description
		};

		new Permissions( permission ).save( function( err, permission ) {
			req.flash( 'success', 'Permission created' );
			res.redirect( '/admin/permissions/' + permission._id + '/edit' );
		} );
	} );

	permissions.get( '/:id/edit', auth.isAdmin, function( req, res ) {
		Permissions.findOne( { _id: req.params.id }, function( err, permission ) {
			if ( permission == undefined ) {
				req.flash( 'warning', 'Permission not found' );
				res.redirect( '/admin/permissions' );
				return;
			}

			res.locals.breadcrumb.push( {
				name: permission.name
			} );
			res.render( 'edit-permission', { permission: permission } );
		} );
	} );

	permissions.post( '/:id/edit', auth.isAdmin, function( req, res ) {
		var permission = {
			name: req.body.name,
			slug: req.body.slug,
			description: req.body.description
		};

		Permissions.update( { _id: req.params.id }, permission, function( status ) {
			req.flash( 'success', 'Permission updated' );
			res.redirect( '/admin/permissions/' + req.params.id + '/edit' );
		} );
	} );

	app.use( '/permissions', permissions );

module.exports = app;