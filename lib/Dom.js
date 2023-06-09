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



const GScene = require( './GScene.js' ) ;
const Camera = require( './Camera.js' ) ;
const TexturePack = require( './TexturePack.js' ) ;
const GEntity = require( './GEntity.js' ) ;
const BrowserGamepadHub = require( './controller/gamepad/BrowserGamepadHub.js' ) ;
const BrowserKeyboard = require( './controller/keyboard/BrowserKeyboard.js' ) ;
const Controller = require( './controller/Controller.js' ) ;
const commonUtils = require( './commonUtils.js' ) ;
const toolkit = require( './toolkit.js' ) ;

const Ngev = require( 'nextgen-events/lib/browser.js' ) ;
const LeanEvents = require( 'nextgen-events/lib/LeanEvents.js' ) ;
const Promise = require( 'seventh' ) ;
const domKit = require( 'dom-kit' ) ;
const svgKit = require( 'svg-kit' ) ;



function noop() {}



function Dom() {
	this.$body = document.querySelector( 'body' ) ;
	this.$spellcast = document.querySelector( 'spellcast' ) ;
	this.$theme = document.querySelector( '#theme' ) ;
	this.$gfx = document.querySelector( '#gfx' ) ;
	this.$sceneImage = document.querySelector( '.scene-image' ) ;
	this.$main = document.querySelector( 'main' ) ;
	this.$mainBuffer = document.querySelector( '#main-buffer' ) ;
	this.$altBuffer = document.querySelector( '#alt-buffer' ) ;
	this.$closeAltButton = document.querySelector( '#button-close-alt' ) ;
	this.$dialogWrapper = document.querySelector( '#dialog-wrapper' ) ;
	this.$hint = document.querySelector( '#hint' ) ;
	this.$lobby = document.querySelector( '#lobby' ) ;
	this.$clientStatus = this.$lobby.querySelector( '.client-status' ) ;
	this.$status = document.querySelector( '#status' ) ;
	this.$panel = document.querySelector( '#panel' ) ;
	this.$music = document.querySelector( '#music' ) ;
	this.$sound0 = document.querySelector( '#sound0' ) ;
	this.$sound1 = document.querySelector( '#sound1' ) ;
	this.$sound2 = document.querySelector( '#sound2' ) ;
	this.$sound3 = document.querySelector( '#sound3' ) ;

	this.controller = new Controller() ;
	this.gamepadHub = new BrowserGamepadHub( this.controller ) ;
	this.keyboard = new BrowserKeyboard( this.controller ) ;

	this.choices = [] ;

	this.newSegmentNeeded = null ;
	this.onSelect = null ;
	this.onLeave = null ;
	this.onEnter = null ;
	this.toMainBuffer() ;

	this.nextSoundChannel = 0 ;

	this.gScenes = {} ;

	// Event to dispatch to a GScene
	this.gSceneDispatch = {
		message: null ,
		choices: null ,
		textInput: null
	} ;

	// Move it to GScene?
	this.animations = {} ;

	this.themeData = null ;
	this.hintTimer = null ;
	this.sceneImageOnTimer = null ;
	this.onCommandSubmit = null ;

	// The number of UI loading in progress
	this.uiLoadingCount = 0 ;

	this.initEvents() ;
}

module.exports = Dom ;

Dom.prototype = Object.create( Ngev.prototype ) ;
Dom.prototype.constructor = Dom ;



// Require after, because of circular dep
const engineLib = require( './engineLib.js' ) ;
const exm = require( './exm.js' ) ;



Dom.cleanUrl = Dom.prototype.cleanUrl = function( url ) {
	if ( url[ 0 ] === '/' ) { return window.location.pathname + url.slice( 1 ) ; }
	return window.location.pathname + 'script/' + url ;
} ;



// Return a Promise for on load/error events
Dom.prototype.addScript = function( url ) {
	console.log( "Adding script: " , url ) ;
	return domKit.addJsScript( url , this.$spellcast ) ;
} ;



Dom.prototype.setTheme = function( themeConfig ) {
	this.$theme.setAttribute( 'href' , this.cleanUrl( themeConfig.url ) ) ;
	this.themeConfig = themeConfig ;
} ;



Dom.prototype.preload = function() {
	domKit.preload( [
		'icons/plugged.svg' ,
		'icons/plugging.svg' ,
		'icons/unplugged.svg' ,
		'icons/unreachable-plug.svg'
	] ) ;
} ;



Dom.prototype.initEvents = function() {
	this.$main.addEventListener( 'click' , () => this.emit( 'continue' ) , false ) ;

	this.$gfx.addEventListener( 'click' , event => {
		//console.warn( 'event' , event ) ;
		if ( event.target.classList.contains( 'scene-image' ) ) {
			this.toggleSceneImage() ;
		}
	} , false ) ;

	this.$dialogWrapper.addEventListener( 'click' , () => this.clearDialog() , false ) ;

	// Things that can get the .toggled class when clicked
	this.$lobby.addEventListener( 'click' , () => { this.$lobby.classList.toggle( 'toggled' ) ; } ) ;
	this.$status.addEventListener( 'click' , () => { this.$status.classList.toggle( 'toggled' ) ; } ) ;
	this.$panel.addEventListener( 'click' , () => { this.$panel.classList.toggle( 'toggled' ) ; } ) ;

	// Temp?
	this.gamepadHub.on( 'newGamepad' , gamepad => gamepad.poll() ) ;
} ;



Dom.prototype.setControls = function( config ) {
	this.controller.resetBindings() ;

	if ( config.keys ) {
		for ( let key in config.keys ) {
			for ( let value of config.keys[ key ] ) {
				this.controller.addKeyBinding( key , value ) ;
			}
		}
	}
} ;



Dom.prototype.toggleSceneImage = function() {
	if ( this.$gfx.classList.contains( 'toggled' ) ) { this.sceneImageOff() ; }
	else { this.sceneImageOn() ; }
} ;



Dom.prototype.sceneImageOn = function() {
	if ( this.sceneImageOnTimer !== null ) { clearTimeout( this.sceneImageOnTimer ) ; this.sceneImageOnTimer = null ; }

	this.$gfx.classList.add( 'toggled' ) ;
	this.$spellcast.classList.add( 'gfx-toggled' ) ;
	this.sceneImageOnTimer = setTimeout( this.sceneImageOff.bind( this ) , 8000 ) ;
} ;



