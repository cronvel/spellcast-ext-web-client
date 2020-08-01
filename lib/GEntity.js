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
const commonUtils = require( './commonUtils.js' ) ;
const sizeModes = require( './sizeModes.js' ) ;
const positionModes = require( './positionModes.js' ) ;

const Ngev = require( 'nextgen-events/lib/browser.js' ) ;
const Promise = require( 'seventh' ) ;
const domKit = require( 'dom-kit' ) ;
const svgKit = require( 'svg-kit' ) ;



// !THIS SHOULD TRACK SERVER-SIDE GEntity! spellcast/lib/gfx/GEntity.js
function GEntity( dom , data ) {
	this.dom = dom ;	// Dom instance, immutable
	this.usage = data.usage || 'sprite' ;	// immutable

	this.show = false ;
	this.persistent = true ;
	this.button = null ;
	this.theme = null ;
	this.texturePack = null ;
	this.variant = 'default' ;
	this.location = null ;
	this.position = { x: 0 , y: 0 , z: 0 } ;
	this.positionMode = 'default' ;
	this.size = { x: 1 , y: 1 , z: 1 } ;
	this.sizeMode = 'default' ;
	this.rotation = { x: 0 , y: 0 , z: 0 } ;
	this.rotationMode = 'default' ;
	//this.rotation = TO BE DEFINED....

	this.data = {} ;
	this.meta = {} ;
	this.engine = {} ;

	this.transitions = {
		transform: null ,	// change in position, size, rotation, 3D transform/matrix and more...
		//position: null , size: null , rotation: null ,
		opacity: null ,
		color: null ,
		effect: null
	} ;


	// Internal

	this.$wrapper = null ;
	this.$image = null ;
	this.$backImage = null ;
	this.$mask = null ;
	this.$locationSlot = null ;
	this.$front = null ;
	this._transform = {} ;

	if ( this.usage !== 'marker' ) {
		this.$wrapper = document.createElement( 'div' ) ;
		// At creation, the visibility is turned off, the initial update will turn it on again
		this.$wrapper.style.visibility = 'hidden' ;
		this.$wrapper.style.transition = 'none' ;
		this.$wrapper.classList.add( 'g-entity-wrapper' , 'g-entity-' + this.usage + '-wrapper' ) ;
		//this.$gfx.append( this.$wrapper ) ;
		this.dom.$gfx.append( this.$wrapper ) ;
	}

	this.defineStates( 'loaded' , 'loading' ) ;
}

GEntity.prototype = Object.create( Ngev.prototype ) ;
GEntity.prototype.constructor = GEntity ;

module.exports = GEntity ;



// !THIS SHOULD TRACK SERVER-SIDE GEntity! spellcast/lib/gfx/GEntity.js
GEntity.prototype.update = async function( data , initial = false ) {
	console.warn( "GEntity.update()" , data ) ;

	// Structural/discrete part

	if ( data.texturePack !== undefined || data.variant !== undefined || data.theme !== undefined ) {
		await this.updateTexture( data.texturePack , data.variant , data.theme ) ;
	}

	if ( data.data ) {
		if ( data.data.vgUrl ) { await this.updateVgImage( data.data.vgUrl ) ; }
		else if ( data.data.vgObject ) { this.updateVgObject( data.data.vgObject ) ; }
		else if ( data.data.vgMorph ) { this.updateVgMorph( data.data.vgMorph ) ; }

		if ( data.data.area ) {
			this.updateVgArea( data.data.area ) ;
		}

	}

	if ( this.usage === 'marker' && ( data.location || ( data.data && data.data.inVg ) ) ) {
		this.updateMarkerLocation( data.data && data.data.inVg , data.location ) ;
	}

	if ( data.button !== undefined ) { this.updateButton( data.button ) ; }


	// Continuous part

	// Should comes first: Transition,
	// Either remove them (for initial value) or set them to the user value before changing anything
	if ( ! initial && this.usage !== 'marker' && data.transitions !== undefined ) {
		this.updateTransition( data.transitions ) ;
	}

	if ( data.location !== undefined && this.usage !== 'marker' ) {
		// Should be triggered first, or pose/style would conflict with it
		await this.moveToLocation( data.location ) ;
	}

	if (
		data.position !== undefined || data.positionMode !== undefined
		|| data.size !== undefined || data.sizeMode !== undefined
		|| data.rotation !== undefined || data.rotationMode !== undefined
	) {
		this.updateTransform( data ) ;
	}

	if ( data.meta ) { this.updateMeta( data.meta ) ; }

	// Should comes last: for initial update, restore the transition value and turn visibility on
	if ( initial && this.usage !== 'marker' ) {
		// At creation, the visibility is turned off, now we need to turn it on again
		this.$wrapper.style.visibility = 'visible' ;

		// If it's done immediately, the transition can kick in nonetheless, so wait for TWO animation frames (one is not sufficient)
		await Promise.resolveAtAnimationFrame() ;
		await Promise.resolveAtAnimationFrame() ;

		if ( data.transitions !== undefined ) { this.updateTransition( data.transitions ) ; }
	}
} ;



