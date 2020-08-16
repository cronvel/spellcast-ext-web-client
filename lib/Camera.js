/*
	Spellcast's Web Client Extension

	Copyright (c) 2014 - 2020 Cédric Ronvel

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



const GTransition = require( './GTransition.js' ) ;

//const domKit = require( 'dom-kit' ) ;
const Promise = require( 'seventh' ) ;



// !THIS SHOULD TRACK SERVER-SIDE Camera! spellcast/lib/gfx/Camera.js
function Camera( gScene , data ) {
	this.gScene = gScene ;    // immutable

	this.position = { x: 0 , y: 0 , z: 10 } ;
	this.target = { x: 0 , y: 0 , z: 0 } ;
	this.roll = 0 ;
	this.fov = 90 ;
	this.perspective = 1 ;
	this.free = false ;
	this.trackingMode = null ;
}

module.exports = Camera ;



// !THIS SHOULD TRACK SERVER-SIDE Camera! spellcast/lib/gfx/Camera.js
Camera.prototype.update = function( data ) {
	if ( data.transition !== undefined ) { this.updateTransition( data ) ; }

	if ( data.position ) { this.position = data.position ; }
	if ( data.target ) { this.target = data.target ; }

	// Unused
	if ( data.roll !== undefined ) { this.roll = data.roll || 0 ; }
	if ( data.fov !== undefined ) { this.fov = data.fov || 90 ; }
	
	if ( data.perspective !== undefined ) {
		this.perspective = data.perspective || null ;
		// The perspective is relative to the viewport size
		let max = Math.max( this.gScene.$gscene.offsetWidth , this.gScene.$gscene.offsetHeight ) ;
		this.gScene.$gscene.style.perspective = this.perspective ? Math.round( max * this.perspective ) + 'px' : null ;
	}

	if ( data.free !== undefined ) { this.free = !! data.free ; }
	if ( data.trackingMode !== undefined ) { this.trackingMode = data.trackingMode || null ; }

	// perspective-origin changes have nasty bug and no transition (at least in FF 08/2020)
	//this.gScene.$gscene.style.perspectiveOrigin = ( ( 1 + this.position.x ) * 50 ) + '%' + ( ( 1 + this.position.y ) * 50 ) + '%' ;
	
	// It may be async later, waiting for transitions to finish the camera move?
	return Promise.resolved ;
} ;



Camera.prototype.updateTransition = function( data ) {
	console.warn( "Camera.updateTransition()" , data.transition , data ) ;

	if ( ! data.transition ) {
		this.gScene.$gscene.style.transition = 'none' ;
		return ;
	}

	var transition = new GTransition( data.transition ) ,
		parts = [] ;

	if ( data.perspective !== undefined ) {
		parts.push( transition.toString( 'transform' ) ) ;
	}

	if ( ! parts.length ) {
		this.gScene.$gscene.style.transition = 'none' ;
	}
	else {
		this.gScene.$gscene.style.transition = parts.join( ', ' ) ;
	}
} ;

