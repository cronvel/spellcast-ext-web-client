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



const Dom = require( './Dom.js' ) ;

const Promise = require( 'seventh' ) ;
const Ngev = require( 'nextgen-events/lib/browser.js' ) ;
//const treeExtend = require( 'tree-kit/lib/extend.js' ) ;
//const treeOps = require( 'kung-fig/lib/treeOps.js' ) ;



function EventDispatcher( bus , client ) {
	console.log( Array.from( arguments ) ) ;	// eslint-disable-line

	this.bus = bus ;
	this.client = client ;
	this.user = null ;
	this.users = null ;
	this.roles = null ;
	this.roleId = null ;
	this.config = null ;
	this.inGame = false ;
	this.nexts = null ;
	this.afterNext = false ;
	this.afterNextTriggered = false ;
	this.afterLeave = false ;
	this.hasNewContent = false ;
	this.dom = new Dom() ;
	this.ended = false ;

	this.client.once( 'connecting' , EventDispatcher.clientConnecting.bind( this ) ) ;
	this.client.once( 'open' , EventDispatcher.clientOpen.bind( this ) ) ;
	this.client.once( 'close' , EventDispatcher.clientClose.bind( this ) ) ;
	this.client.on( 'error' , EventDispatcher.clientError.bind( this ) ) ;

	this.commandConfig( { enabled: true } ) ;

	this.dom.preload() ;
}

module.exports = EventDispatcher ;

EventDispatcher.prototype = Object.create( Ngev.prototype ) ;
EventDispatcher.prototype.constructor = EventDispatcher ;



// Require after, because of circular dep
const exm = require( './exm.js' ) ;



function arrayGetById( id ) { return this.find( ( e ) => { return e.id === id ; } ) ; }



// 'open' event on client
EventDispatcher.prototype.initBus = function() {
	this.bus.on( 'clientConfig' , EventDispatcher.clientConfig.bind( this ) , { async: true } ) ;
	this.bus.on( 'controls' , EventDispatcher.controls.bind( this ) ) ;
	this.bus.on( 'user' , EventDispatcher.user.bind( this ) ) ;
	this.bus.on( 'userList' , EventDispatcher.userList.bind( this ) ) ;
	this.bus.on( 'roleList' , EventDispatcher.roleList.bind( this ) ) ;

	//this.bus.on( 'coreMessage' , EventDispatcher.coreMessage.bind( this ) ) ;
	//this.bus.on( 'errorMessage' , EventDispatcher.errorMessage.bind( this ) ) ;
	this.bus.on( 'extOutput' , EventDispatcher.extOutput.bind( this ) ) ;
	this.bus.on( 'extErrorOutput' , EventDispatcher.extErrorOutput.bind( this ) ) ;

	this.bus.on( 'message' , EventDispatcher.message.bind( this ) , { async: true } ) ;
	this.bus.on( 'indicators' , EventDispatcher.indicators.bind( this ) ) ;
	this.bus.on( 'status' , EventDispatcher.status.bind( this ) ) ;
	this.bus.on( 'panel' , EventDispatcher.panel.bind( this ) ) ;

	this.bus.on( 'theme' , EventDispatcher.theme.bind( this ) ) ;
	this.bus.on( 'image' , EventDispatcher.image.bind( this ) ) ;
	this.bus.on( 'sound' , EventDispatcher.sound.bind( this ) ) ;
	this.bus.on( 'music' , EventDispatcher.music.bind( this ) ) ;

	this.bus.on( 'createGScene' , EventDispatcher.createGScene.bind( this ) ) ;
	this.bus.on( 'updateGScene' , EventDispatcher.updateGScene.bind( this ) , { async: true } ) ;
	this.bus.on( 'clearGScene' , EventDispatcher.clearGScene.bind( this ) ) ;

	this.bus.on( 'camera' , EventDispatcher.camera.bind( this ) , { async: true } ) ;

	this.bus.on( 'fontPack' , EventDispatcher.fontPack.bind( this ) , { async: true } ) ;
	this.bus.on( 'texturePack' , EventDispatcher.texturePack.bind( this ) , { async: true } ) ;

	this.bus.on( 'createGEntity' , EventDispatcher.createGEntity.bind( this ) , { async: true } ) ;
	this.bus.on( 'updateGEntity' , EventDispatcher.updateGEntity.bind( this ) , { async: true } ) ;
	this.bus.on( 'clearGEntity' , EventDispatcher.clearGEntity.bind( this ) ) ;
	this.bus.on( 'animateGEntity' , EventDispatcher.animateGEntity.bind( this ) , { async: true } ) ;

	this.bus.on( 'defineAnimation' , EventDispatcher.defineAnimation.bind( this ) ) ;

	this.bus.on( 'enterScene' , EventDispatcher.enterScene.bind( this ) ) ;
	this.bus.on( 'leaveScene' , EventDispatcher.leaveScene.bind( this ) ) ;
	this.bus.on( 'nextList' , EventDispatcher.nextList.bind( this ) ) ;
	this.bus.on( 'nextTriggered' , EventDispatcher.nextTriggered.bind( this ) ) ;

	this.bus.on( 'textInput' , EventDispatcher.textInput.bind( this ) ) ;
	this.bus.on( 'commandConfig' , EventDispatcher.prototype.commandConfig.bind( this ) ) ;

	//this.bus.on( 'splitRoles' , EventDispatcher.splitRoles.bind( this ) ) ;
	this.bus.on( 'rejoinRoles' , EventDispatcher.rejoinRoles.bind( this ) ) ;

	this.bus.on( 'pause' , EventDispatcher.pause.bind( this ) ) ;
	this.bus.on( 'unpause' , EventDispatcher.unpause.bind( this ) ) ;

	this.bus.on( 'wait' , EventDispatcher.wait.bind( this ) ) ;
	this.bus.on( 'end' , EventDispatcher.end.bind( this ) , { async: true } ) ;

	this.bus.on( 'diceRoller' , EventDispatcher.diceRoller.bind( this ) ) ;

	this.bus.on( 'custom' , EventDispatcher.custom.bind( this ) ) ;

	this.bus.on( 'exit' , EventDispatcher.exit.bind( this ) , { async: true } ) ;

	this.bus.emit( 'ready' ) ;

	this.defineStates( 'end' ) ;
} ;



