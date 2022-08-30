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
	this.keyPressedList = [] ;
	this.keyReleasedList = [] ;
	this.gaugeList = [] ;
	this.gauge2dList = [] ;

	this.keyBindings = {} ;
	this.gaugeBindings = {} ;
	this.gauge2dBindings = {} ;

	this.init() ;
}

module.exports = Controller ;

Controller.prototype = Object.create( LeanEvents.prototype ) ;
Controller.prototype.constructor = Controller ;



Controller.prototype.init = function() {
	//*
	this.on( 'key' , ( key ) => {
		console.warn( "Key:" , key ) ;
	} ) ;
	this.on( 'gauge' , ( key , v ) => {
		console.warn( "Gauge:" , key , v ) ;
	} ) ;
	this.on( 'gauge2d' , ( key , x , y ) => {
		console.warn( "Gauge 2d:" , key , x , y ) ;
	} ) ;
	this.on( 'command' , ( command ) => {
		console.warn( "Command:" , command ) ;
	} ) ;
	//*/
} ;



Controller.prototype.resetBindings = function() {
	this.keyBindings = {} ;
	this.gaugeBindings = {} ;
	this.gauge2dBindings = {} ;
} ;



Controller.prototype.addKeyBinding = function( key , command ) {
	if ( ! this.keyBindings[ key ] ) { this.keyBindings[ key ] = [ command ] ; }
	else if ( ! this.keyBindings[ key ].includes( command ) ) { this.keyBindings[ key ].push( 'command' ) ; }
} ;



Controller.prototype.addKeyPressed = function( device , key ) {
	if ( device.prefix ) { key = device.prefix + key ; }
	this.keyPressedList.push( [ key , device ] ) ;
} ;



Controller.prototype.addKeyReleased = function( device , key ) {
	if ( device.prefix ) { key = device.prefix + key ; }
	this.keyReleasedList.push( [ key + ':RELEASED' , device ] ) ;
} ;



Controller.prototype.addGauge = function( device , key , value ) {
	if ( device.prefix ) { key = device.prefix + key ; }
	this.gaugeList.push( [ key , value , device ] ) ;
} ;



Controller.prototype.addGauge2d = function( device , key , x , y ) {
	if ( device.prefix ) { key = device.prefix + key ; }
	this.gauge2dList.push( [ key , x , y , device ] ) ;
} ;



Controller.prototype.addKeyAndGauge = function( device , key , value , oldValue ) {
	if ( ! value ) { this.addKeyReleased( device , key ) ; }
	else if ( ! oldValue ) { this.addKeyPressed( device , key ) ; }

	this.addGauge( device , key , value ) ;
} ;



Controller.prototype.flushEvents = function() {
	var args , key , device , command ;

	// Released comes FIRST, it's important for "input string" to have the correct order
	for ( [ key , device ] of this.keyReleasedList ) {
		this.emit( 'key' , key , device ) ;

		if ( this.keyBindings[ key ] ) {
			for ( command of this.keyBindings[ key ] ) {
				this.emit( 'command' , command ) ;
			}
		}
	}

	for ( [ key , device ] of this.keyPressedList ) {
		this.emit( 'key' , key , device ) ;

		if ( this.keyBindings[ key ] ) {
			for ( command of this.keyBindings[ key ] ) {
				this.emit( 'command' , command ) ;
			}
		}
	}

	for ( args of this.gaugeList ) { this.emit( 'gauge' , ... args ) ; }
	for ( args of this.gauge2dList ) { this.emit( 'gauge2d' , ... args ) ; }

	this.keyPressedList.length = this.keyReleasedList.length = this.gaugeList.length = this.gauge2dList.length = 0 ;
} ;

