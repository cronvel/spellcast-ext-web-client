/*
	Spellcast's Web Client Extension

	Copyright (c) 2014 - 2021 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const Camera = require( './Camera.js' ) ;

const Ngev = require( 'nextgen-events/lib/browser.js' ) ;
const Promise = require( 'seventh' ) ;



// !THIS SHOULD TRACK SERVER-SIDE GScene! spellcast/lib/gfx/GScene.js
function GScene( dom , data ) {
	this.dom = dom ;    // Dom instance, immutable
	//this.id = data.id ;		// immutable
	this.engineId = data.engineId ;	// immutable
	this.rightHanded = data.rightHanded !== undefined ? !! data.rightHanded : true ;    // immutable, unused in base Web engine

	this.active = false ;
	this.paused = false ;
	this.persistent = false ;
	this.theme = 'default' ;
	this.special = {} ;
	this.engine = {} ;
	this.texturePacks = {} ;
	this.gEntities = {} ;
	this.gEntityLocations = {} ;

	this.globalCamera = new Camera( this ) ;
	this.roleCamera = null ;	// For multiplayer, not implemented yet

	this.$gscene = document.createElement( 'gscene' ) ;
	this.$gscene.classList.add( 'gscene' ) ;
	// At creation, the visibility is turned off, the initial update will turn it on again
	this.$gscene.style.visibility = 'hidden' ;
	this.dom.$gfx.append( this.$gscene ) ;
}

GScene.prototype = Object.create( Ngev.prototype ) ;
GScene.prototype.constructor = GScene ;

module.exports = GScene ;



// !THIS SHOULD TRACK SERVER-SIDE GScene! spellcast/lib/gfx/GScene.js
GScene.prototype.update = function( data , awaiting = false , initial = false ) {
	var transitionPromise = Promise.resolved ;

	if ( data.active !== undefined ) {
		this.active = !! data.active ;
		this.$gscene.style.visibility = this.active ? 'visible' : 'hidden' ;
	}

	if ( data.paused !== undefined ) { this.paused = !! data.paused ; }
	if ( data.persistent !== undefined ) { this.persistent = !! data.persistent ; }
	//if ( data.roles !== undefined ) { this.roles = data.roles ; }
	if ( data.theme !== undefined ) { this.theme = data.theme || 'default' ; }

	if ( data.special && typeof data.special === 'object' ) {
		for ( let key in data.special ) {
			if ( this.special[ key ] && typeof this.special[ key ] === 'object' ) {
				Object.assign( this.special[ key ] , data.special[ key ] ) ;
			}
			else {
				this.special[ key ] = data.special[ key ] ;
			}
		}
	}

	if ( data.engine && typeof data.engine === 'object' ) {
		Object.assign( this.engine , data.engine ) ;
	}

	if ( data.globalCamera !== undefined ) { this.globalCamera.update( data.globalCamera ) ; }

	// For instance, there is no async code in GScene, but the API have to allow it
	return awaiting ? transitionPromise : Promise.resolved ;
} ;



GScene.prototype.hasGEntity = function( gEntityId ) { return gEntityId in this.gEntities ; } ;
GScene.prototype.getGEntity = function( gEntityId ) { return this.gEntities[ gEntityId ] ; } ;



GScene.prototype.registerGEntity = function( gEntityId , gEntity ) {
	if ( this.gEntities[ gEntityId ] ) { throw new Error( "Entity '" + gEntityId + "' already exists for this gScene" ) ; }
	this.gEntities[ gEntityId ] = gEntity ;
} ;



GScene.prototype.unregisterGEntity = function( gEntityId ) {
	delete this.gEntities[ gEntityId ] ;
} ;



GScene.prototype.removeGEntity = function( gEntityId ) {
	var gEntity = this.gEntities[ gEntityId ] ;
	if ( ! gEntity ) { return false ; }
	gEntity.destroy() ;
	return true ;
} ;