// Update the gEntity's texture
GEntity.prototype.updateTexture = function( texturePackId , variantId , themeId ) {
	var texturePack , variant ;

	if ( texturePackId !== undefined ) { this.texturePack = texturePackId || null ; }
	if ( variantId !== undefined ) { this.variant = variantId || null ; }
	if ( themeId !== undefined ) { this.texturePack = themeId || null ; }

	console.warn( "GEntity.updateTexture()" , texturePackId , variantId , themeId ) ;

	texturePack = this.dom.texturePacks[ this.texturePack + '/' + ( this.theme || this.dom.textureTheme ) ] ;

	if ( ! texturePack ) {
		console.warn( "Texture pack" , this.texturePack + '/' + ( this.theme || this.dom.textureTheme ) , "not found" ) ;
		texturePack = this.dom.texturePacks[ this.texturePack + '/default' ] ;

		if ( ! texturePack ) {
			console.warn( "Texture pack fallback" , this.texturePack + '/default' , "not found" ) ;
			return Promise.resolved ;
		}
	}

	variant = texturePack.variants[ this.variant ] || texturePack.variants.default ;

	if ( ! variant ) {
		console.warn( "Texture pack variant" , this.variant , "not found, and default variant missing too" ) ;
		return Promise.resolved ;
	}

	return this.updateImage( variant.frames[ 0 ].url ) ;
} ;



// Load/replace the gEntity's image
GEntity.prototype.updateImage = function( url ) {
	if ( this.usage === 'card' ) {
		this.$image.style.backgroundImage = 'url("' + this.dom.cleanUrl( url ) + '")' ;
		return Promise.resolved ;
	}

	if ( url.endsWith( '.svg' ) ) { return this.updateVgImage( url ) ; }
	
	var promise = new Promise() ,
		shouldAppend = ! this.$image ;

	if ( this.$image && this.$image.tagName.toLowerCase() !== 'img' ) {
		this.$image.remove() ;
		this.$image = null ;
	}

	if ( ! this.$image ) {
		shouldAppend = true ;
		this.$image = document.createElement( 'img' ) ;
		this.$image.classList.add( this.usage ) ;
	}

	this.$image.setAttribute( 'src' , this.dom.cleanUrl( url ) ) ;
	this.$image.onload = () => promise.resolve() ;

	if ( shouldAppend && this.usage !== 'marker' ) {
		this.$wrapper.append( this.$image ) ;
	}

	return promise ;
} ;



GEntity.prototype.updateVgImage = function( url ) {
	console.warn( ".updateVgImage()" ) ;
	if ( ! url.endsWith( '.svg' ) ) {
		console.warn( ".updateVgImage(): not a .svg file" ) ;
		return Promise.resolved ;
	}
	
	var promise = new Promise() ;

	// Always wipe any existing $image element and pre-create the <svg> tag
	if ( this.$image ) { this.$image.remove() ; }

	if ( this.usage === 'marker' ) {
		// If it's a marker, load it inside a <g> tag, that will be part of the main VG's <svg>
		// <svg> inside <svg> are great, but Chrome sucks at it (it does not support CSS transform, etc)
		this.$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'g' ) ;
	}
	else {
		this.$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
		this.$image.classList.add( 'svg' ) ;
	}

	switch ( this.usage ) {
		case 'vg' :
			// Stop event propagation
			this.onClick = ( event ) => {
				//this.actionCallback( this.action ) ;
				event.stopPropagation() ;
			} ;

			this.$image.addEventListener( 'click' , this.onClick ) ;
			this.$image.classList.add( 'vg' ) ;
			this.dom.uiLoadingCount ++ ;
			break ;
		case 'sprite' :
			this.$image.classList.add( 'sprite' ) ;
			break ;
		case 'marker' :
			this.$image.classList.add( 'marker' ) ;
			break ;
	}

	svgKit.load( this.dom.cleanUrl( url ) , {
		removeSvgStyle: true ,
		//removeSize: true ,
		//removeIds: true ,
		removeComments: true ,
		removeExoticNamespaces: true ,
		//removeDefaultStyles: true ,
		as: this.$image
	} ).then( () => {
		console.warn( "loaded!" ) ;
		if ( this.usage === 'vg' ) {
			this.setVgButtons( this.$image ) ;
			this.setVgPassiveHints( this.$image ) ;
			this.emit( 'loaded' ) ;
			if ( -- this.dom.uiLoadingCount <= 0 ) { this.emit( 'uiLoaded' ) ; }
		}
		else {
			this.emit( 'loaded' ) ;
		}

		promise.resolve() ;
	} ) ;

	console.warn( "Aft load" ) ;
	this.emit( 'loading' ) ;

	if ( this.usage !== 'marker' ) {
		this.$wrapper.append( this.$image ) ;
	}

	return promise ;
} ;



