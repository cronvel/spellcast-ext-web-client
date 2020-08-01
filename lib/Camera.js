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



//const domKit = require( 'dom-kit' ) ;



// !THIS SHOULD TRACK SERVER-SIDE Camera! spellcast/lib/gfx/Camera.js
function Camera( dom , data ) {
	this.dom = dom ;    // Dom instance, immutable

	this.position = { x: 0 , y: 0 , z: 10 } ;
	this.targetPosition = { x: 0 , y: 0 , z: 0 } ;
	this.free = false ;
	this.trackingMode = null ;
	this.perspective = null ;
}

module.exports = Camera ;



// !THIS SHOULD TRACK SERVER-SIDE Camera! spellcast/lib/gfx/Camera.js
Camera.prototype.update = function( data , eventData ) {
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
		let avg = ( this.dom.$gfx.offsetWidth + this.dom.$gfx.offsetHeight ) / 2 ;
		this.dom.$gfx.style.perspective = this.perspective ? Math.round( avg * this.perspective ) + 'px' : null ;
	}
} ;

