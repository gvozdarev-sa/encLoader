// utils.js - encLoader's module
// author: gvozdarev-sa
"use strict";
function ab2str( buf)
{
    var ret = "";
    if ( buf.length <= 1024)
    {
        ret = String.fromCharCode.apply( null, new Uint16Array( buf));
    }
    else
    {
        var data = new Uint16Array( buf);
        for ( var i = 0; i < data.length / 1024; i++)
        {
            var from = i * 1024;
            var to = ( ( i + 1) * 1024 < data.length ) ? ( ( i + 1) * 1024) : ( data.length);
            ret += String.fromCharCode.apply( null, data.subarray( from, to));
        }
    }
    return ret;
}

function str2ab( str) 
{
    var buf = new ArrayBuffer( str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for ( var i=0, strLen=str.length; i<strLen; i++)
    {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

exports.ab2str = ab2str;
exports.str2ab = str2ab;
