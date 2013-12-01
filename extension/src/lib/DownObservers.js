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
        var storageStream      = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1","nsIBinaryOutputStream");

        storageStream.init( 16384, this.receivedData.length, null);
        binaryOutputStream.setOutputStream( storageStream.getOutputStream(0));

        var postData = new Array( );
        
        console.log( "Start length: " + this.receivedData.length)
                
        var Module = require( "./asm").Module;
        var Utils  = require( "./utils");
        
        var plain_P = Module._malloc( this.receivedData.length + 4);
        var cipher_P = Module._malloc( this.receivedData.length);
        
        for( var i = 0; i < this.receivedData.length; i++)
        {
            Module.HEAPU8[ cipher_P + i] = this.receivedData[ i];
        }

        Module.ccall( '_Z14AES_decryptionPcS_S_jPj', 'undefined',
        [ 'number'            , 'number', 'number', 'number', 'number' ],
        [ control.getKey_P( ) , cipher_P , plain_P, this.receivedData.length, plain_P + this.receivedData.length]);
        
        var compressed_length = require( "./asm").getValue( plain_P + this.receivedData.length, 'i32');
        console.log( "Length after decryption: " + compressed_length);
        if ( compressed_length <= 0 || compressed_length >this.receivedData.length)
        {
            control.wrongPassword( );

            this.originalListener.onDataAvailable( request, context, storageStream.newInputStream( 0), 0, 0);        
            this.originalListener.onStopRequest( request, context, statusCode);
            control.downloadFinish( );
            return;
        }
        ////////////////////////////////////////////////////////////////////////
        
        var decompressed_length = Module.ccall( '_Z21get_decompressed_sizePc', 'number', [ 'number'],
                                                                                         [ plain_P ]);
        console.log( "Expected decomressed length" + decompressed_length);                                                                                         
        /////////////////////////////////////////////////////////////////////////
        var compressed_P = plain_P;
        plain_P = Module._realloc( cipher_P, decompressed_length);
            
        Module.ccall( '_Z10DecompressPKcmPcPm', 'undefined',
        [ 'number',      'number'   , 'number', 'number'       ],
        [ compressed_P , compressed_length, plain_P, plain_P + decompressed_length]);

        var new_length = require( "./asm").getValue( plain_P + decompressed_length, 'i32');
        console.error( "Real decompressed length " + new_length);
        /////////////////////////////////////////////////////////////////////////

        for( var i = 0; i < new_length; i++)
        {
            binaryOutputStream.write8( require( "./asm").getValue( plain_P + i, 'i8'));
        }

//        Module._free( plain_P);
//        Module._free( compressed_P);

        this.originalListener.onDataAvailable( request, context, storageStream.newInputStream( 0), 0, new_length);        
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