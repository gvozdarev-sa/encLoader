// control.js - encLoader's module
// author: gvozdarev-sa
"use strict";

var ui = require( "./ui");
var settings = new Object( );
settings.enabled = 1;
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

exports.searchPassword = function( )
{
        require("sdk/passwords").search(
        {
            url: require("sdk/self").uri,
            onComplete: function onComplete( credentials) 
            {
                credentials.forEach( function( credential)
                {
                    console.log( credential.username);
                    console.log( credential.password);
                    settings.password = credential.password;
                });
            }
        });
    
}

exports.setPassword = function( str)
{
    settings.password = str;
}
