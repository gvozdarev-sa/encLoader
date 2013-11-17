// DownObservers.js - encLoader's module
// author: gvozdarev-sa
"use strict";
const {Cc,Ci,Cr} = require("chrome");
// Helper function for XPCOM instanciation (from Firebug)
function CCIN(cName, ifaceName)
{
     return Cc[ cName].createInstance( Ci[ ifaceName]);
}

var control = require( "./control");

function TracingListener( )
{
    this.originalListener = null;
    this.receivedData = [ ];
}

TracingListener.prototype =
{
    onDataAvailable: function( request, context, inputStream, offset, count)
    {
        var binaryInputStream  = CCIN("@mozilla.org/binaryinputstream;1" ,"nsIBinaryInputStream");
        var storageStream      = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1","nsIBinaryOutputStream");

        binaryInputStream.setInputStream(inputStream);
        storageStream.init( 8192, count, null);
        binaryOutputStream.setOutputStream( storageStream.getOutputStream(0));

        // Copy received data as they come.
        var data  = binaryInputStream.readBytes( count);
        var postData = new Array( );
        
        var buf = new ArrayBuffer( data.length); 
        var bufView = new Int8Array( buf);
        
        for ( var i=0; i < bufView.length; i++)
        {
            bufView[ i] = data[ i].charCodeAt( 0);
        }

        // Must be in web worker
        for( var i = 0; i < bufView.length; i++)
        {
            bufView[ i] ^= control.getPassword( );
        }

        for( var i = 0; i < bufView.length; i++)
        {
            binaryOutputStream.write8( bufView[ i]);
        }

        this.originalListener.onDataAvailable( request, context, storageStream.newInputStream( 0), offset, count);
    },

    onStartRequest: function( request, context)
    {
        this.originalListener.onStartRequest( request, context);
    },

    onStopRequest: function( request, context, statusCode)
    {
        // Get entire response
        control.downloadFinish( );
        //var responseSource = this.receivedData.join( );
        this.originalListener.onStopRequest( request, context, statusCode);
    },

    QueryInterface: function ( aIID)
    {
        if ( aIID.equals( Ci.nsIStreamListener) || aIID.equals( Ci.nsISupports))
        {
            return this;
        }
        throw Cr.NS_NOINTERFACE;
    }
}

exports.DownObserver =
{
    observe: function(aSubject, aTopic, aData)
    {
        let url;
        aSubject.QueryInterface( Ci.nsIHttpChannel);

        url = aSubject.URI.spec;
//        console.info( url);

        // downloader-default14j.disk.yandex.ru
        let down_expr = new RegExp( 'downloader-[a-zA-z0-9]*.disk.yandex.ru');
        if ( aTopic == "http-on-examine-response" && down_expr.test( url) && control.isEnabled( ))
        {
            console.log( url);
            console.log( "Ya disk down");
            control.downloadStart( "Ya disk down");
            var newListener = new TracingListener( );
            aSubject.QueryInterface( Ci.nsITraceableChannel);
            newListener.originalListener = aSubject.setNewListener( newListener);
        }
    },
    QueryInterface : function (aIID)
    {
        if (aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsISupports))
        {
            return this;
        }

        throw Cr.NS_NOINTERFACE;

    }
}