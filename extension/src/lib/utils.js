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

function str2c_str( str,pointer)
{
    var setValue = require( "./asm").setValue;
    for ( var i=0, strLen=str.length; i < strLen; i++)
    {
        setValue( pointer + i, str.charCodeAt( i), 'i8');
    //    console.log( "set:" + str.charCodeAt( i));
    }    
}

function c_str2str( pointer, length)
{
    var ret = "";
    var getValue = require( "./asm").getValue;
    for ( var i=0; i < length; i++)
    {
        ret += String.fromCharCode( getValue( pointer + i, 'i8'));
//        console.log( "get:" + getValue( pointer + i, 'i8'));
    }
    return ret;
}



function mem2ints( pointer, length)
{
    var ret = "";
    var getValue = require( "./asm").getValue;
    for ( var i=0; i < length; i++)
    {
        ret += " " + getValue( pointer + i, 'i8');
    }
    return ret;    
}

exports.ab2str = ab2str;
exports.str2ab = str2ab;
exports.c_str2str = c_str2str;
exports.str2c_str = str2c_str;
exports.mem2ints  = mem2ints;