Dom.prototype.sceneImageOff = function() {
	if ( this.sceneImageOnTimer !== null ) { clearTimeout( this.sceneImageOnTimer ) ; this.sceneImageOnTimer = null ; }

	this.$gfx.classList.remove( 'toggled' ) ;
	this.$spellcast.classList.remove( 'gfx-toggled' ) ;
} ;



// return true if switched
Dom.prototype.toMainBuffer = function() {
	if ( this.$activeBuffer === this.$mainBuffer ) { return ; }

	if ( this.$activeBuffer ) {
		// This is not defined at startup
		this.clearChoices() ;
		this.clearMessages() ;
		this.clearHint() ;
		this.clearHistory() ;
	}

	this.$activeBuffer = this.$mainBuffer ;
	this.$importantMessages = null ;
	this.$mainBuffer.classList.remove( 'inactive' ) ;
	this.$altBuffer.classList.add( 'inactive' ) ;
	this.$closeAltButton.classList.add( 'inactive' ) ;

	this.getSwitchedElements() ;

	return true ;
} ;



// return true if switched
Dom.prototype.toAltBuffer = function() {
	if ( this.$activeBuffer === this.$altBuffer ) { return ; }

	this.$activeBuffer = this.$altBuffer ;
	this.$importantMessages = this.$activeSegment ;
	this.$mainBuffer.classList.add( 'inactive' ) ;
	this.$altBuffer.classList.remove( 'inactive' ) ;
	this.$closeAltButton.classList.remove( 'inactive' ) ;

	this.getSwitchedElements() ;

	return true ;
} ;



// Get elements after a buffer switch
Dom.prototype.getSwitchedElements = function() {
	this.$history = this.$activeBuffer.querySelector( '.messages.history' ) ;
	this.$activeMessages = this.$activeBuffer.querySelector( '.messages.active' ) ;
	this.$choices = this.$activeBuffer.querySelector( '.choices' ) ;
	this.$chat = this.$activeBuffer.querySelector( '.chat' ) ;
	this.$chatForm = this.$chat.querySelector( '.chat-form' ) ;
	this.$chatInput = this.$chatForm.querySelector( '.chat-input' ) ;

	this.$activeSegment = this.$activeMessages.querySelector( 'segment:last-child' ) ;

	if ( ! this.$activeSegment ) { this.newSegment() ; }
	else { this.newSegmentOnContent() ; }
} ;



Dom.prototype.clientStatus = function( status ) {
	this.$clientStatus.setAttribute( 'data-status' , status ) ;
	//this.$clientStatus.setAttribute( 'alt' , status ) ;
	this.$clientStatus.setAttribute( 'title' , status ) ;
} ;



Dom.prototype.setMultiplayer = function( value , callback ) {
	callback = callback || noop ;

	if ( value || value === undefined ) {
		this.$spellcast.classList.add( 'multiplayer' ) ;
	}
	else {
		this.$spellcast.classList.remove( 'multiplayer' ) ;
	}

	callback() ;
} ;



Dom.prototype.clear = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$hint ) ;
	domKit.empty( this.$dialogWrapper ) ;
	domKit.empty( this.$activeMessages ) ;
	domKit.empty( this.$choices ) ;
	callback() ;
} ;



Dom.prototype.clearMessages = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$activeMessages ) ;
	callback() ;
} ;



Dom.prototype.clearHistory = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$history ) ;
	callback() ;
} ;



Dom.prototype.newSegment = function( type ) {
	var $segment ,
		isInterSegment = type === 'inter-segment' ;

	this.newSegmentNeeded = null ;

	//var $lastSegment = this.$activeSegment ;

	if ( isInterSegment ) {
		if ( this.$activeSegment && this.$activeSegment.tagName.toLowerCase() === 'inter-segment' ) {
			return ;
		}

		$segment = document.createElement( 'inter-segment' ) ;
	}
	else {
		$segment = document.createElement( 'segment' ) ;
	}

	if ( this.$activeSegment && ! this.$activeSegment.children.length ) {
		this.$activeSegment.remove() ;
	}

	this.$activeSegment = $segment ;
	this.$activeMessages.appendChild( $segment ) ;

	if ( ! isInterSegment ) { this.moveToHistory() ; }
} ;



Dom.prototype.moveToHistory = function() {
	var i , iMax , children , $replayButton ;

	children = Array.from( this.$activeMessages.children ) ;
	iMax = children.length - 2 ;

	while ( iMax >= 0 && children[ iMax ].tagName.toLowerCase() === 'inter-segment' ) {
		iMax -- ;
	}

	if ( iMax < 0 ) { return ; }

	for ( i = 0 ; i <= iMax ; i ++ ) {
		// Remove replay button
		$replayButton = children[ i ].querySelector( '.replay-button' ) ;
		if ( $replayButton ) { domKit.remove( $replayButton ) ; }

		this.$history.appendChild( children[ i ] ) ;
	}

	children[ iMax ].scrollIntoView( false ) ;
} ;




// Postpone new segment creation until new content
Dom.prototype.newSegmentOnContent = function( type ) {
	type = type || 'segment' ;
	this.newSegmentNeeded = type ;
} ;



Dom.prototype.addSelectedChoice = function( text ) {
	var $text = document.createElement( 'p' ) ;
	$text.classList.add( 'chosen' ) ;
	$text.textContent = text ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }

	this.$activeSegment.appendChild( $text ) ;
} ;



Dom.prototype.addMessage = function( text , options , callback ) {
	if ( this.gSceneDispatch.message?.addMessage ) {
		this.gSceneDispatch.message.addMessage( text , options ).then( callback ) ;
		return ;
	}

	var triggered = false ;
	callback = callback || noop ;

	// Transform markup to HTML markup
	text = toolkit.markup( text ) ;

	var triggerCallback = () => {
		if ( triggered ) { return ; }
		triggered = true ;

		if ( options.next ) {
			$text.scrollIntoView( false ) ;
			this.messageNext( options.next , callback ) ;
			return ;
		}

		callback() ;
	} ;


	var $text = document.createElement( 'p' ) ;
	$text.classList.add( 'text' ) ;

	if ( options.next ) { $text.classList.add( 'continue' ) ; }

	if ( options.class ) {
		domKit.class( $text , commonUtils.toClassObject( options.class ) , 's-' ) ;
	}

	if ( options.style ) {
		domKit.css( $text , options.style ) ;
	}

	// Because the text contains <span> tags
	//$text.textContent = text ;
	$text.innerHTML = text ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }

	this.$activeSegment.appendChild( $text ) ;

	if ( options.important && this.$importantMessages ) {
		// The message should be added to the main buffer too
		this.$importantMessages.appendChild( $text.cloneNode( true ) ) ;
	}

	// Slow-typing is not supported ATM
	//if ( options.slowTyping ) { return ; }

	triggerCallback() ;
} ;



