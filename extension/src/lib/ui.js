// ui.js - encLoader's module
// author: gvozdarev-sa
"use strict";
const {Cc,Ci,Cr,Cu} = require("chrome");

var ui = new Object( );
var self = require("self");        
var data = self.data;
var control = require( "./control");



function initUI( )
{
    ui.settingsPanel = require("sdk/panel").Panel(
    {
        width               : 300,
        height              : 160,
        contentURL          : data.url( 'settings.html'),
        contentScriptFile   : data.url( 'settings.js'),
    });
    ui.settingsPanel.port.on( "password", function( e)
    {
        control.setPassword( e);    
    });
    ui.button = require("sdk/widget").Widget
        ({
            id: "encloader-ui",
            label: "encLoader",
            
            contentURL       : data.url( "button.html"),
            contentScriptFile: data.url( "button.js"),
            panel: ui.settingsPanel,
            width: 75,
        });
        
    ui.button.port.on( "clk", function( )
    {
        control.enabledToggle( );
    });
    
    ui.button.port.on( "settings-clk", function( )
    {
        settingsShow( );
    });
}

function settingsShow( )
{
    ui.settingsPanel.show( );
}

function settingsHide( )
{
    ui.panel.hide( );
}

function upNotification( item)
{
        var notification = require( "./externals/notification-box").NotificationBox
        ({
                'value'    : 'important-message',
                'label'    : 'encUploading' + item,
                'priority' : 'CRITICAL_BLOCK',
                'image'    : data.url( "active_hover.png"),
                'buttons'  : [
                                {
                                    'label': "Abort",
                                    'onClick': function () { console.log( "Abort encUploading. Not empl yet"); }
                                },
                                {
                                    'label': "OK",
                                    'onClick': function () { console.log( "encUploading OK"); }
                                }

                            ]
        });  
    
}
function downNotification( item)
{
        var notification = require( "./externals/notification-box").NotificationBox
        ({
                'value'    : 'important-message',
                'label'    : 'encLoading' + item,
                'priority' : 'CRITICAL_BLOCK',
                'image'    : data.url( "active_hover.png"),
                'buttons'  : [
                                {
                                    'label': "Abort",
                                    'onClick': function () { console.log( "Abort encDownloading. Not empl yet"); }
                                },
                                {
                                    'label': "OK",
                                    'onClick': function () { console.log( "encDownloading OK"); }
                                },
                            ]
        });  
    
}
function setActiveButton( )
{
    ui.button.port.emit( "setActive");
}
function setInactiveButton( )
{
    ui.button.port.emit( "setInactive");
}

function setInactiveButton( )
{
    ui.button.port.emit( "setInactive");
}
function progressHidden( )
{
    ui.button.port.emit( "setProgressHidden");
}
function progressVisible( )
{
    ui.button.port.emit( "setProgressVisible");
}

function openSettings( )
{
    var pageMod = require("sdk/page-mod").PageMod(
    {
        include: data.url( 'setting.html'),
        //include: '*settings.html',                
        contentScriptFile: data.url( 'settings.js'),
    });
            
    require( "sdk/tabs").open(
    {
        url: data.url( 'settings.html')
    });
}


exports.initUI             = initUI;

exports.downNotification   = downNotification;
exports.upNotification     = upNotification;

exports.setActiveButton    = setActiveButton;
exports.setInactiveButton  = setInactiveButton;

exports.progressVisible    = progressVisible;
exports.progressHidden     = progressHidden;

exports.settingsShow       = settingsShow;
exports.settingsHide       = settingsHide;




        
        