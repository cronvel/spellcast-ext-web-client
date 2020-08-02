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
	this.targetPosition = { x: 0 , y: 0 , z: 0 } ;
	this.free = false ;
	this.trackingMode = null ;
	this.perspective = 1 ;

	this.transitions = {
		perspective: null   // transition on perspective changes
	} ;
}

module.exports = Camera ;



// !THIS SHOULD TRACK SERVER-SIDE Camera! spellcast/lib/gfx/Camera.js
Camera.prototype.update = function( data , eventData ) {
	if ( data.transitions !== undefined ) { this.updateTransition( data.transitions ) ; }

	if ( data.position ) {
		if ( data.position.x !== undefined ) { this.position.x = data.position.x ; }
		if ( data.position.y !== undefined ) { this.position.y = data.position.y ; }
		if ( data.position.z !== undefined ) { this.position.z = data.position.z ; }
	}

	if ( data.targetPosition ) {
		if ( data.targetPosition.x !== undefined ) { this.targetPosition.x = data.targetPosition.x ; }
		if ( data.targetPosition.y !== undefined ) { this.targetPosition.y = data.targetPosition.y ; }
		if ( data.targetPosition.z !== undefined ) { this.targetPosition.z = data.targetPosition.z ; }
	}

	if ( data.free !== undefined ) { this.free = !! data.free ; }
	if ( data.trackingMode !== undefined ) { this.trackingMode = data.trackingMode || null ; }

	if ( data.perspective !== undefined ) {
		this.perspective = data.perspective || null ;
		// The perspective is relative to the viewport size
		let avg = ( this.gScene.$gscene.offsetWidth + this.gScene.$gscene.offsetHeight ) / 2 ;
		this.gScene.$gscene.style.perspective = this.perspective ? Math.round( avg * this.perspective ) + 'px' : null ;
	}
	
	// It may be async later, waiting for transitions to finish the camera move?
	return Promise.resolved ;
} ;



Camera.prototype.updateTransition = function( transitions ) {
	console.warn( "Camera.updateTransition()" , transitions ) ;
	var parts = [] ;

	if ( transitions.perspective !== undefined ) { this.transitions.perspective = transitions.perspective ? new GTransition( transitions.perspective ) : transitions.perspective ; }

	if ( this.transitions.perspective !== null ) {
		if ( ! transitions.perspective ) { parts.push( 'perspective 0s' ) ; }
		else { parts.push( this.transitions.perspective.toString( 'perspective' ) ) ; }
	}

	if ( ! parts.length ) {
		this.gScene.$gscene.style.transition = '' ;	// reset it to default stylesheet value
	}
	else {
		this.gScene.$gscene.style.transition = parts.join( '; ' ) ;
	}
} ;