Dom.prototype.messageNext = function( value , callback ) {
	var triggered = false ;

	var triggerCallback = () => {
		if ( triggered ) { return ; }
		triggered = true ;

		this.$spellcast.classList.remove( 'continue' ) ;
		callback() ;
	} ;

	this.$spellcast.classList.add( 'continue' ) ;
	this.once( 'continue' , triggerCallback ) ;

	if ( typeof value === 'number' && isFinite( value ) && value > 0 ) {
		setTimeout( triggerCallback , value * 1000 ) ;
	}
} ;



Dom.prototype.addSpeech = function( text , options , callback ) {
	var $button ;

	// Remove markup
	text = toolkit.stripMarkup( text ) ;

	if ( options.speechReplay ) {
		if ( options.speechOnly && this.newSegmentNeeded ) {
			// Since there is no attached text, we need to handle the segment thing...
			this.newSegment( this.newSegmentNeeded ) ;
		}

		$button = document.createElement( 'button' ) ;
		$button.classList.add( 'replay-button' ) ;
		$button.setAttribute( 'disabled' , true ) ;
		$button.textContent = '▶' ;

		this.$activeSegment.appendChild( $button ) ;
	}

	this.speech( text , options , () => {
		if ( options.speechReplay ) {
			$button.removeAttribute( 'disabled' ) ;

			$button.addEventListener( 'click' , () => {
				this.speech( text , options ) ;
			} ) ;
		}
		callback() ;
	} ) ;
} ;



Dom.prototype.speech = function( text , options , callback ) {
	if ( options.useService ) {
		this.restServiceSpeech( text , options , callback ) ;
	}
	else {
		this.nativeBrowserSpeech( text , options , callback ) ;
	}
} ;



Dom.prototype.restServiceSpeech = function( text , options , callback ) {
	var url = /speech/ ;

	url += "?text=" + encodeURIComponent( text ) ;
	url += "&lang=" + encodeURIComponent( options.speechLang || 'en' ) ;
	url += "&volume=" + encodeURIComponent( options.speechVolume !== undefined ? options.speechVolume : 1 ) ;
	url += "&rate=" + encodeURIComponent( options.speechRate !== undefined ? options.speechRate : 1 ) ;
	url += "&pitch=" + encodeURIComponent( options.speechPitch !== undefined ? options.speechPitch : 1 ) ;
	//url += "&gender=" + encodeURIComponent( options.speechGender || 'female' ) ;

	//console.log( "Speech REST service URL:" , url ) ;
	this.sound( { url } , callback ) ;
} ;



Dom.prototype.nativeBrowserSpeech = function( text , options , callback ) {
	var speechSynthesis = window.speechSynthesis ,
		message , voices ;

	if ( ! speechSynthesis ) {
		// Not supported by this browser
		callback() ;
		return ;
	}

	message = new SpeechSynthesisUtterance( text ) ;
	//voices = window.speechSynthesis.getVoices() ;
	//message.voice = voices[10]; // Note: some voices don't support altering params
	//message.text = text ;
	message.lang = options.speechLang || 'en-US' ;
	message.volume = options.speechVolume !== undefined ? options.speechVolume : 1 ;	// 0 to 1
	message.rate = options.speechRate !== undefined ? options.speechRate : 1 ;	// 0.1 to 10
	message.pitch = options.speechPitch !== undefined ? options.speechPitch : 1 ;	//0 to 2
	if ( options.speechVoice ) { message.voiceURI = options.speechVoice ; }

	message.onend = event => {
		console.log( 'Speech: finished in ' + event.elapsedTime + ' seconds.' ) ;
		callback() ;
	} ;

	speechSynthesis.speak( message ) ;
} ;



Dom.prototype.addIndicators = function( indicators , isStatus , callback ) {
	callback = callback || noop ;

	if ( isStatus ) {
		domKit.empty( this.$status ) ;

		if ( indicators.length ) {
			this.$status.classList.remove( 'empty' ) ;
		}
		else {
			this.$status.classList.add( 'empty' ) ;
			callback() ;
			return ;
		}
	}

	var $indicatorList = document.createElement( 'indicator-list' ) ;

	indicators.forEach( ( data ) => {
		var $indicator , $label , $image , $widget , $innerBar , $outerBar ;
		$indicator = document.createElement( 'indicator' ) ;
		//$indicator.classList.add( data.type ) ;

		$label = document.createElement( 'label' ) ;
		$label.classList.add( 'label' ) ;

		if ( data.image ) {
			$indicator.classList.add( 'has-image' ) ;
			$image = document.createElement( 'img' ) ;
			$image.classList.add( 'image' ) ;
			$image.setAttribute( 'src' , this.cleanUrl( data.image ) ) ;

			if ( data.label ) {
				$image.setAttribute( 'alt' , data.label ) ;
				$image.setAttribute( 'title' , data.label ) ;
			}

			$label.appendChild( $image ) ;
		}
		else {
			$label.textContent = data.label ;
		}

		$indicator.appendChild( $label ) ;

		$widget = document.createElement( 'widget' ) ;
		$widget.classList.add( 'widget' ) ;
		$widget.classList.add( data.type ) ;
		$widget.setAttribute( 'data-value' , data.value ) ;

		switch ( data.type ) {
			case 'hbar' :
				$outerBar = document.createElement( 'outer-bar' ) ;
				$widget.appendChild( $outerBar ) ;

				$innerBar = document.createElement( 'inner-bar' ) ;

				if ( isNaN( data.value ) ) { data.value = 0 ; }
				else if ( data.value > 100 ) { data.value = 100 ; }
				else if ( data.value < 0 ) { data.value = 0 ; }

				if ( typeof data.color === 'string' ) { $innerBar.style.backgroundColor = data.color ; }

				$innerBar.style.width = '' + data.value + '%' ;

				$outerBar.appendChild( $innerBar ) ;
				break ;

			case 'vbar' :
				$outerBar = document.createElement( 'outer-bar' ) ;
				$widget.appendChild( $outerBar ) ;

				$innerBar = document.createElement( 'inner-bar' ) ;

				if ( isNaN( data.value ) ) { data.value = 0 ; }
				else if ( data.value > 100 ) { data.value = 100 ; }
				else if ( data.value < 0 ) { data.value = 0 ; }

				if ( typeof data.color === 'string' ) { $innerBar.style.backgroundColor = data.color ; }

				$innerBar.style.height = '' + data.value + '%' ;

				$outerBar.appendChild( $innerBar ) ;
				break ;

			case 'text' :	// jshint ignore:line
			default :
				$widget.textContent = data.value ;
		}

		$indicator.appendChild( $widget ) ;
		$indicatorList.appendChild( $indicator ) ;
	} ) ;

	if ( isStatus ) {
		this.$status.appendChild( $indicatorList ) ;
	}
	else {
		if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
		this.$activeSegment.appendChild( $indicatorList ) ;
	}

	callback() ;
} ;



