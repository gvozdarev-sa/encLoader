"use strict";
const {Cc,Ci,Cr} = require("chrome");
var self = require("self");        
var data = self.data;

exports.main = function() 
{
        var notification = require( "./externals/notification-box").NotificationBox
        ({
                'value'   : 'important-message',
                'label'   : 'encLoader installed!',
                'priority': 'CRITICAL_BLOCK',
        });

        var observerService = Cc["@mozilla.org/observer-service;1"].getService( Ci.nsIObserverService);

        observerService.addObserver( require( "./DownObservers").DownObserver, "http-on-examine-response", false);
        observerService.addObserver( require( "./UpObservers").UpObserver,     "http-on-modify-request", false);


        require( "./ui").initUI( );
};

exports.onUnload = function ( reason)
{
    if (reason == '!!!aaa!!!shutdown') 
    {
        var notification = require( "./externals/notification-box").NotificationBox
        ({
                'value'   : 'important-message2',
                'label'   : 'encLoader uninstalled!',
                'priority': 'CRITICAL_BLOCK',
        });  
    }
};