EventDispatcher.clientConnecting = function() {
	console.log( 'Connecting!' ) ;
	this.dom.clientStatus( 'connecting' ) ;
} ;



EventDispatcher.clientOpen = function() {
	console.log( 'Connected!' ) ;
	this.dom.clientStatus( 'connected' ) ;
	this.initBus() ;

	/*
	this.dom.setDialog( 'Yo!' , { modal: true , big: true , fun: true , slow: true } ) ;
	setTimeout( () => {
		this.dom.setDialog( 'Yo2!' , { modal: true , big: true , fun: true , slow: true } ) ;
	} , 5000 ) ;
	//*/
} ;



EventDispatcher.clientClose = function() {
	console.log( 'Closed!' ) ;
	this.dom.clientStatus( 'closed' ) ;
} ;



EventDispatcher.clientError = function( code ) {
	switch ( code ) {
		case 'unreachable' :
			this.dom.clientStatus( 'unreachable' ) ;
			break ;
	}
} ;



EventDispatcher.clientConfig = async function( config , callback ) {
	this.config = config ;
	console.warn( 'Client config received: ' , config ) ;

	if ( this.config.theme ) {
		this.dom.setTheme( this.config.theme ) ;
	}

	// Client extension loading is a blocking process, the client will malfunction if it doesn't have it
	if ( this.config.clientExtensions ) {
		for ( let extension of this.config.clientExtensions ) {
			await exm.requireExtension( extension ) ;
		}
	}

	callback() ;
} ;



EventDispatcher.controls = function( config ) {
	this.dom.setControls( config ) ;
} ;



EventDispatcher.user = function( user_ ) {
	console.log( 'User received: ' , user_ ) ;
	this.user = user_ ;
} ;



EventDispatcher.userList = function( users ) {
	console.log( 'User-list received: ' , users ) ;

	// Add the get method to the array
	users.get = arrayGetById ;
	this.users = users ;
} ;