Dom.prototype.addPanel = function( panel , clear , callback ) {
	callback = callback || noop ;

	// Clear part
	if ( clear ) {
		domKit.empty( this.$panel ) ;

		if ( panel.length ) {
			this.$panel.classList.remove( 'empty' ) ;
		}
		else {
			this.$panel.classList.add( 'empty' ) ;
			callback() ;
			return ;
		}
	}
	else if ( panel.length ) {
		this.$panel.classList.remove( 'empty' ) ;
	}


	panel.forEach( ( data ) => {
		var $button , $image , buttonId = 'button-' + data.id ;

		// Do not create it if there is already a button with this ID
		if ( document.getElementById( buttonId ) ) { return ; }

		$button = document.createElement( 'item' ) ;
		$button.classList.add( 'button' ) ;
		$button.classList.add( 'disabled' ) ;	// Disabled by default
		$button.setAttribute( 'id' , buttonId ) ;

		if ( data.image ) {
			$button.classList.add( 'has-image' ) ;

			if ( data.image.endsWith( '.svg' ) ) {
				// Pre-create the <svg> tag
				//$image = document.createElement( 'svg' ) ;	// <-- it doesn't work, it should be created with a NS
				$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
				//$image.setAttribute( 'xmlns' , 'http://www.w3.org/2000/svg' ) ;
				$image.classList.add( 'svg' ) ;

				svgKit.load( this.cleanUrl( data.image ) , {
					removeSvgStyle: true ,
					removeSize: true ,
					removeIds: true ,
					removeComments: true ,
					removeExoticNamespaces: true ,
					//removeDefaultStyles: true ,
					colorClass: true ,
					as: $image
				} ) ;
			}
			else {
				$image = document.createElement( 'img' ) ;
				$image.setAttribute( 'src' , this.cleanUrl( data.image ) ) ;
			}

			$image.classList.add( 'icon' ) ;
			$image.classList.add( 'image' ) ;

			if ( data.label ) {
				$image.setAttribute( 'alt' , data.label ) ;
				$image.setAttribute( 'title' , data.label ) ;
			}

			$button.appendChild( $image ) ;
		}
		else {
			$button.textContent = data.label ;
		}

		this.$panel.appendChild( $button ) ;
	} ) ;

	callback() ;
} ;



// This is used when new choices replaces the previous scene choices
Dom.prototype.setChoices = async function( choices , undecidedNames , onSelect , options = {} ) {
	await this.clearChoices() ;
	await this.addChoices( choices , undecidedNames , onSelect , options ) ;
	return ;
} ;



// This is used when the scene update its choices details (selectedBy, ...)
// /!\ For instance, it is the same than .setChoices
Dom.prototype.updateChoices = Dom.prototype.setChoices ;



Dom.prototype.clearChoices = function() {
	if ( this.gSceneDispatch.choices?.clearChoices ) {
		return this.gSceneDispatch.choices.clearChoices() ;
	}

	var $uiButton ;

	// First, unassign all UI buttons
	this.choices.forEach( ( choice ) => {
		if ( ! choice.button ) { return ; }

		var buttonId = 'button-' + choice.button ;

		$uiButton = document.getElementById( buttonId ) ;

		if ( $uiButton ) {
			//console.warn( 'remove' , 'button-' + choice.button ) ;
			$uiButton.removeAttribute( 'data-select-index' ) ;
			$uiButton.classList.add( 'disabled' ) ;
			$uiButton.removeEventListener( 'click' , this.onSelect ) ;
			$uiButton.removeEventListener( 'mouseleave' , this.onLeave ) ;
			$uiButton.removeEventListener( 'mouseenter' , this.onEnter ) ;
		}
	} ) ;

	domKit.empty( this.$choices ) ;

	// Reset
	this.choices.length = 0 ;
	this.onSelect = null ;
	this.onLeave = null ;
	this.onEnter = null ;
} ;



