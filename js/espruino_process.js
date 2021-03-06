/*
 * The MIT License

Copyright (c) 2013 by Juergen Marsch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";
(function(){
    // Code to get board's 'process.env' variable
    Espruino["Process"] = {};
    Espruino.Process.Env = {};

    Espruino.Process.init = function() {};
    Espruino.Process.setProcess = setProcess;

    var bufText = "";
    
    function getProcessInfo(prevReader, callback) {
      // string adds to stop the command tag being detected in the output
      Espruino.Serial.write('echo(0);\nconsole.log("<<"+"<<<"+JSON.stringify(process.env)+">>>"+">>");\n');  
      setTimeout(function(){          
        console.log("Got "+JSON.stringify(bufText));          
        var startProcess = bufText.indexOf("<<<<<");
        var endProcess = bufText.indexOf(">>>>>", startProcess);
        if(startProcess >= 0 && endProcess > 0){
          var pText = bufText.substring(startProcess + 5,endProcess);     
          try {       
            Espruino.Process.Env = JSON.parse(pText);
          } catch (e) {
            console.log("JSON parse failed - " + e);
          }
          callback();
          // strip out the text we found
          bufText = bufText.substr(0,startProcess) + bufText.substr(endProcess+5);
          // try and strip out the echo 0 too...
          bufText = bufText.replace("echo(0);","");
        }
        // start the previous reader listing again
        Espruino.Serial.startListening(prevReader);          
        // forward the original text to the previous reader
        prevReader(bufText);
        // do echo(1) here as this will re-show the prompt
        Espruino.Serial.write('echo(1);\n'); 
      },300);   
    }

    Espruino.Process.getProcess = function(callback){
      bufText = "";
      if(Espruino.Serial.isConnected()){
        var prevReader = Espruino.Serial.startListening(function (readData) {
          var bufView = new Uint8Array(readData);
          for(var i = 0; i < bufView.length; i++) {
            bufText += String.fromCharCode(bufView[i]);
          }
        });
        // send a newline, and we hope we'll see '=undefined\r\n>'
        Espruino.Serial.write('\n');
        setTimeout(function() {          
          console.log("Got "+JSON.stringify(bufText));          
          // if we haven't had the prompt displayed for us, Ctrl-C to break out of what we had
          if (bufText[bufText.length-1] == ">") {
            console.log("Found a prompt... good!");
          } else {
            console.log("No Prompt found, got "+JSON.stringify(bufText[bufText.length-1])+" - issuing Ctrl-C to try and break out");
            Espruino.Serial.write('\x03');
          }
          // send data to console anyway...
          prevReader(bufText);
          bufText="";
          // now get the real info
          getProcessInfo(prevReader, callback);
        },300);        
      }
    };

    function setProcess(data){
      if (!$.isEmptyObject(data)) {
        // We don't want to overwrite all of Env, as this came from the board
        Espruino.Process.Env.BOARD_NAME = data.info.name;
        Espruino.Process.Env.AVAILABLE_VERSION = data.info.binary_version;
      }
    }
})();