// Size, positioning and rotation
GEntity.prototype.updateTransform = function( data ) {
	var areaWidth , areaHeight , imageWidth , imageHeight ;

	if ( data.position ) {
		if ( data.position.x !== undefined ) { this.position.x = data.position.x ; }
		if ( data.position.y !== undefined ) { this.position.y = data.position.y ; }
		if ( data.position.z !== undefined ) { this.position.z = data.position.z ; }
	}

	if ( data.size ) {
		if ( data.size.x !== undefined ) { this.size.x = data.size.x ; }
		if ( data.size.y !== undefined ) { this.size.y = data.size.y ; }
		if ( data.size.z !== undefined ) { this.size.z = data.size.z ; }
	}

	if ( data.rotation ) {
		if ( data.rotation.x !== undefined ) { this.rotation.x = data.rotation.x ; }
		if ( data.rotation.y !== undefined ) { this.rotation.y = data.rotation.y ; }
		if ( data.rotation.z !== undefined ) { this.rotation.z = data.rotation.z ; }
	}

	if ( data.positionMode ) { this.positionMode = data.positionMode || 'default' ; }
	if ( data.sizeMode ) { this.sizeMode = data.sizeMode || 'default' ; }
	if ( data.rotationMode ) { this.rotationMode = data.rotationMode || 'default' ; }

	// For instance, marker are excluded
	if ( ! this.$wrapper || ! this.$image ) { return ; }


	// Pre-compute few thing necessary for the following stuff

	areaWidth = this.dom.$gfx.offsetWidth ;
	areaHeight = this.dom.$gfx.offsetHeight ;
	
	if ( this.$image.tagName.toLowerCase() === 'svg' ) {
		// The SVG element is not a DOM HTML element, it does not have offsetWidth/offsetHeight.
		//imageNaturalWidth = this.$image.width.baseVal.value ;
		//imageNaturalHeight = this.$image.height.baseVal.value ;
		imageWidth = this.$wrapper.offsetWidth ;
		imageHeight = this.$wrapper.offsetHeight ;
	}
	else {
		//imageNaturalWidth = this.$image.naturalWidth ;
		//imageNaturalHeight = this.$image.naturalHeight ;
		imageWidth = this.$image.offsetWidth ;
		imageHeight = this.$image.offsetHeight ;
	}
	console.log( "dbg img:" , { areaWidth , areaHeight , imageWidth , imageHeight } ) ;


	// Compute scaling -- should comes first for this to work!
	( sizeModes[ this.sizeMode ] || sizeModes.default )( this._transform , this.size , areaWidth , areaHeight , imageWidth , imageHeight ) ;
	console.log( "._transform after size computing" , this._transform ) ;


	// Compute position
	( positionModes[ this.positionMode ] || positionModes.default )( this._transform , this.position , areaWidth , areaHeight , imageWidth , imageHeight ) ;
	console.log( "._transform after position computing" , this._transform ) ;

	// We use the math convention, x-right, y-up, z-to-cam, z-rotation is counter clockwise, and so on
	this._transform.eulerOrder = this.rotationMode === 'default' ? null : this.rotationMode ;
	this._transform.rotateX = -this.rotation.x ;
	this._transform.rotateY = this.rotation.y ;
	this._transform.rotateZ = -this.rotation.z ;
	console.log( "._transform after rotation computing" , this._transform ) ;

	// Finally, create the transformation CSS string
	domKit.transform( this.$wrapper , this._transform ) ;
} ;



GEntity.prototype.updateTransition = function( transitions ) {
	console.warn( "GEntity.updateTransition()" , transitions ) ;
	var parts = [] ;

	if ( transitions.transform !== undefined ) { this.transitions.transform = transitions.transform ? new GTransition( transitions.transform ) : transitions.transform ; }
	if ( transitions.opacity !== undefined ) { this.transitions.opacity = transitions.opacity ? new GTransition( transitions.opacity ) : transitions.opacity ; }
	if ( transitions.color !== undefined ) { this.transitions.color = transitions.color ? new GTransition( transitions.color ) : transitions.color ; }
	if ( transitions.effect !== undefined ) { this.transitions.effect = transitions.effect ? new GTransition( transitions.effect ) : transitions.effect ; }

	if ( this.transitions.transform !== null ) {
		if ( ! transitions.transform ) { parts.push( 'transform 0s' ) ; }
		else { parts.push( this.transitions.transform.toString( 'transform' ) ) ; }
	}

	if ( this.transitions.opacity !== null ) {
		if ( ! transitions.opacity ) { parts.push( 'opacity 0s' ) ; }
		else { parts.push( this.transitions.opacity.toString( 'opacity' ) ) ; }
	}

	/* /!\ TO BE DEFINED /!\
	if ( this.transitions.color !== null ) {
		if ( ! transitions.color ) { parts.push( 'color 0s' ) ; }
		else { parts.push( this.transitions.color.toString( 'color' ) ) ; }
	}

	if ( this.transitions.effect !== null ) {
		if ( ! transitions.effect ) { parts.push( 'effect 0s' ) ; }
		else { parts.push( this.transitions.effect.toString( 'effect' ) ) ; }
	}
	*/


	if ( ! parts.length ) {
		this.$wrapper.style.transition = '' ;	// reset it to default stylesheet value
	}
	else {
		this.$wrapper.style.transition = parts.join( '; ' ) ;
	}
} ;