Dom.prototype.addChoices = async function( choices , undecidedNames , onSelect , options = {} ) {
	if ( this.gSceneDispatch.choices?.addChoices ) {
		return this.gSceneDispatch.choices.addChoices( choices , undecidedNames , onSelect , options ) ;
	}

	if ( this.uiLoadingCount ) {
		await this.waitFor( 'uiLoaded' ) ;
	}

	if ( options.nextStyle.format === 'auto' ) {
		if ( ! options.multiRoles && choices.length <= 3 ) {
			options.nextStyle.format = 'inline' ;
		}
		else if ( choices.length > 8 ) {
			options.nextStyle.format = 'smallList' ;
		}
		else {
			options.nextStyle.format = 'list' ;
		}
	}

	switch ( options.nextStyle.format ) {
		case 'inline' :
		case 'smallInline' :
		case 'list' :
		case 'smallList' :
			this.$choices.setAttribute( 'data-choice-style' , options.nextStyle.format ) ;
			break ;
		case 'table' :
			this.$choices.setAttribute( 'data-choice-style' , options.nextStyle.format ) ;
			this.$choices.classList.add( 'columns-' + this.getChoiceColumnsCount( choices ) ) ;
			break ;
		default :
			// Default to list
			this.$choices.setAttribute( 'data-choice-style' , 'list' ) ;
	}

	var groupBreak = false ;
	var choicesFragment = document.createDocumentFragment() ;
	var $group = document.createElement( 'group' ) ;

	this.createChoiceEventHandlers( onSelect ) ;

	choices.forEach( ( choice ) => {
		var $uiButton ;

		// Add the choice to the list
		this.choices.push( choice ) ;

		if (
			choice.button &&
			( $uiButton = document.getElementById( 'button-' + choice.button ) ) &&
			! $uiButton.getAttribute( 'data-select-index' ) &&
			! $uiButton.classList.contains( 'inactive' )
		) {
			// groupBreak remainder
			if ( choice.groupBreak ) { groupBreak = true ; }

			// Assign to it the select index
			$uiButton.setAttribute( 'data-select-index' , choice.index ) ;
			$uiButton.classList.remove( 'disabled' ) ;

			// Add the click event to the next-item
			$uiButton.addEventListener( 'click' , this.onSelect ) ;

			if ( choice.label ) {
				$uiButton.setAttribute( 'data-button-hint' , choice.label ) ;
				$uiButton.addEventListener( 'mouseleave' , this.onLeave ) ;
				$uiButton.addEventListener( 'mouseenter' , this.onEnter ) ;
			}

			return ;
		}

		var $button = document.createElement( 'choice' ) ;
		$button.classList.add( 'choice' , choice.type ) ;
		$button.setAttribute( 'data-select-index' , choice.index ) ;
		$button.classList.remove( 'disabled' ) ;
		//$button.setAttribute( 'data-is-ordered' , !! choice.orderedList ) ;

		if ( choice.class ) {
			domKit.class( $button , commonUtils.toClassObject( choice.class ) , 's-' ) ;
		}

		if ( choice.style ) {
			domKit.css( $button , choice.style ) ;
		}

		if ( choice.image ) {
			$button.classList.add( 'has-image' ) ;
			var $image = document.createElement( 'img' ) ;
			$image.classList.add( 'image' ) ;
			$image.setAttribute( 'src' , this.cleanUrl( choice.image ) ) ;
			$button.appendChild( $image ) ;
		}

		var $label = document.createElement( 'span' ) ;
		$label.classList.add( 'label' ) ;
		$label.textContent = choice.label ;
		$button.appendChild( $label ) ;
		//$button.textContent = choice.label ;

		if ( choice.selectedBy && choice.selectedBy.length ) {
			var $selectedBy = document.createElement( 'span' ) ;
			$selectedBy.classList.add( 'italic' , 'brightBlack' ) ;

			// Add an extra space to separate from the label text
			$selectedBy.textContent = ' ' + choice.selectedBy.join( ', ' ) ;
			$button.appendChild( $selectedBy ) ;
		}

		// Add the click event to the next-item
		$button.addEventListener( 'click' , this.onSelect ) ;

		if ( choice.groupBreak || groupBreak ) {
			// Add current group to the fragment, and create a new group
			groupBreak = false ;
			choicesFragment.appendChild( $group ) ;
			$group = document.createElement( 'group' ) ;
		}

		$group.appendChild( $button ) ;
	} ) ;

	// Add the pending group to the fragment
	choicesFragment.appendChild( $group ) ;

	this.$choices.appendChild( choicesFragment ) ;

	if ( undecidedNames && undecidedNames.length ) {
		var $unassignedUsers = document.createElement( 'p' ) ;
		$unassignedUsers.classList.add( 'unassigned-users' ) ;
		$unassignedUsers.textContent = undecidedNames.join( ', ' ) ;
		this.$choices.appendChild( $unassignedUsers ) ;
	}

	if ( typeof options.timeout === 'number' ) { this.choiceTimeout( options.timeout ) ; }
} ;



Dom.prototype.getChoiceColumnsCount = function( choices ) {
	var count = 0 , maxCount = 0 ;

	choices.forEach( ( choice ) => {
		if ( choice.groupBreak ) {
			if ( count > maxCount ) { maxCount = count ; }
			count = 0 ;
		}

		count ++ ;
	} ) ;

	if ( count > maxCount ) { maxCount = count ; }

	return maxCount ;
} ;



Dom.prototype.choiceTimeout = function( timeout ) {
	var startTime = Date.now() , $timer , timer ;

	$timer = document.createElement( 'p' ) ;
	$timer.classList.add( 'timer' ) ;
	$timer.textContent = Math.round( timeout / 1000 ) ;

	this.$choices.appendChild( $timer ) ;

	timer = setInterval( () => {
		// If no parentNode, the element has been removed...
		if ( ! $timer.parentNode ) { clearInterval( timer ) ; return ; }

		$timer.textContent = Math.round( ( timeout + startTime - Date.now() ) / 1000 ) ;
	} , 1000 ) ;
} ;



Dom.prototype.createChoiceEventHandlers = function( onSelect ) {
	this.onSelect = ( event ) => {
		var $element = event.currentTarget ;
		var index = $element.getAttribute( 'data-select-index' ) ;
		if ( ! index ) { return ; }
		index = parseInt( index , 10 ) ;
		onSelect( index ) ;
	} ;

	this.onLeave = ( event ) => {
		this.clearHint() ;
		//event.stopPropagation() ; // useless for mouseleave events
	} ;

	this.onEnter = ( event ) => {
		var $element = event.currentTarget ;
		var hint = $element.getAttribute( 'data-button-hint' ) ;
		if ( ! hint ) { return ; }
		this.setHint( hint , { active: true } ) ;
		//event.stopPropagation() ;	// useless for mouseenter events
	} ;
} ;



Dom.prototype.textInputDisabled = function( options ) {
	if ( this.gSceneDispatch.textInput?.textInputDisabled ) {
		this.gSceneDispatch.textInput.textInputDisabled( options ) ;
		return ;
	}

	var $form = document.createElement( 'form' ) ,
		$label = document.createElement( 'label' ) ,
		$input = document.createElement( 'input' ) ;

	$label.textContent = options.label ;

	$input.setAttribute( 'placeholder' , options.placeholder ) ;
	$input.setAttribute( 'disabled' , true ) ;
	$input.setAttribute( 'type' , 'text' ) ;
	$input.classList.add( 'text-input' ) ;

	$form.appendChild( $label ) ;
	$form.appendChild( $input ) ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
	this.$activeSegment.appendChild( $form ) ;
} ;



