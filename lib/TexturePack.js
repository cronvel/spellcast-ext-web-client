/*
	Spellcast

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



// !THIS SHOULD TRACK SERVER-SIDE TexturePack! spellcast/lib/gfx/TexturePack.js
function TexturePack( data ) {
	this.theme = data.theme || 'default' ;
	this.id = data.id ;		// theme+id is unique

	this.engine = {} ;
	if ( data.engine && typeof data.engine === 'object' ) {
		Object.assign( this.engine , data.engine ) ;
	}

	this.usage = data.usage || 'default' ;

	this.variants = {} ;

	for ( let name in data.variants ) {
		this.variants[ name ] = new Variant( data.variants[ name ] ) ;
	}
}

module.exports = TexturePack ;



// !THIS SHOULD TRACK SERVER-SIDE TexturePack! spellcast/lib/gfx/TexturePack.js
function Variant( data = {} ) {
	this.animate = data.type || null ;		// null: static image, other can be: 'loop' for looping animation, and so on...
	this.engine = data.engine || null ;		// engine-specific, like shaders?

	this.frames = data.frames.map( f => new Frame( f ) ) ;
}

TexturePack.Variant = Variant ;



// !THIS SHOULD TRACK SERVER-SIDE TexturePack! spellcast/lib/gfx/TexturePack.js
function Frame( data = {} ) {
	this.url = data.url ;					// default image/texture URL (or diffuse/albedo map)
	this.maps = data.maps || null ;         // null or object of URLs, like 'normal' or 'specular' for 3D engine, and so on
	this.maskUrl = data.maskUrl || null ;   // /!\ SHOULD BE MOVED TO .maps /!\ only few type of engine+usage combo support mask, most of them relying on SVG
	this.origin = data.origin || null ;		// the origin used for this image
	this.duration = data.duration || 100 ;	// the duration of this frame in ms
	this.xFlip = !! data.xFlip ;			// flip the image, +x and -x are flipped
	this.yFlip = !! data.yFlip ;			// flip the image, +y and -y are flipped
	this.engine = data.engine || null ;		// engine-specific, like shaders?
}

TexturePack.Frame = Frame ;