// Button ID (data.button)
GEntity.prototype.updateButton = function( buttonId ) {
	var $element = this.$mask || this.$wrapper ;

	$element.setAttribute( 'id' , 'button-' + buttonId ) ;
	$element.classList.add( 'button' ) ;
	$element.classList.add( 'disabled' ) ;
} ;



// Update meta (data.meta)
GEntity.prototype.updateMeta = function( metaObject ) {
	var meta , metaName ;

	for ( metaName in metaObject ) {
		meta = metaObject[ metaName ] ;

		if ( meta ) {
			this.$wrapper.classList.add( 'meta-' + metaName ) ;

			if ( typeof meta === 'number' || typeof meta === 'string' ) {
				this.$wrapper.setAttribute( 'meta-' + metaName , meta ) ;
			}
		}
		else {
			this.$wrapper.classList.remove( 'meta-' + metaName ) ;

			if ( this.$wrapper.hasAttribute( 'meta-' + metaName ) ) {
				this.$wrapper.removeAttribute( 'meta-' + metaName ) ;
			}
		}
	}
} ;



// Move to a location and perform a FLIP (First Last Invert Play)
GEntity.prototype.moveToLocation = function( locationName ) {
	if ( this.location === locationName ) { return Promise.resolved ; }

	var promise = new Promise() ;

	var $location , $oldLocation , oldLocationName , $slot , $oldSlot , direction , oldDirection ,
		siblingGEntities , siblingSlotRectsBefore , siblingSlotRectsAfter ,
		slotSize , slotBbox , oldSlotBbox ;

	// Timeout value used to enable FLIP transition
	var flipTimeout = 10 ;

	oldLocationName = this.location ;
	$oldLocation = oldLocationName ? this.dom.gEntityLocations[ oldLocationName ] : this.dom.$gfx ;
	$oldSlot = this.$locationSlot || this.dom.$gfx ;
	this.location = locationName ;

	$location = locationName ? this.dom.gEntityLocations[ locationName ] : this.dom.$gfx ;

	if ( ! $location ) {
		// Create the location if it doesn't exist
		$location = this.dom.gEntityLocations[ locationName ] = document.createElement( 'div' ) ;
		$location.classList.add( 'g-entity-location' ) ;
		$location.classList.add( 'g-entity-location-' + locationName ) ;
		this.dom.$gfx.append( $location ) ;
	}

	// Save computed styles now
	var gEntityComputedStyle = window.getComputedStyle( this.$wrapper ) ;
	var locationComputedStyle = window.getComputedStyle( $location ) ;

	// GEntity size
	var gEntityWidth = parseFloat( gEntityComputedStyle.width ) ;
	var gEntityHeight = parseFloat( gEntityComputedStyle.height ) ;

	if ( $location === this.dom.$gfx ) {
		$slot = this.dom.$gfx ;
	}
	else {
		$slot = this.$locationSlot = document.createElement( 'div' ) ;
		$slot.classList.add( 'g-entity-slot' ) ;
		$slot.style.order = this.order ;
		//$slot.style.zIndex = this.order ;	// Not needed, rendering preserve ordering, not DOM precedence, so it's ok
	}

	// Before appending, save all rects of existing sibling slots

	siblingGEntities = [ ... Object.values( this.dom.gEntities ) ]
		.filter( e => e !== this && e.usage !== 'marker' && e.location && ( e.location === locationName || e.location === oldLocationName ) ) ;

	siblingSlotRectsBefore = siblingGEntities.map( e => e.$locationSlot.getBoundingClientRect() ) ;


	// Insert the slot, if it's not $gfx
	if ( $slot !== this.dom.$gfx ) {
		// We should preserve the :last-child pseudo selector, since there isn't any :last-ordered-child for flex-box...
		if ( $location.lastChild && parseFloat( $location.lastChild.style.order ) > this.order ) {
			// The last entity has a greater order, so we prepend instead
			$location.prepend( $slot ) ;
		}
		else {
			$location.append( $slot ) ;
		}
	}

	// Save the old slot BBox
	oldSlotBbox = $oldSlot.getBoundingClientRect() ;

	// Remove that slot now
	if ( $oldSlot !== this.dom.$gfx ) { $oldSlot.remove() ; }


	// Get slots rects after
	siblingSlotRectsAfter = siblingGEntities.map( e => e.$locationSlot.getBoundingClientRect() ) ;

	// Immediately compute the translation delta and the FLIP for siblings
	siblingGEntities.forEach( ( siblingGEntity , index ) => {
		var beforeRect = siblingSlotRectsBefore[ index ] ,
			afterRect = siblingSlotRectsAfter[ index ] ;

		var transitionStr = siblingGEntity.$wrapper.style.transition ;
		var transformStr = siblingGEntity.$wrapper.style.transform ;

		// Get the local transform, and patch it!
		var transformDelta = Object.assign( {} , siblingGEntity.localTransform ) ;
		transformDelta.translateX += beforeRect.left - afterRect.left ;
		transformDelta.translateY += beforeRect.top - beforeRect.top ;

		// First, disable transitions, so the transform will apply now!
		siblingGEntity.$wrapper.style.transition = 'none' ;
		siblingGEntity.$wrapper.style.transform = domKit.stringifyTransform( transformDelta ) ;

		setTimeout( () => {
			// Re-enable transitions, restore the transform value
			siblingGEntity.$wrapper.style.transition = transitionStr ;
			siblingGEntity.$wrapper.style.transform = transformStr ;
		} , flipTimeout ) ;
	} ) ;


	var targetTransform = { translateX: 0 , translateY: 0 } ;

	// Scale transform
	switch ( locationComputedStyle.flexDirection ) {
		case 'row' :
		case 'row-reverse' :
			slotSize = parseFloat( locationComputedStyle.height ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityHeight ;
			break ;
		case 'column' :
		case 'column-reverse' :
			slotSize = parseFloat( locationComputedStyle.width ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityWidth ;
			break ;
		default :
			slotSize = parseFloat( locationComputedStyle.height ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityHeight ;
			console.warn( 'flex-direction' , locationComputedStyle.flexDirection ) ;
	}

	// Translation compensation due to scaling, since the origin is in the middle
	targetTransform.translateX -= ( gEntityWidth - gEntityWidth * targetTransform.scaleX ) / 2 ;
	targetTransform.translateY -= ( gEntityHeight - gEntityHeight * targetTransform.scaleY ) / 2 ;

	var localTransform = this.localTransform ;
	this.localTransform = targetTransform ;

	// If this is not a true slot, then just put the gEntity on this slot immediately
	if ( $oldSlot === this.dom.$gfx ) {
		this.$wrapper.style.transform = domKit.stringifyTransform( targetTransform ) ;
		$slot.append( this.$wrapper ) ;
		promise.resolve() ;
		return promise ;
	}


	// Computed styles
	var oldLocationComputedStyle = window.getComputedStyle( $oldLocation ) ;

	// Old location direction
	switch ( oldLocationComputedStyle.flexDirection ) {
		case 'column' :
		case 'column-reverse' :
			oldDirection = 'column' ;
			break ;
		default :
			oldDirection = 'row' ;
	}

	// Compute the FLIP (First Last Invert Play)
	slotBbox = $slot.getBoundingClientRect() ;
	//console.warn( 'bboxes' , slotBbox ,  oldSlotBbox ) ;

	// Old/new difference
	var sourceTransform = {
		translateX: oldSlotBbox.left + localTransform.translateX - slotBbox.left ,
		translateY: oldSlotBbox.top + localTransform.translateY - slotBbox.top ,
		scaleX: localTransform.scaleX ,
		scaleY: localTransform.scaleY
	} ;

	this.$wrapper.style.transform = domKit.stringifyTransform( sourceTransform ) ;
	$slot.append( this.$wrapper ) ;

	// Do not initiate the new transform value in the same synchronous flow,
	// it would not animate anything
	setTimeout( () => {
		this.$wrapper.style.transform = domKit.stringifyTransform( targetTransform ) ;
		promise.resolve() ;
	} , flipTimeout ) ;

	return promise ;
} ;



// Vector Graphics

GEntity.prototype.updateVgObject = function( vgObject ) {
	if ( ! ( vgObject instanceof svgKit.VG ) ) {
		vgObject = svgKit.objectToVG( vgObject ) ;
		if ( ! ( vgObject instanceof svgKit.VG ) ) {
			// Do nothing if it's not a VG object
			return ;
		}
	}

	// Save it now!
	this.data.vgObject = vgObject ;

	// Always wipe any existing $image element and pre-create the <svg> tag
	if ( this.$image ) { this.$image.remove() ; }

	if ( this.usage === 'marker' ) {
		// If it's a marker, load it inside a <g> tag, that will be part of the main VG's <svg>
		// <svg> inside <svg> are great, but Chrome sucks at it (it does not support CSS transform, etc)
		this.$image = vgObject.renderDom( { overrideTag: 'g' } ) ;
	}
	else {
		// Add a removeSvgStyle:true options?
		this.$image = vgObject.renderDom() ;
		this.$image.classList.add( 'svg' ) ;
		this.$image.classList.add( 'vg-object' ) ;
	}

	switch ( this.usage ) {
		case 'vg' :
			// Stop event propagation
			this.onClick = ( event ) => {
				//this.actionCallback( this.action ) ;
				event.stopPropagation() ;
			} ;

			this.$image.addEventListener( 'click' , this.onClick ) ;
			this.$image.classList.add( 'vg' ) ;
			this.setVgButtons( this.$image ) ;
			this.setVgPassiveHints( this.$image ) ;
			break ;
		case 'sprite' :
			this.$image.classList.add( 'sprite' ) ;
			break ;
		case 'marker' :
			this.$image.classList.add( 'marker' ) ;
			break ;
	}

	if ( this.usage !== 'marker' ) {
		this.$wrapper.append( this.$image ) ;
	}

	return ;
} ;



GEntity.prototype.updateVgMorph = function( vgMorph ) {
	var vgObject = this.data.vgObject ;

	if ( ! vgObject ) {
		// Do nothing if it's not a VG object
		console.warn( "Has no VG object, abort..." ) ;
		return ;
	}

	//console.warn( "Got morph log:" , data.vgMorph ) ;
	vgObject.importMorphLog( vgMorph ) ;
	//console.warn( "After importing morph log:" , vgObject ) ;
	vgObject.morphDom() ;

	return ;
} ;



GEntity.prototype.updateVgArea = function( areaData ) {
	var area ;

	if ( this.usage !== 'vg' ) { return ; }

	if ( ! this.hasState( 'loaded' ) ) {
		this.once( 'loaded' , this.updateVgArea.bind( this , areaData ) ) ;
		return ;
	}

	if ( ! this.data.area ) { this.data.area = {} ; }

	for ( area in areaData ) {
		if ( ! this.data.area[ area ] ) { this.data.area[ area ] = {} ; }
		if ( ! this.data.area[ area ].meta ) { this.data.area[ area ].meta = {} ; }

		if ( areaData[ area ].hint !== undefined ) { this.data.area[ area ].hint = areaData[ area ].hint || null ; }
		if ( areaData[ area ].meta ) { Object.assign( this.data.area[ area ].meta , areaData[ area ].meta ) ; }

		Array.from( this.$image.querySelectorAll( '[area=' + area + ']' ) ).forEach( ( $element ) => {
			var metaName ;

			if ( areaData[ area ].hint !== undefined ) {
				if ( areaData[ area ].hint ) {
					$element.setAttribute( 'data-passive-hint' , areaData[ area ].hint ) ;
					$element.classList.add( 'passive-hint' ) ;
				}
				else {
					$element.removeAttribute( 'data-passive-hint' ) ;
					$element.classList.remove( 'passive-hint' ) ;
				}
			}

			if ( areaData[ area ].meta ) {
				for ( metaName in areaData[ area ].meta ) {
					if ( areaData[ area ].meta[ metaName ] ) {
						$element.classList.add( 'meta-' + metaName ) ;
					}
					else {
						$element.classList.remove( 'meta-' + metaName ) ;
					}
				}
			}
		} ) ;
	}
} ;



GEntity.prototype.setVgButtons = function( $svg ) {
	Array.from( $svg.querySelectorAll( '[button]' ) ).forEach( ( $element ) => {
		var buttonId = $element.getAttribute( 'button' ) ;

		$element.setAttribute( 'id' , 'button-' + buttonId ) ;

		if ( ! $element.getAttribute( 'area' ) ) {
			// Create a default area's name equals to the button's ID, if not present
			$element.setAttribute( 'area' , buttonId ) ;
		}

		$element.classList.add( 'button' ) ;
		$element.classList.add( 'disabled' ) ;
	} ) ;
} ;



GEntity.prototype.setVgPassiveHints = function( $svg ) {
	Array.from( $svg.querySelectorAll( '[hint]' ) ).forEach( ( $element ) => {
		var hint = $element.getAttribute( 'hint' ) ;

		$element.setAttribute( 'data-passive-hint' , hint ) ;
		$element.classList.add( 'passive-hint' ) ;

		$element.addEventListener( 'mouseleave' , ( event ) => {
			this.dom.clearHint() ;
			//event.stopPropagation() ; // useless for mouseleave events
		} ) ;

		$element.addEventListener( 'mouseenter' , ( event ) => {
			var $element_ = event.currentTarget ;
			var hint_ = $element_.getAttribute( 'data-passive-hint' ) ;
			if ( ! hint_ ) { return ; }
			this.dom.setHint( hint_ , { passive: true } ) ;
			//event.stopPropagation() ; // useless for mouseenter events
		} ) ;
	} ) ;
} ;



// Markers inside Vector Graphics

GEntity.prototype.updateMarkerLocation = function( vgId , areaId ) {
	var vg , $area , areaBBox , markerViewBox , width , height , originX , originY , posX , posY ;


	// First, check that everything is ready and OK...
	if ( ! this.hasState( 'loaded' ) ) {
		this.once( 'loaded' , this.updateMarkerLocation.bind( this , vgId , areaId ) ) ;
		return ;
	}

	if ( ! vgId ) { vgId = this.data.inVg ; }
	if ( ! areaId ) { areaId = this.location ; }

	if ( ! this.dom.gEntities[ vgId ] ) {
		console.warn( 'Unknown VG id: ' , vgId ) ;
		return ;
	}

	vg = this.dom.gEntities[ vgId ] ;

	if ( ! vg.usage === 'vg' ) {
		console.warn( 'This gEntity is not a VG, id: ' , vgId ) ;
		return ;
	}

	if ( ! vg.hasState( 'loaded' ) ) {
		vg.once( 'loaded' , this.updateMarkerLocation.bind( this , vgId , areaId ) ) ;
		return ;
	}

	$area = vg.$image.querySelector( '[area=' + areaId + ']' ) ;

	if ( ! $area ) {
		console.warn( 'VG ' + vgId + ': area not found' , areaId ) ;
		return ;
	}


	// Once everything is ok, update the marker
	this.data.inVg = vgId ;
	this.location = areaId ;


	// Get or compute the area active point
	areaBBox = $area.getBBox() ;
	posX = areaBBox.x + areaBBox.width / 2 ;
	posY = areaBBox.y + areaBBox.height / 2 ;


	// Now, compute the SVG marker position
	markerViewBox = svgKit.getViewBox( this.$image ) ;
	width = parseFloat( this.$image.getAttribute( 'width' ) ) || markerViewBox.width ;
	height = parseFloat( this.$image.getAttribute( 'height' ) ) || markerViewBox.height ;

	if ( ! isNaN( originX = parseFloat( this.$image.getAttribute( 'originX' ) ) ) ) {
		posX -= ( ( originX - markerViewBox.x ) / markerViewBox.width ) * width ;
	}

	if ( ! isNaN( originY = parseFloat( this.$image.getAttribute( 'originY' ) ) ) ) {
		posY -= ( ( originY - markerViewBox.y ) / markerViewBox.height ) * height ;
	}

	//* Using CSS transform (Chrome and Firefox both support transition here)
	this.$image.style.transform =
		'translate(' + posX + 'px , ' + posY + 'px )' +
		'scale(' + width / markerViewBox.width + ' , ' + height / markerViewBox.height + ')' ;
	//*/

	/* Using SVG's transform attribute (Chrome allows transition but not Firefox)
	this.$image.setAttribute( 'transform' ,
		'translate(' + posX + ' , ' + posY + ' )' +
		'scale(' + width / markerViewBox.width + ' , ' + height / markerViewBox.height + ')'
	) ;
	//*/

	// Append the <g> tag to the main VG's <svg> now, if needed
	if ( this.$image.ownerSVGElement !== vg.$image ) {
		vg.$image.append( this.$image ) ;
	}
} ;





// Below are things not yet migrated from old Dom.js/Server-side!





// Remaining server-side properties to port...
GEntity.prototype.update_serverside = function( data , initial = false ) {
	var key ;

	if ( data.show !== undefined ) { this.show = !! data.show ; }
	if ( data.persistent !== undefined ) { this.persistent = !! data.persistent ; }

	if ( data.engine && typeof data.engine === 'object' ) {
		Object.assign( this.engine , data.engine ) ;
	}

	return this ;
} ;





// This have been stripped, it only remains thing that are not ported yet
GEntity.prototype.update_ = async function( id , data , initial = false ) {
	// Critical/structural part
	// The order matters

	if ( data.backUrl ) { await this.updateBackImage( data ) ; }
	if ( data.maskUrl ) { await this.updateMask( data ) ; }
	if ( data.content ) { this.updateContent( data ) ; }


	// Non-critical part
	// The order matters

	if ( data.pose !== undefined ) { this.updatePose( data ) ; }

	// Use data.style, NOT this.style: we have to set only new/updated styles
	if ( data.style && this.$wrapper ) {
		delete data.style.position ;	// Forbidden style
		Object.assign( this.style , data.style ) ;
		domKit.css( this.$wrapper , data.style ) ;
	}

	if ( data.imageStyle && this.$image ) {
		delete data.imageStyle.position ;	// Forbidden style
		Object.assign( this.imageStyle , data.imageStyle ) ;
		domKit.css( this.$image , data.imageStyle ) ;
	}

	if ( data.backImageStyle && this.$backImage ) {
		delete data.backImageStyle.position ;	// Forbidden style
		Object.assign( this.backImageStyle , data.backImageStyle ) ;
		domKit.css( this.$backImage , data.backImageStyle ) ;
	}

	if ( data.maskStyle && this.$mask ) {
		delete data.maskStyle.position ;	// Forbidden style
		Object.assign( this.maskStyle , data.maskStyle ) ;
		domKit.css( this.$mask , data.maskStyle ) ;
	}

	if ( data.class ) {
		data.class = commonUtils.toClassObject( data.class ) ;
		Object.assign( this.class , data.class ) ;
		domKit.class( this.$wrapper || this.$image , data.class , 's-' ) ;
	}
} ;



// Load/replace the gEntity backImage (data.backUrl)
// /!\ Not async ATM: how to get a "load" event on a background-image???
GEntity.prototype.updateBackImage = function( data ) {
	if ( this.usage === 'card' ) {
		this.$backImage.style.backgroundImage = 'url("' + this.dom.cleanUrl( data.backUrl ) + '")' ;
		//this.$image.onload = () => promise.resolve() ;
	}

	return Promise.resolved ;
} ;



// Load/replace the gEntity mask (data.maskUrl)
GEntity.prototype.updateMask = function( data ) {
	var promise = new Promise() ;

	if ( data.maskUrl.endsWith( '.svg' ) && this.usage === 'sprite' ) {
		console.warn( 'has mask!' ) ;

		// Always wipe any existing $mask element and pre-create the <svg> tag
		if ( this.$mask ) { this.$mask.remove() ; }

		this.$mask = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
		this.$mask.classList.add( 'sprite-mask' ) ;

		svgKit.load( this.dom.cleanUrl( data.maskUrl ) , {
			removeSvgStyle: true ,
			removeSize: true ,
			removeIds: true ,
			removeComments: true ,
			removeExoticNamespaces: true ,
			//removeDefaultStyles: true ,
			as: this.$mask
		} ).then( () => promise.resolve() ) ;

		this.$wrapper.append( this.$mask ) ;
		this.$wrapper.classList.add( 'has-mask' ) ;
	}
	else if ( this.$mask ) {
		this.$mask.remove() ;
		this.$wrapper.classList.remove( 'has-mask' ) ;
		promise.resolve() ;
	}

	return promise ;
} ;



// Update content (data.content), card-only
GEntity.prototype.updateContent = function( data ) {
	var content , $content ;

	if ( this.usage !== 'card' ) { return ; }

	for ( let contentName in data.content ) {
		content = data.content[ contentName ] ;
		$content = this.contents[ contentName ] ;

		if ( ! $content ) {
			$content = this.contents[ contentName ] = document.createElement( 'div' ) ;
			$content.classList.add( 'content-' + contentName ) ;
			this.$front.append( $content ) ;
		}

		$content.textContent = content ;
		$content.setAttribute( 'content' , content ) ;
	}
} ;



// Update pose (data.pose)
GEntity.prototype.updatePose = function( data ) {
	if ( typeof data.pose === 'string' ) {
		this.$wrapper.setAttribute( 'pose' , data.pose ) ;
		this.pose = data.pose ;
	}
	else {
		this.$wrapper.removeAttribute( 'pose' ) ;
		this.pose = null ;
	}
} ;



// ??? GEntity ??? Maybe move it back to Dom.js...
GEntity.prototype.createGEntityLocation = function( locationName ) {
	var $location ;

	if ( this.dom.gEntityLocations[ locationName ] ) { return ; }

	$location = this.dom.gEntityLocations[ locationName ] = document.createElement( 'div' ) ;
	$location.classList.add( 'g-entity-location' ) ;
	$location.classList.add( 'g-entity-location-' + locationName ) ;
	this.dom.$gfx.append( $location ) ;
} ;



GEntity.prototype.createCardMarkup = function( card ) {
	// .$wrapper is the placeholder, hover effects happen on it
	card.$card = document.createElement( 'div' ) ;
	card.$card.classList.add( 'card' ) ;
	card.$wrapper.append( card.$card ) ;

	card.$front = document.createElement( 'div' ) ;
	card.$front.classList.add( 'front' ) ;
	card.$card.append( card.$front ) ;

	card.$image = document.createElement( 'div' ) ;
	card.$image.classList.add( 'card-image' ) ;
	card.$front.append( card.$image ) ;

	card.$back = document.createElement( 'div' ) ;
	card.$back.classList.add( 'back' ) ;
	card.$card.append( card.$back ) ;

	card.$backImage = document.createElement( 'div' ) ;
	card.$backImage.classList.add( 'card-image' ) ;
	card.$back.append( card.$backImage ) ;
} ;