Dom.prototype.textInput = function( options , callback ) {
	if ( this.gSceneDispatch.textInput?.textInput ) {
		this.gSceneDispatch.textInput.textInput( options ).then( callback ) ;
		return ;
	}

	var $form = document.createElement( 'form' ) ,
		$label = document.createElement( 'label' ) ,
		$input = document.createElement( 'input' ) ;

	// HINT: remove this class?
	$label.classList.add( 'text' ) ;
	$label.textContent = options.label ;

	$input.setAttribute( 'type' , 'text' ) ;
	$input.classList.add( 'text-input' ) ;

	$form.appendChild( $label ) ;
	$form.appendChild( $input ) ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
	this.$activeSegment.appendChild( $form ) ;

	$input.focus() ;

	var finalize = function( event ) {
		event.preventDefault() ;

		$form.removeEventListener( 'submit' , finalize ) ;
		$input.setAttribute( 'disabled' , true ) ;
		callback( $input.value ) ;
	} ;

	$form.addEventListener( 'submit' , finalize ) ;
} ;



Dom.prototype.enableCommand = function( callback ) {
	if ( ! this.onCommandSubmit ) {
		this.onCommandSubmit = ( event ) => {
			event.preventDefault() ;
			callback( this.$chatInput.value ) ;
			this.$chatInput.value = '' ;
		} ;

		this.$chatForm.addEventListener( 'submit' , this.onCommandSubmit ) ;

		this.$mainBuffer.classList.remove( 'chat-hidden' ) ;
		this.$chat.classList.remove( 'hidden' ) ;
		this.$chatInput.removeAttribute( 'disabled' ) ;
	}
} ;



Dom.prototype.disableCommand = function() {
	this.$chatForm.removeEventListener( 'submit' , this.onCommandSubmit ) ;
	this.onCommandSubmit = null ;

	this.$mainBuffer.classList.add( 'chat-hidden' ) ;
	this.$chat.classList.add( 'hidden' ) ;
	this.$chatInput.setAttribute( 'disabled' , true ) ;
} ;



Dom.prototype.clearHint = function() {
	if ( this.hintTimer !== null ) { clearTimeout( this.hintTimer ) ; this.hintTimer = null ; }

	//domKit.empty( this.$hint ) ;
	this.$hint.classList.add( 'empty' ) ;

	this.hintTimer = setTimeout( () => {
		domKit.empty( this.$hint ) ;
	} , 3000 ) ;
} ;



Dom.prototype.setHint = function( text , classes ) {
	if ( this.hintTimer !== null ) { clearTimeout( this.hintTimer ) ; this.hintTimer = null ; }

	//this.clearHint() ;
	//domKit.empty( this.$hint ) ;

	if ( this.$hint.textContent ) {
		this.$hint.classList.add( 'empty' ) ;
		this.hintTimer = setTimeout( () => {
			domKit.empty( this.$hint ) ;
			this.setHint( text , classes ) ;
		} , 300 ) ;
		return ;
	}

	this.$hint.textContent = text ;
	this.$hint.classList.remove( 'empty' ) ;

	domKit.class( this.$hint , {
		passive: !! classes.passive ,
		active: !! classes.active
	} ) ;

	this.hintTimer = setTimeout( this.clearHint.bind( this ) , 3000 ) ;
} ;



// /!\ DEPRECATED??? /!\
Dom.prototype.setBigHint = function( text , classes ) {
	var $hint = document.createElement( 'h2' ) ;
	$hint.textContent = text ;
	if ( classes ) { domKit.class( $hint , classes ) ; }
	domKit.empty( this.$hint ) ;
	this.$hint.appendChild( $hint ) ;
} ;



Dom.prototype.clearDialog = function() {
	this.$dialogWrapper.classList.add( 'empty' ) ;
	this.$dialogWrapper.classList.remove( 'modal' ) ;

	/*
		Try to remove children of this.$dialogWrapper after an eventual transition.
		Start a race with a transition start and setTimeout, the first to win inhibit the other.
	*/
	var raceWon = false ;

	var onStart = () => {
		this.$dialogWrapper.removeEventListener( 'transitionstart' , onStart ) ;
		if ( raceWon ) { return ; }
		raceWon = true ;
		this.$dialogWrapper.addEventListener( 'transitionend' , onEnd ) ;
	} ;

	var onEnd = () => {
		this.$dialogWrapper.removeEventListener( 'transitionend' , onEnd ) ;
		domKit.empty( this.$dialogWrapper ) ;
	} ;

	this.$dialogWrapper.addEventListener( 'transitionstart' , onStart ) ;

	setTimeout( () => {
		if ( raceWon ) { return ; }
		raceWon = true ;
		domKit.empty( this.$dialogWrapper ) ;
	} , 10 ) ;
} ;



/*
	Common options:
	* modal: create a modal dialog
	* title: specify a dialog title
	* big: dialog for small text written in BIG font
	* fun: use a fun font
	* alert: dialog for alerts, critical stuffs...
*/
Dom.prototype.setDialog = function( text , options , callback ) {
	options = options || {} ;
	callback = callback || noop ;

	if ( options.contentDelay && ! this.newSegmentNeeded ) {
		// The contentDelay options wait depending on the content size before actually trigger the dialog box.
		// It is used to let the user read the content before being interupted by the dialog box.
		delete options.contentDelay ;
		var contentLength = this.$activeSegment.innerHTML.replace( /<[^>]+>|&[a-z]+;/g , '' ).length ;
		var delay = Math.min( contentLength * 10 , 5000 ) ;
		console.warn( 'contentLength/delay' , contentLength , delay ) ;
		setTimeout( this.setDialog.bind( this , text , options , callback ) , delay ) ;
		return ;
	}

	var $dialog = document.createElement( 'div' ) ;
	$dialog.classList.add( 'dialog' ) ;

	if ( options.title ) {
		var $title = document.createElement( 'h2' ) ;
		$title.classList.add( 'title' ) ;
		$title.textContent = options.title ;
		$dialog.appendChild( $title ) ;
	}

	var $message = document.createElement( 'div' ) ;
	$message.classList.add( 'message' ) ;
	$message.textContent = text ;
	$dialog.appendChild( $message ) ;

	if ( options.slow ) { this.$dialogWrapper.classList.add( 'slow' ) ; }
	else { this.$dialogWrapper.classList.remove( 'slow' ) ; }

	if ( options.big ) { $dialog.classList.add( 'big' ) ; }
	if ( options.fun ) { $dialog.classList.add( 'fun' ) ; }
	if ( options.alert ) { $dialog.classList.add( 'alert' ) ; }

	if ( options.modal ) {
		$dialog.classList.add( 'modal' ) ;
		this.$dialogWrapper.classList.add( 'modal' ) ;
	}
	else {
		this.$dialogWrapper.classList.remove( 'modal' ) ;
	}

	domKit.empty( this.$dialogWrapper ) ;
	this.$dialogWrapper.appendChild( $dialog ) ;
	this.$dialogWrapper.classList.remove( 'empty' ) ;

	callback() ;
} ;



