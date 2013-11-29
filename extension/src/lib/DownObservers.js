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
    this.receivedData = Array( );
    this.receivedStr = "";
}

TracingListener.prototype =
{
    onDataAvailable: function( request, context, inputStream, offset, count)
    {
        var binaryInputStream  = CCIN("@mozilla.org/binaryinputstream;1" ,"nsIBinaryInputStream");
        binaryInputStream.setInputStream( inputStream);

        var data  = binaryInputStream.readByteArray( count);
        
        for ( var i = 0; i < data.length; i++)
        {
            this.receivedData.push( data[ i])
        }

        console.log( "count " + count);
    },

    onStartRequest: function( request, context)
    {
        this.originalListener.onStartRequest( request, context);
    },

    onStopRequest: function( request, context, statusCode)
    {
        // Get entire response

//        var binaryInputStream  = CCIN("@mozilla.org/binaryinputstream;1" ,"nsIBinaryInputStream");
        var storageStream      = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1","nsIBinaryOutputStream");

//        binaryInputStream.setInputStream(inputStream);
        storageStream.init( 16384, this.receivedData.length, null);
        binaryOutputStream.setOutputStream( storageStream.getOutputStream(0));

        var postData = new Array( );
        
        console.log( "length: " + this.receivedData.length)
                
        var Module = require( "./asm").Module;
        var Utils  = require( "./utils");
        
        var plain_P = Module._malloc( this.receivedData.length + 4);
        var cipher_P = Module._malloc( this.receivedData.length);
        
        for( var i = 0; i < this.receivedData.length; i++)
        {
            Module.HEAPU8[ cipher_P + i] = this.receivedData[ i];
        }

        console.error( "INTS" + Utils.mem2ints( cipher_P, this.receivedData.length));


        Module.ccall( '_Z14AES_decryptionPcS_S_jPj', 'undefined',
        [ 'number'            , 'number', 'number', 'number', 'number' ],
        [ control.getKey_P( ) , cipher_P , plain_P, this.receivedData.length, plain_P + this.receivedData.length]);
        
        var length = require( "./asm").getValue( plain_P + this.receivedData.length, 'i32');
	if ( length <= 0 || length > this.receivedData.length)
	{
	    length = this.receivedData.length;
	}
        console.log( "New length: " + length);
        
        for( var i = 0; i < length; i+=2)
        {
            binaryOutputStream.write8( require( "./asm").getValue( plain_P + i, 'i16'));
        }

        Module._free( plain_P);
        Module._free( cipher_P);

        this.originalListener.onDataAvailable( request, context, storageStream.newInputStream( 0), 0, length/2);        
        this.originalListener.onStopRequest( request, context, statusCode);
        control.downloadFinish( );
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