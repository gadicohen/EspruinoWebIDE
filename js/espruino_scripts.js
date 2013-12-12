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
  Espruino["Scripts"] = {};
  Espruino.Scripts["Tutorials"] = {
      url:"https://api.github.com/repos/espruino/EspruinoDocs/git/trees/master",
      subDirs:["datasheets","devices","peripherals","tasks","tutorials"],
      fileExtensions:["md","pdf"]
  };
  Espruino.Scripts["Scripts"] = {
      url:"https://api.github.com/repos/espruino/Espruino/git/trees/master",
      subDirs:["code"],
      fileExtensions:["js"]
  };
  Espruino.Scripts["initOptions"] = function(){
    Espruino.Options.optionFields.push({id:"#urlTutorials",module:"Scripts",object:"Scripts",field:"url",type:"text"});
    Espruino.Options.optionFields.push({id:"#subDirsTutorials",module:"Scripts",object:"Tutorials",field:"subDirs",type:"JSON"});
    Espruino.Options.optionFields.push({id:"#fileExtensionsTutorials",module:"Scripts",object:"Tutorials",field:"fileExtensions",type:"JSON"});
    Espruino.Options.optionFields.push({id:"#urlScripts",module:"Scripts",object:"Scripts",field:"url",type:"text"});
    Espruino.Options.optionFields.push({id:"#subDirsScripts",module:"Scripts",object:"Scripts",field:"subDirs",type:"JSON"});
    Espruino.Options.optionFields.push({id:"#fileExtensionsScripts",module:"Scripts",object:"Scripts",field:"fileExtensions",type:"JSON"});
    Espruino.Options.optionBlocks.push({id:"#divOptionScripts",htmlUrl:"data/Espruino_Scripts.html"});
  };

  Espruino.Scripts.init = function(){
    $( ".scripts" ).button({ text: false, icons: { primary: "ui-icon-script" } }).click(openSelects);
  };
  function copyScriptToEditor(){
    var url = $("#scripts option:selected")[0].value;
    if(url){
      $.getJSON(url, function(data){
        Espruino.General.setEditorCode(window.atob(data.content.replace(/(\r\n|\n|\r)/gm,"")));
        $(".subform").hide();
      }).fail(function(a,b,c){console.log(a,b,c); });
    }
  }  
  function showTutorial(){
    var html,ext,fileName,url,txt;
    url = $("#tutorials option:selected")[0].value;
    txt = $("#tutorials option:selected")[0].text;
    if(url){
      ext = url.substr(url.lastIndexOf("."));
      switch(ext){
        case ".md":
          url = "https://github.com/espruino/EspruinoDocs/tree/master/" + url;break;
        case ".pdf":
          url = "https://github.com/espruino/EspruinoDocs/blob/master/" + url + "?raw=true";break;
      }
      window.open(url);
      $("#loader").hide();
    }       
  }
  function openSelects(){
    loadGitHubTrees(Espruino.Scripts.Tutorials,"tutorials",tutorialsLoaded);
    loadGitHubTrees(Espruino.Scripts.Scripts,"scripts",scriptsLoaded);
    $("#loader").show();
  }
  function tutorialsLoaded(html,tutorials){
    $( "#loaderTutorials" ).html(html);
    $( "#loaderTutorials select" ).change(showTutorial);
  }
  function scriptsLoaded(html,scripts){
      $( "#loaderScripts" ).html(html);
      $( "#loaderScripts select").change(copyScriptToEditor);
  }
  function loadGitHubTrees(githubAdr,selectID,callback){
    var maxWait = 5000,trees = {};
    $.getJSON(githubAdr.url,
      function(data){
        var defs = [];
        for(var i = 0; i < githubAdr.subDirs.length; i++ ){
          for(var j = 0; j < data.tree.length; j++){
            if(data.tree[j].path === githubAdr.subDirs[i]){
              defs.push(loadTree(data.tree[j]));
            }
          }
        }
        if(defs.length > 0) {$.when.apply(null,defs).then(function(){createSelect();});}
      }
    );
    function loadTree(ghTree){
      var dfd = $.Deferred(),t;
      t = setInterval(function(){clearInterval(t);dfd.reject();},maxWait);
      $.getJSON(ghTree.url,function(data){
        trees[ghTree.path] = data.tree;
        dfd.resolve();
      });
      return dfd.promise();
    }
    function createSelect(){
      var html,tree,items = [];
      html = "<select id=\"" + selectID + "\">";
      html += "<option value=\"\">Select " + selectID + "</option>";
      for(var t in trees){
        tree = trees[t];
        html += "<optgroup label=\"" + t + "\">";
        for(var k = 0; k < tree.length; k++){
          if(tree[k].type === "blob"){
            var v = tree[k].path.substr(tree[k].path.lastIndexOf(".") + 1);
            if($.inArray(v,githubAdr.fileExtensions) >= 0){
              items.push(tree[k]);
              if(v === "js"){ html += "<option value=\"" + tree[k].url + "\">" + tree[k].path + "</option>";}
              else{ html += "<option value=\"" + t + "/" + tree[k].path + "\">" + tree[k].path + "</options>"; }
            }
          }
        }
        html += "</optgroup>";
      }
      html += "</select>"; 
      callback(html,items); 
    }
  }    
})();