/* GFX */



Dom.prototype.setSceneImage = function( data ) {
	var cleaned = false ;

	var $oldSceneImage = this.$sceneImage ;

	this.$sceneImage = document.createElement( 'div' ) ;
	this.$sceneImage.classList.add( 'scene-image' ) ;

	if ( data.url ) {
		this.$sceneImage.style.backgroundImage = 'url("' + this.cleanUrl( data.url ) + '")' ;
	}

	if ( data.origin && typeof data.origin === 'string' ) {
		this.$sceneImage.style.backgroundPosition = data.origin ;
	}

	var cleanUp = () => {
		if ( cleaned ) { return ; }
		cleaned = true ;
		$oldSceneImage.remove() ;
	} ;

	if ( $oldSceneImage ) {
		$oldSceneImage.addEventListener( 'transitionend' , cleanUp , false ) ;
		this.$gfx.insertBefore( this.$sceneImage , $oldSceneImage ) ;
		$oldSceneImage.classList.add( 'hidden' ) ;

		// For some very obscure reason, sometime we don't get the 'transitionend' event,
		// Maybe no transition happend at all... So we need to clean up anyway after a while...
		setTimeout( cleanUp , 2000 ) ;
	}
	else {
		this.$gfx.insertBefore( this.$sceneImage , this.$gfx.firstChild || null ) ;
	}

	switch ( data.position ) {
		case 'left' :
			this.$spellcast.setAttribute( 'data-image-position' , 'left' ) ;
			break ;
		case 'right' :
		default :
			this.$spellcast.setAttribute( 'data-image-position' , 'right' ) ;
			break ;
	}
} ;



Dom.prototype.createGScene = function( gSceneId , data ) {
	if ( this.gScenes[ gSceneId ] ) { this.clearGScene( gSceneId ) ; }

	console.warn( "createGScene:" , data.engineId , engineLib.lib , engineLib.lib[ data.engineId ] && engineLib.lib[ data.engineId ].GScene ) ;
	var GSceneClass = ( engineLib.lib[ data.engineId ] && engineLib.lib[ data.engineId ].GScene ) || GScene ;
	var gScene = this.gScenes[ gSceneId ] = new GSceneClass( this , data ) ;

	if ( data.catch ) { this.updateGSceneDispatch( gScene , data.catch ) ; }

	return gScene.update( data , false , true ) ;
} ;



Dom.prototype.updateGScene = function( gSceneId , data , awaiting ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	if ( data.catch ) { this.updateGSceneDispatch( gScene , data.catch ) ; }

	return gScene.update( data , awaiting ) ;
} ;



Dom.prototype.clearGScene = function( gSceneId ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return ;
	}

	// Don't dispatch anymore to the GScene to be removed
	this.removeGSceneDispatch( gScene ) ;

	gScene.$gscene.remove() ;
	delete this.gScenes[ gSceneId ] ;
} ;



// Configure GScene event dispatching
Dom.prototype.updateGSceneDispatch = function( gScene , list ) {
	if ( ! list || typeof list !== 'object' ) { return ; }

	for ( let key in list ) {
		if ( this.gSceneDispatch[ key ] === undefined ) { continue ; }
		this.gSceneDispatch[ key ] = list[ key ] ? gScene : null ;
	}
} ;



// Don't dispatch anymore to the provided GScene
Dom.prototype.removeGSceneDispatch = function( gScene ) {
	for ( let key in this.gSceneDispatch ) {
		if ( this.gSceneDispatch[ key ] === gScene ) { this.gSceneDispatch[ key ] = null ; }
	}
} ;



Dom.prototype.updateCamera = function( gSceneId , data , awaiting = false ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	return gScene.globalCamera.update( data , awaiting ) ;
} ;



Dom.prototype.defineTexturePack = function( gSceneId , textureUid , data ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	gScene.texturePacks[ textureUid ] = new TexturePack( data ) ;
	console.warn( "All texture packs so far for gScene:" , gSceneId , gScene.texturePacks ) ;
} ;



Dom.prototype.createGEntity = function( gSceneId , gEntityId , data , awaiting = false ) {
	var GEntityClass , engine , gEntity ,
		gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	if ( gScene.hasGEntity( gEntityId ) ) { gScene.removeGEntity( gEntityId ) ; }
	data.id = gEntityId ;	// Should be the same (come from server), but ensure it

	console.warn( "createGEntity:" , gScene.engineId , engineLib.lib , engineLib.lib[ gScene.engineId ] && engineLib.lib[ gScene.engineId ].GEntity ) ;
	engine = engineLib.lib[ gScene.engineId ] ;

	if ( engine ) {
		GEntityClass = ( engine.perUsageGEntity && engine.perUsageGEntity[ data.usage ] ) || engine.GEntity || GEntity ;
	}
	else {
		GEntityClass = GEntity ;
	}

	gEntity = new GEntityClass( this , gScene , data ) ;
	return gEntity.update( data , awaiting , true ) ;
} ;



/*
var cardAutoIncrement = 0 ;

Dom.prototype.createCard = function( gEntityId , data ) {
	var card = this.cards[ gEntityId ] = this.createGEntity( {
		actionCallback: data.actionCallback ,
		action: null ,
		type: 'card' ,
		location: 'showing' ,
		$locationSlot: null ,
		pose: null ,
		order: cardAutoIncrement ++ ,	// used as flex's order
		class: data.class ,
		style: {} ,
		imageStyle: {} ,
		animation: null ,
		contents: {}
	} ) ;

	this.createCardMarkup( card ) ;
} ;
*/



