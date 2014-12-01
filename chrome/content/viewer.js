!function( window, CodeMirror ) {
    "use strict";
    
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL,
        saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs,
        saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob,
        
        toJSON = JSON.stringify, fromJSON = JSON.parse,
        
        editor, currentURL = document.location.href,
        
        wrapper = document.getElementsByClassName('wrapper')[0]
    ;
    
    var saveFile = function( doc, code ) {
        var blob = new Blob(["\ufeff" /* utf8 bytes*/, code], { type: 'text/plain' }),
            name = "untitled.json"
        ;
        if ( saveAs )
        {
            saveAs( blob, name );
        }
        else if ( saveBlob )
        {
            saveBlob( blob, name );
        } 
        else
        {
            var url = URL.createObjectURL( blob );
            var link = doc.createElement("a");
            var event = doc.createEvent('MouseEvents');
            link.setAttribute("href", url);
            link.setAttribute("download", name);
            event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            link.dispatchEvent( event );
        }
    };
    
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        mode: "application/json",
        lineWrapping: true,
        lineNumbers : true,
        indentUnit: 4,
        indentWithTabs: false,
        theme: 'default',
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
    });
    editor.is_hidden = false;
    
    document.getElementById('btn-save').addEventListener('mouseup', function(){
        saveFile( document, editor.getValue( ) );
        return false;
    }, false);
    
    document.addEventListener('keydown', function(e){
        if( 83 === e.keyCode && (e.ctrlKey || e.metaKey) )
        {
            e.preventDefault( );
            saveFile( document, editor.getValue( ) );
            return false;
        }
    });
    
    window.addEventListener("message", function renderContent(event) {
        if ( !event.data || "render" !== event.data.message  ) return;
        window.removeEventListener("message", renderContent );
        editor.setValue( toJSON( fromJSON(event.data.data), null, 4 ) );
    }, false);
    
}(window, CodeMirror);