EventDispatcher.roleList = function( roles , unassignedUsers , assigned ) {
	var choices = [] , undecidedNames ;

	// If there are many roles, this is a multiplayer game
	if ( ! this.roles && roles.length > 1 ) { this.dom.setMultiplayer( true ) ; }

	// Add the get method to the array
	roles.get = arrayGetById ;

	this.roles = roles ;

	// If already in-game, nothing more to do...
	if ( this.inGame ) { return ; }

	if ( assigned && roles.length <= 1 ) {
		// Nothing to do and nothing to display...
		this.roleId = roles[ 0 ].id ;
		return ;
	}

	roles.forEach( ( role , i ) => {
		var userName = role.clientId && this.users.get( role.clientId ).name ;

		choices.push( {
			index: i ,
			label: role.name ,
			type: 'role' ,
			selectedBy: userName && [ userName ]
		} ) ;
	} ) ;

	if ( unassignedUsers.length ) {
		undecidedNames = unassignedUsers.map( ( e ) => { return this.users.get( e ).name ; } ) ;
	}

	var onSelect = ( index ) => {
		if ( roles[ index ].clientId === this.user.id ) {
			// Here we want to unassign
			this.bus.emit( 'selectRole' , null ) ;
		}
		else if ( roles[ index ].clientId !== null ) {
			// Already holded by someone else
			return ;
		}
		else {
			this.bus.emit( 'selectRole' , roles[ index ].id ) ;
		}
	} ;

	this.dom.setChoices( choices , undecidedNames , onSelect , { multiRoles: true } ) ;

	if ( assigned ) {
		roles.find( e => {
			if ( e.clientId === this.user.id ) { this.roleId = e.id ; return true ; }
			return false ;
		} ) ;

		this.afterLeave = true ;	// tmp
		return ;
	}
} ;



// Formated message emitted by the core engine, core execution continue
//EventDispatcher.coreMessage = function coreMessage() { term.apply( term , arguments ) ; } ;
// Error formated message, mostly emitted by the core engine, but may be emitted from the script
//EventDispatcher.errorMessage = function errorMessage() { term.apply( term , arguments ) ; } ;



// Script [message], execution can be suspended if the listener is async, waiting for completion.
// E.g.: possible use: wait for a user input before continuing processing.
EventDispatcher.message = function( text , options , callback ) {
	this.hasNewContent = true ;

	if ( ! options ) { options = {} ; }

	if ( options.speech ) {
		if ( ! options.speechLang ) { options.speechLang = this.config.defaultLocale ; }
		options.useService = this.config.hasSpeechService ;

		if ( options.speechOnly ) {
			this.dom.addSpeech( text , options , callback ) ;
		}
		else {
			let messageDone = false , speechDone = false ;

			this.dom.addMessage( text , options , () => {
				messageDone = true ;
				if ( speechDone ) { callback() ; }
			} ) ;

			this.dom.addSpeech( text , options , () => {
				speechDone = true ;
				if ( messageDone ) { callback() ; }
			} ) ;
		}
	}
	else {
		this.dom.addMessage( text , options , callback ) ;
	}
} ;



EventDispatcher.indicators = function( data ) {
	this.dom.addIndicators( data ) ;
} ;



EventDispatcher.status = function( data ) {
	this.dom.addIndicators( data , true ) ;
} ;



EventDispatcher.panel = function( data , reset ) {
	this.dom.addPanel( data , reset ) ;
} ;



// 'enterScene' event
EventDispatcher.enterScene = function( isGosub , toAltBuffer ) {
	var switchedToAltBuffer ;

	this.inGame = true ;

	if ( toAltBuffer ) {
		switchedToAltBuffer = this.dom.toAltBuffer() ;
	}

	if ( ! isGosub && ! switchedToAltBuffer ) {
		this.dom.newSegmentOnContent() ;
	}

	this.afterNext = this.afterLeave = this.afterNextTriggered = false ;
} ;



// 'leaveScene' event
EventDispatcher.leaveScene = function( isReturn , backToMainBuffer ) {
	if ( backToMainBuffer ) { this.dom.toMainBuffer() ; }
	//else { this.dom.newSegmentOnContent() ; }

	// if ( isReturn ) {}

	this.afterNext = this.afterNextTriggered = false ;
	this.afterLeave = true ;
} ;



// 'nextTriggered' event
EventDispatcher.nextTriggered = function( nextId ) {
	var selected = this.nexts.find( e => e.id === nextId ) ;

	this.dom.newSegmentOnContent( 'inter-segment' ) ;

	if ( selected && selected.label && ! selected.button ) {
		this.dom.addSelectedChoice( selected.label ) ;
	}

	this.dom.clearChoices() ;
	this.afterNextTriggered = true ;
	this.hasNewContent = false ;
} ;