Dom.prototype.updateGEntity = function( gSceneId , gEntityId , data , awaiting = false ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	var gEntity = gScene.getGEntity( gEntityId ) ;

	if ( ! gEntity ) {
		console.warn( 'Unknown GEntity id: ' , gEntityId ) ;
		return Promise.resolved ;
	}

	return gEntity.update( data , awaiting ) ;
} ;



/*
Dom.prototype.animateSprite = function( spriteId , animationId ) {
	if ( ! this.sprites[ spriteId ] ) {
		console.warn( 'Unknown sprite id: ' , spriteId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.sprites[ spriteId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateVg = function( gEntityId , animationId ) {
	if ( ! this.vgs[ gEntityId ] ) {
		console.warn( 'Unknown VG id: ' , gEntityId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.vgs[ gEntityId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateMarker = function( markerId , animationId ) {
	if ( ! this.markers[ markerId ] ) {
		console.warn( 'Unknown marker id: ' , markerId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.markers[ markerId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateCard = function( cardId , animationId ) {
	if ( ! this.cards[ cardId ] ) {
		console.warn( 'Unknown card id: ' , cardId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.cards[ cardId ] , this.animations[ animationId ] ) ;
} ;
*/


Dom.prototype.clearGEntity = function( gSceneId , gEntityId ) {
	var gScene = this.gScenes[ gSceneId ] ;

	if ( ! gScene ) {
		console.warn( 'Unknown GScene id: ' , gSceneId ) ;
		return Promise.resolved ;
	}

	gScene.removeGEntity( gEntityId ) ;
} ;



// OUT OF DATE! SHOULD BE FIXED!
Dom.prototype.animateGEntity = async function( gEntity , animation ) {
	var frame , frameIndex = 0 ;

	gEntity.animation = animation.id ;

	// What should be done if an animation is already running???

	//console.warn( "Animation: " , animation ) ;

	// If there is no frames, quit now
	if ( ! Array.isArray( animation.frames ) || ! animation.frames.length ) { return ; }

	for ( frame of animation.frames ) {
		// Update the gEntity
		await this.updateGEntity( gEntity , frame ) ;
		await Promise.resolveTimeout( frame.duration * 1000 ) ;
	}

	// Restore something here?
	gEntity.animation = null ;
} ;



Dom.prototype.defineAnimation = function( id , data ) {
	data.id = id ;
	this.animations[ id ] = data ;
} ;



/* Dice Roller */



Dom.prototype.diceRollerDisabled = function( data ) {
	// TODO
} ;



Dom.prototype.diceRoller = async function( data ) {
	var submitData , engine , diceRoller ,
		gSceneId = data.gScene || 'default' ,
		gScene = this.gScenes[ gSceneId ] ;

	console.warn( "DOM diceRoller()" , data , gScene , engineLib.lib[ gScene?.engineId ] ) ;
	if ( ! gScene ) { return { unsupported: true } ; }
	engine = engineLib.lib[ gScene.engineId ] ;
	if ( ! engine || ! engine.DiceRoller ) { return { unsupported: true } ; }

	try {
		diceRoller = new engine.DiceRoller( gScene , data ) ;
		diceRoller.init() ;
		submitData = await diceRoller.roll() ;
	}
	catch ( error ) {
		console.warn( "DOM diceRoller() error:" , error ) ;
		return { unsupported: true } ;
	}

	return submitData ;
} ;



/* SFX */



// maybe callback?
Dom.prototype.sound = function( data , callback ) {
	var endHandler ,
		$element = this[ '$sound' + this.nextSoundChannel ] ;

	console.warn( '$sound' + this.nextSoundChannel , data , $element ) ;
	this.nextSoundChannel = ( this.nextSoundChannel + 1 ) % 4 ;

	$element.setAttribute( 'src' , this.cleanUrl( data.url ) ) ;
	$element.play() ;

	if ( callback ) {
		endHandler = () => {
			$element.removeEventListener( 'ended' , endHandler ) ;
			callback() ;
		} ;

		$element.addEventListener( 'ended' , endHandler ) ;
	}
} ;



Dom.prototype.music = function( data ) {
	var oldSrc = this.$music.getAttribute( 'src' ) ;

	if ( data.url ) {
		data.url = this.cleanUrl( data.url ) ;

		if ( oldSrc ) {
			if ( oldSrc !== data.url ) {
				soundFadeOut( this.$music , () => {
					this.$music.setAttribute( 'src' , data.url ) ;
					this.$music.play() ;
					soundFadeIn( this.$music ) ;
				} ) ;
			}
			else if ( this.$music.ended ) {
				// We are receiving a music event for the same last music url,
				// but last playback ended, so play it again.
				this.$music.play() ;
			}
		}
		else {
			this.$music.volume = 0 ;
			this.$music.setAttribute( 'src' , data.url ) ;
			this.$music.play() ;
			soundFadeIn( this.$music ) ;
		}
	}
	else if ( oldSrc ) {
		soundFadeOut( this.$music , () => {
			this.$music.removeAttribute( 'src' ) ;
		} ) ;
	}
} ;



var SOUND_FADE_TIMEOUT = 10 ;
var SOUND_FADE_VALUE = 0.01 ;



function soundFadeIn( $element , callback ) {
	if ( $element.__fadeTimer ) { clearTimeout( $element.__fadeTimer ) ; $element.__fadeTimer = null ; }

	if ( $element.volume >= 1 ) {
		if ( callback ) { callback() ; }
		return ;
	}

	$element.volume = Math.min( 1 , $element.volume + SOUND_FADE_VALUE ) ;
	$element.__fadeTimer = setTimeout( soundFadeIn.bind( undefined , $element , callback ) , SOUND_FADE_TIMEOUT ) ;
}



function soundFadeOut( $element , callback ) {
	if ( $element.__fadeTimer ) { clearTimeout( $element.__fadeTimer ) ; $element.__fadeTimer = null ; }

	if ( $element.volume <= 0 ) {
		if ( callback ) { callback() ; }
		return ;
	}

	$element.volume = Math.max( 0 , $element.volume - SOUND_FADE_VALUE ) ;
	$element.__fadeTimer = setTimeout( soundFadeOut.bind( undefined , $element , callback ) , SOUND_FADE_TIMEOUT ) ;
}

