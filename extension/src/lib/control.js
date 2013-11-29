// control.js - encLoader's module
// author: gvozdarev-sa
"use strict";

var ui = require( "./ui");
var Module = require( "./asm").Module;

var settings = new Object( );
settings.enabled = 1;
settings.key_P = Module._malloc( 32);
settings.IV_P  = Module._malloc( 32);


exports.enable = function( )
{
    settings.enabled = 1;
    ui.setActiveButton( );
}
exports.disable = function( )
{
    settings.enabled = 0;
    ui.setInactiveButton( );
}
exports.enabledToggle = function( )
{
    if ( settings.enabled)
    {
        settings.enabled = 0;
        ui.setInactiveButton( );        
    }
    else
    {
        settings.enabled = 1;
        ui.setActiveButton( );
    }
    //ui.progressVisible( );
}
exports.isEnabled = function( )
{
    return settings.enabled;
}

exports.downloadStart = function( item)
{
    ui.downNotification( item);
    ui.progressVisible( );
}

exports.uploadStart = function( item)
{
    ui.upNotification( item);
    ui.progressVisible( );
}

exports.downloadFinish = function( )
{
    ui.progressHidden( );
}

exports.uploadFinish = function( )
{
    ui.progressHidden( );
}


exports.getPassword = function( )
{
    return settings.password;
}

exports.getKey_P = function( )
{
    console.warn( "key" + require( "./utils").c_str2str( settings.key_P, 32));
    return settings.key_P;
}

exports.getIV_P = function( )
{
    var str = (( new Date()).valueOf( )).toString( );
    var password_P = Module._malloc( str.length*2);

    var data = new Uint8Array( str.length * 2);
    for( var i = 0; i < str.length*2; i++)
    {
        Module.HEAPU8[ password_P + i] = str.charCodeAt(i);
    }


    Module.ccall( '_Z9DeriveKeyPhPKhj', 'undefined', [ 'number',     'number',     'number'    ],
                                                     [  settings.key_P, password_P, str.length*2]);

    settings.IV = require( "./utils").ab2str( Module.HEAPU8.subarray( settings.IV_P, settings.IV_P + 32));
    console.info( "IV: " + settings.IV);

    Module._free( password_P);
    return settings.IV_P;
}

exports.setPassword = function( str)
{
    var password_P = Module._malloc( str.length*2);

    for( var i = 0; i < str.length*2; i++)
    {
        Module.HEAPU8[ password_P + i] = str.charCodeAt( i);
    }


    Module.ccall( '_Z9DeriveKeyPhPKhj', 'undefined', [ 'number',     'number',     'number'    ],
                                                     [  settings.key_P, password_P, str.length*2]);

    settings.password = require( "./utils").ab2str( Module.HEAPU8.subarray( settings.key_P, settings.key_P + 32));
    console.info( "password: " + settings.password);

    Module._free( password_P);
}
