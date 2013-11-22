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
        
        console.log( "first.body1:" + str);
        console.log( "first.body2:" + ret.body);
        console.log( "first.body3:" + tmp);
        
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
        
        console.log( "last.body1:" + str);
        console.log( "last.body2:" + res[ 1]);
        console.log( "last.body3:" + tmp);
        
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
            
            var data = require( "./utils").str2ab( body);
            // modifying data
            var bufView = new Int8Array( data);
            
            for ( var i = 0; i < bufView.length; i++)
            {
                bufView[ i] ^= control.getPassword( );
            }
            
            // data.compress
            // data.encrypt
            
            var out =           header 
                              + require( "./utils").ab2str( data)
                              + '\r\n' 
                       + '--' + helper.boundary + '--\r\n';
            
            //console.error( out);            
            
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