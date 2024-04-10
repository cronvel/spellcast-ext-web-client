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



const toolkit = {} ;
module.exports = toolkit ;



const escapeHtml = require( 'string-kit/lib/escape.js' ).html ;

const bookSource = require( 'book-source' ) ;
const HtmlRenderer = require( 'book-source-html-renderer' ) ;
const htmlRenderer = new HtmlRenderer( new bookSource.Theme() , { standalone: false } ) ;

//const format = require( 'string-kit/lib/format.js' ) ;
//const FORMAT_CONFIG = { argumentSanitizer: str =>  } ;



toolkit.markup = ( str ) => {
	var structuredDocument = bookSource.parse( str ) ;
	console.warn( ">>>>> lolwut" ) ;
	return structuredDocument.render( htmlRenderer ) ;
} ;

//toolkit.parseMarkup = ( ... args ) => {} ;



toolkit.stripMarkup = ( str ) => {
	var structuredDocument = bookSource.parse( str ) ;
	return escapeHtml( structuredDocument.getText() ) ;
} ;



// From Terminal-kit's misc.hexToRgba()
toolkit.hexToRgba = hex => {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) || 0 ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) || 0 ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) || 0 ,
		a: hex.length > 6 ? parseInt( hex.slice( 6 , 8 ) , 16 ) || 0 : 255
	} ;
} ;



toolkit.hexToRgb = hex => {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) || 0 ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) || 0 ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) || 0
	} ;
} ;



function to2HexDigits( n ) {
	if ( ! n || n < 0 ) { return '00' ; }
	if ( n < 16 ) { return '0' + n.toString( 16 ) ; }
	return n.toString( 16 ) ;
}



toolkit.rgbToHex =
toolkit.rgbaToHex = ( r , g , b , a = null ) => {
	if ( r && typeof r === 'object' ) {
		return typeof r.a !== 'number' ? '#' + to2HexDigits( r.r ) + to2HexDigits( r.g ) + to2HexDigits( r.b ) :
			'#' + to2HexDigits( r.r ) + to2HexDigits( r.g ) + to2HexDigits( r.b ) + to2HexDigits( r.a ) ;
	}

	return a === null ? '#' + to2HexDigits( r ) + to2HexDigits( g ) + to2HexDigits( b ) :
		'#' + to2HexDigits( r ) + to2HexDigits( g ) + to2HexDigits( b ) + to2HexDigits( a ) ;
} ;

