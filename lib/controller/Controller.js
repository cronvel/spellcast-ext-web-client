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



//const domKit = require( 'dom-kit' ) ;
//const Promise = require( 'seventh' ) ;
const LeanEvents = require( 'nextgen-events/lib/LeanEvents.js' ) ;



function Controller() {
}

module.exports = Controller ;

Controller.prototype = Object.create( LeanEvents.prototype ) ;
Controller.prototype.constructor = Controller ;



Controller.prototype.init = function() {
	//*
	this.on( 'key' , ( type , gp , oType ) => {
		console.warn( "Key:" , type , oType ) ;
	} ) ;
	this.on( 'change' , ( type , gp , oType , v1 , v2 ) => {
		console.warn( "Change:" , type , oType , v1 , v2 ) ;
	} ) ;
	//*/
} ;



Controller.prototype.addKey = function( key ) {
	this.emit( 'key' , key ) ;
} ;