EventDispatcher.nextList = function( nexts , undecidedRoleIds , options , isUpdate ) {
	var choices = [] , undecidedNames , charCount = 0 ;

	this.nexts = nexts ;
	this.afterNext = true ;

	// No need to update if we are alone
	if ( isUpdate && this.roles.length === 1 ) { return ; }

	nexts.forEach( ( next , i ) => {
		var roles = next.roleIds.map( id => { return this.roles.get( id ).name ; } ) ;

		if ( next.label ) { charCount += next.label.length ; }

		choices.push( {
			index: i ,
			label: next.label || 'Next' ,
			style: next.style ,
			class: next.class ,
			image: next.image ,
			button: next.button ,
			groupBreak: !! next.groupBreak ,
			//orderedList: nexts.length > 1 ,
			type: 'next' ,
			selectedBy: roles
		} ) ;
	} ) ;

	if ( undecidedRoleIds.length && this.roles.length ) {
		undecidedNames = undecidedRoleIds.map( ( e ) => { return this.roles.get( e ).name ; } ) ;
	}

	var onSelect = index => {
		if ( nexts[ index ].roleIds.indexOf( this.roleId ) !== -1 ) {
			this.bus.emit( 'selectNext' , null ) ;
		}
		else {
			this.bus.emit( 'selectNext' , nexts[ index ].id ) ;
		}
	} ;

	this.dom.setChoices( choices , undecidedNames , onSelect , { timeout: options.timeout , nextStyle: options.nextStyle , multiRoles: this.roles.length > 1 } ) ;
} ;



// External raw output (e.g. shell command stdout)
EventDispatcher.extOutput = function( output ) {
	alert( 'not coded ATM!' ) ;
	//process.stdout.write( output ) ;
} ;



// External raw error output (e.g. shell command stderr)
EventDispatcher.extErrorOutput = function( output ) {
	alert( 'not coded ATM!' ) ;
	//process.stderr.write( output ) ;
} ;



// Text input field
EventDispatcher.textInput = function( label , grantedRoleIds ) {
	var options = {
		label: label
	} ;

	if ( grantedRoleIds.indexOf( this.roleId ) === -1 ) {
		options.placeholder = "YOU CAN'T RESPOND - WAIT..." ;
		this.dom.textInputDisabled( options ) ;
	}
	else {
		this.dom.textInput( options , ( text ) => {
			this.bus.emit( 'textSubmit' , text ) ;
		} ) ;
	}
} ;



EventDispatcher.prototype.commandConfig = function( config ) {
	console.warn( "Received command config:" , config ) ;
	if ( config.enabled === true ) {
		this.dom.enableCommand( ( message ) => {
			//console.log( 'inGame?' , this.inGame ) ;
			this.bus.emit( this.inGame ? 'command' : 'chat' , message ) ;
		} ) ;
	}
	else if ( config.enabled === false ) {
		this.dom.disableCommand() ;
	}
} ;



EventDispatcher.pause = function( duration ) {
	console.log( "Received a pause event for" , duration , "seconds" ) ;
} ;



EventDispatcher.unpause = function() {
	console.log( "Received an unpause event" ) ;
} ;



// rejoinRoles event (probably better to listen to that event before using it in the 'wait' event)
EventDispatcher.rejoinRoles = function() {} ;



EventDispatcher.wait = function( what ) {
	switch ( what ) {
		case 'otherBranches' :
			this.dom.setBigHint( "WAITING FOR OTHER BRANCHES TO FINISH..." , { wait: true , "pulse-animation": true } ) ;
			this.bus.once( 'rejoinRoles' , () => this.dom.clearHint() ) ;
			break ;
		default :
			this.dom.setBigHint( "WAITING FOR " + what , { wait: true , "pulse-animation": true } ) ;
	}
} ;



EventDispatcher.theme = function( data ) {
	if ( ! data.url ) {
		if ( this.config.theme ) { this.dom.setTheme( this.config.theme ) ; }
		return ;
	}

	this.dom.setTheme( data ) ;
} ;



EventDispatcher.image = function( data ) {
	this.dom.setSceneImage( data ) ;
} ;



EventDispatcher.createGScene = function( gSceneId , data ) {
	console.warn( "createGScene" , gSceneId , data ) ;
	this.dom.createGScene( gSceneId , data ) ;	//.then( callback ) ;
} ;



EventDispatcher.updateGScene = function( gSceneId , data , awaiting , callback ) {
	console.warn( "updateGScene" , gSceneId , data ) ;
	this.dom.updateGScene( gSceneId , data , awaiting ).then( callback ) ;
} ;



