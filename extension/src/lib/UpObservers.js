// UpObservers.js - encLoader's module
// author: gvozdarev-sa
"use strict";

const {Cc,Ci,Cr} = require("chrome");
function CCIN( cName, ifaceName)
{
     return Cc[ cName].createInstance( Ci[ ifaceName]);
}
function escapeRegExp( str) 
{
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var control = require( "./control");

function UpHelper( aSubject)
{
    this.httpChannel         = aSubject.QueryInterface( Ci.nsIHttpChannel);
}

UpHelper.prototype = 
{
    init: function( )
    {
        this.uploadChannel       = this.httpChannel.QueryInterface( Ci.nsIUploadChannel);
    
        this.uploadChannelStream = this.uploadChannel.uploadStream;
        this.uploadChannelStream.QueryInterface( Ci.nsISeekableStream).seek( Ci.nsISeekableStream.NS_SEEK_SET, 0);
    },
    getUrl: function( )
    {
        return  this.httpChannel.URI.spec;
    },
    getRequestMethod: function( )
    {
        return this.httpChannel.requestMethod;
    },
    getHeader: function( str)
    {
        var contentType = this.httpChannel.getRequestHeader( "Content-Type");
        var boundaryRegExp = new RegExp( 'boundary=(.*)');
        this.boundary = boundaryRegExp.exec( contentType)[ 1];
                        
        var tmp = '(.*\\r\\n)(.*\\r\\n)(.*\\r\\n\\r\\n)([\\S\\s]*)$';   //FIXME
        var bodyHeaderRegExp = new RegExp( tmp);
        var bodyHeader = bodyHeaderRegExp.exec( str);
                
        var ret = new Object( );
        ret.header = bodyHeader[ 1] + bodyHeader[ 2] + "Content-Type: application/octet-stream\r\n\r\n";
        ret.body = bodyHeader[ 4];
        
        return ret;
    },
    getFooter: function( str)
    {
        var tmp = '(^[\\s\\S]*)\\r\\n' + '(--' + this.boundary + '--\\r)';
        var regexp = new RegExp( tmp);

        var res = regexp.exec( str);
        
        var ret = new Object( );
        ret.body   = res[ 1];
        ret.footer = res[ 2];
        
        return ret;
    },
    getFooterHeader: function( str)
    {
        var contentType = this.httpChannel.getRequestHeader( "Content-Type");
        var boundaryRegExp = new RegExp( 'boundary=(.*)');
        this.boundary = boundaryRegExp.exec( contentType)[ 1];

        var tmp = '(.*\\r\\n)(.*\\r\\n)(.*\\r\\n\\r\\n)([\\S\\s]*)\\r\\n' + '(--' + this.boundary + '--\\r)';
        
        var bodyHeaderRegExp = new RegExp( tmp);
        var bodyHeader = bodyHeaderRegExp.exec( str);
                
        var ret = new Object( );
        ret.header = bodyHeader[ 1] + bodyHeader[ 2] + "Content-Type: application/octet-stream\r\n\r\n";
        ret.body = bodyHeader[ 4] ;
                
        return ret;
    }
}



exports.UpObserver = 
{
    observe: function(aSubject, aTopic, aData)
    {
        var helper = new UpHelper( aSubject);

        // https://uploader13g.disk.yandex.net/upload-target/
        var up_expr = new RegExp( '.*disk.yandex.net/upload-target');
        if (    control.isEnabled( ) 
           //&& aTopic == "http-on-modify-request" 
             && helper.getRequestMethod( ) == "POST"
             && up_expr.test( helper.getUrl( ))
            )
        {
            helper.init( );
            console.log( helper.getUrl( ));
            console.log( "Ya disk up");
            control.uploadStart( "Ya disk up");
            
            var stream  = CCIN("@mozilla.org/binaryinputstream;1" ,"nsIBinaryInputStream");
            stream.setInputStream( helper.uploadChannelStream);

            if ( stream.available( ) > 512)
            {
                var firstBytes  = stream.readByteArray( 256);
                var firststr    = String.fromCharCode.apply( null, firstBytes);

                var first = helper.getHeader( firststr);
                var header = first.header;
        
                var middleBytes = stream.readByteArray( stream.available( ) - 128);

                var lastBytes   = stream.readByteArray( 128);
                var laststr     = String.fromCharCode.apply( null, lastBytes);

                var last = helper.getFooter( laststr);
                var body = first.body;
            
                for ( var i = 0; i < middleBytes.length / 1024; i++)
                {
                    body += String.fromCharCode.apply( null, middleBytes.slice( i * 1024, (i + 1) * 1024));
                }
                body += last.body;
            }
            else
            {
                var bytes = stream.readByteArray( stream.available( ));
                var r = helper.getFooterHeader( String.fromCharCode.apply( null, bytes));
                var body = r.body;
                var header = r.header;
            }
            console.error( "original length: " + body.length);    
            /////////////////////////////////////////////////////////////////////
            var Module = require( "./asm").Module;
            var Utils  = require( "./utils");
            /////////////////////////////////////////////////////////////////////
            var compressed_length = Module.ccall( '_Z19get_compressed_sizem', 'number',    [ 'number'],
                                                                                   [ (body.length) ]);
            
            var plain_P      = Module._malloc( body.length + 4);
            var compressed_P = Module._malloc( compressed_length);
            
            Utils.str2c_str( body, plain_P);
            require( "./asm").setValue( plain_P + body.length, compressed_length, 'i32');
            console.error( "max compressed length: " + compressed_length);
            /////////////////////////////////////////////////////////////////////
            Module.ccall( '_Z8CompressPKcmPcPm', 'undefined',
            [ 'number', 'number'   , 'number', 'number'       ],
            [ plain_P , body.length, compressed_P, plain_P + body.length]);

            compressed_length = require( "./asm").getValue( plain_P + body.length, 'i32');
            console.error( "real compressed length: " + compressed_length);
            /////////////////////////////////////////////////////////////////////
            var size = Module.ccall( '_Z28AES_get_encrypted_array_sizej', 'number', [ 'number'],
                                                                                    [ compressed_length ]);
            
            var cipher_P = Module._realloc( plain_P, size);
            plain_P = compressed_P;
            console.error( "size after encryption : " + size);
            /////////////////////////////////////////////////////////////////////
//            IV                 KEY                   plain text cipher            
            Module.ccall( '_Z14AES_encryptionPcS_S_S_j', 'undefined',
            [ 'number'          ,'number'            , 'number', 'number', 'number'       ],
            [ control.getIV_P( ), control.getKey_P( ), plain_P , cipher_P, compressed_length]);
            
            
            var body2 = Utils.c_str2str( cipher_P, size);
//            console.log( body2);
            var out =           header
                              + body2
                              + '\r\n' 
                       + '--' + helper.boundary + '--\r\n';
            
            //console.error( "INTS" + Utils.mem2ints( cipher_P, size));
                        
            Module._free( cipher_P);
            Module._free( plain_P);
            
            var inputStream = CCIN( "@mozilla.org/io/string-input-stream;1" ,"nsIStringInputStream");
            inputStream.setData( out, out.length);
            helper.uploadChannel.setUploadStream( inputStream, "multipart/form-data;boundary=" + helper.boundary, -1);
            helper.httpChannel.requestMethod = "POST"; // setUploadStream resets requestMethod to PUT

            control.uploadFinish( );
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