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



const BrowserExm = require( 'exm/lib/BrowserExm.js' ) ;
const Dom = require( './Dom.js' ) ;
const engineLib = require( './engineLib.js' ) ;



module.exports = BrowserExm.registerNs( {
	ns: 'spellcast.web-client' ,
	extensionPath: '/ext' ,
	exports: {
		// Useful??? Everything should use engine hooks, there is probably little interest in re-using existing classes
		EventDispatcher: require( './EventDispatcher.js' ) ,
		Dom: Dom ,
		toolkit: require( './toolkit.js' ) ,
		Camera: require( './Camera.js' ) ,
		GEntity: require( './GEntity.js' ) ,
		GScene: require( './GScene.js' ) ,
		GTransition: require( './GTransition.js' ) ,
		TexturePack: require( './TexturePack.js' ) ,
		op: require( 'kung-fig-expression/lib/fnOperators.js' ) ,
		xop: require( 'spellcast-shared/lib/operators.js' )
		//, string: require( 'string-kit' )
	} ,
	api: {
		getEngine: engineLib.get ,
		addEngine: engineLib.add ,
		cleanUrl: Dom.cleanUrl
	}
} ) ;