EventDispatcher.clearGScene = function( gSceneId ) {
	console.warn( "clearGScene" , gSceneId ) ;
	this.dom.clearGScene( gSceneId ) ;	//.then( callback ) ;
} ;



EventDispatcher.camera = function( gSceneId , data , awaiting , callback ) {
	console.warn( "camera" , gSceneId , data ) ;
	if ( awaiting ) {
		this.dom.updateCamera( gSceneId , data , true ).then( callback ) ;
	}
	else {
		this.dom.updateCamera( gSceneId , data , false ) ;
		callback() ;
	}
} ;



EventDispatcher.fontPack = async function( fontId , data , callback ) {
	console.warn( "fontPack" , fontId , data ) ;
	await this.dom.loadFontPack( fontId , data ) ;
	callback() ;
} ;



EventDispatcher.texturePack = function( gSceneId , textureUid , data , callback ) {
	console.warn( "texturePack" , gSceneId , textureUid , data ) ;
	this.dom.defineTexturePack( gSceneId , textureUid , data ) ;
	callback() ;
} ;



EventDispatcher.createGEntity = function( gSceneId , gEntityId , data , awaiting , callback ) {
	// Do something about awaiting?
	this.dom.createGEntity( gSceneId , gEntityId , data , awaiting ).then( callback ) ;
} ;



EventDispatcher.updateGEntity = function( gSceneId , gEntityId , data , awaiting , callback ) {
	if ( awaiting ) {
		this.dom.updateGEntity( gSceneId , gEntityId , data , true ).then( callback ) ;
	}
	else {
		this.dom.updateGEntity( gSceneId , gEntityId , data , false ) ;
		callback() ;
	}
} ;



EventDispatcher.clearGEntity = function( gSceneId , gEntityId ) {
	this.dom.clearGEntity( gSceneId , gEntityId ) ;
} ;



EventDispatcher.animateGEntity = function( gSceneId , gEntityId , animationId , awaiting , callback ) {
	// Do something about awaiting?
	this.dom.animateGEntity( gSceneId , gEntityId , animationId , awaiting ).then( callback ) ;
} ;



EventDispatcher.defineAnimation = function( id , data ) {
	this.dom.defineAnimation( id , data ) ;
} ;



// add a callback here?
EventDispatcher.sound = function( data ) {
	this.dom.sound( data ) ;
} ;



EventDispatcher.music = function( data ) {
	this.dom.music( data ) ;
} ;



// End event
EventDispatcher.end = function( result , data , callback ) {
	// /!\ this.afterNext is not the good way to detect extra content...
	var options = {
		modal: true , big: true , fun: true , contentDelay: this.hasNewContent , slow: true
	} ;

	var finished = () => {
		if ( this.ended ) { return ; }
		this.ended = true ;
		console.log( 'finished!' ) ;
		this.emit( 'end' ) ;
		callback() ;
	} ;

	switch ( result ) {
		case 'end' :
			this.dom.setDialog( 'The End.' , options , finished ) ;
			break ;
		case 'win' :
			this.dom.setDialog( 'You Win!' , options , finished ) ;
			break ;
		case 'lost' :
			this.dom.setDialog( 'You Lose...' , options , finished ) ;
			break ;
		case 'draw' :
			this.dom.setDialog( 'Draw.' , options , finished ) ;
			break ;
	}
} ;



EventDispatcher.diceRoller = function( grantedRoleIds , data ) {
	if ( grantedRoleIds.indexOf( this.roleId ) === -1 ) {
		this.dom.diceRollerDisabled( data ) ;
	}
	else {
		this.dom.diceRoller( data ).then( submitData => {
			this.bus.emit( 'diceRollerSubmit' , submitData ) ;
		} ) ;
	}
} ;



// Custom event, not used in vanilla client
EventDispatcher.custom = function( event , data ) {
	console.log( "Received a custom event" , event , data ) ;
} ;



// Exit event
EventDispatcher.exit = function( error , timeout , callback ) {
	console.log( 'exit cb' , callback ) ;
	this.once( 'end' , () => {
		// Add at least few ms, because DOM may be OK, but parallel image download are still in progress.
		// E.g.: after .setDialog()'s callback, boxes/geometric-gold.svg is not loaded.
		// Keep in mind that once the exit callback is sent, the remote server will disconnect us as soon as possible.
		setTimeout( 200 , callback ) ;
	} ) ;
} ;

