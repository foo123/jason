// This component is an implementation of nsIStreamConverter that converts
// application/json to html
const JSON_TYPE = "application/json";
const CONTRACT_ID = "@mozilla.org/streamconv;1?from=" + JSON_TYPE + "&to=*/*";
const CLASS_ID = "{64890660-53c4-11dd-ae16-0800200c9a66}";
const GECKO_VIEWER = "Gecko-Content-Viewers";

// Hack to remove FF8+'s built-in JSON-as-text viewer
var categoryManager = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
var geckoViewer = categoryManager.getCategoryEntry(GECKO_VIEWER, JSON_TYPE);

if ( !Jason )
{

    var Jason = { 

        addMeta: function( doc, metaObj ) {
            var name, meta;
            for ( name in metaObj )
            {
                if ( 'title' === name ) 
                {
                    doc.title = metaObj['title'];
                }
                else
                {
                    meta = doc.createElement('meta');
                    meta.name = name;
                    meta.content = metaObj[name];
                    doc.head.appendChild( meta );
                }
            }
        }

        // load resources
        ,loadResources: function( document, paths, options ) {
            options = options || {};
            var dl = paths.length, i = 0, t = 0, rel = /^\./, 
                resourceType = options.type || 'script', 
                baseURI = options.base || '', 
                scope = options.scope || (document.parentWindow || document.defaultView) || window, 
                callback = options.callback,
                head = document.getElementsByTagName("head")[ 0 ],
                link = document.createElement( 'a' ),
                load, next
            ;
            load = function( url, cb ) {
                var done = 0, resource;
                if ( rel.test( url ) ) 
                {
                    // http://stackoverflow.com/a/14781678/3591273
                    // let the browser generate abs path
                    link.href = baseURI + url;
                    url = link.protocol + "//" + link.host + link.pathname + link.search + link.hash;
                }
                if ( 'script' === resourceType )
                {
                    resource = document.createElement('script');
                    resource.type = 'text/javascript'; resource.language = 'javascript';
                    resource.onload = resource.onreadystatechange = function( ) {
                        if (!done && (!resource.readyState || resource.readyState == 'loaded' || resource.readyState == 'complete'))
                        {
                            done = 1; resource.onload = resource.onreadystatechange = null;
                            cb( );
                            //head.removeChild( resource ); resource = null;
                        }
                    }
                    // load it
                    resource.src = url; head.appendChild( resource );
                }
                else if ( 'style' === resourceType )
                {
                    resource = document.createElement('link');
                    resource.type = 'text/css'; resource.rel = 'stylesheet';
                    // load it
                    resource.href = url; head.appendChild( resource );
                    cb( );
                }
                else 
                {
                    cb( );
                }
            };
            next = function( ) {
                if ( ++i >= dl ) { if ( callback ) callback( ); }
                else load( paths[ i ], next );
            };
            if ( i < dl ) load( paths[ i ], next );
            else if ( callback ) callback( );
        }

        ,empty: function( el ) {
            if ( el )
            {
                while ( el.firstChild ) el.removeChild( el.firstChild );
            }
            return el;
        }
        
        //var contents = Read("chrome://yourplugin/stuff.html");
        ,makePage: function( document, title, callback ) {
            Jason.empty( document.body );
            Jason.addMeta( document, {
                title: title
                ,charset: "UTF-8"
                ,viewport: 'width=device-width, initial-scale=1'
            });
            
            document.body.innerHTML = '\
<div class="wrapper">\
<div id="in"><textarea id="code"></textarea></div>\
<div id="controls">\
    <button id="btn-save" class="button save-button" title="Save Document">&nbsp;</button>\
</div>\
</div>\
            ';
            
            Jason.loadResources(document, [
                "resource://jasonresources/codemirror/lib/codemirror.min.css"
                ,"resource://jasonresources/codemirror/addon/fold/foldgutter.css"
                ,"resource://jasonskin/jason.css"
            ], {type: 'style'});
            
            Jason.loadResources(document, [
                "resource://jasonresources/codemirror/lib/codemirror.min.js"
                ,"resource://jasonresources/codemirror/mode/javascript.js"
                ,"resource://jasonresources/codemirror/addon/fold/foldcode.js"
                ,"resource://jasonresources/codemirror/addon/fold/foldgutter.js"
                ,"resource://jasonresources/codemirror/addon/fold/brace-fold.js"
                ,"resource://jasonresources/codemirror/addon/fold/comment-fold.js"
                ,"resource://jasonresources/viewer.js"
            ], {type: 'script', callback: callback});
        }
        
        ,jsonFileExtension: /\.json(\?.*)?(#.*)?$/i
        
        ,process: function( aEvent ) {
            var document = aEvent.originalTarget, 
                scope = document.parentWindow || document.defaultView,
                URL = document.location.href
            ;

            if ( document.location.protocol !== "view-source:" && 
                Jason.jsonFileExtension.test( URL ) ) 
            {
                var textContent = document.documentElement.textContent;
                
                Jason.makePage(
                    document, 
                    URL.split('/').pop( ).split(/#|\?/).pop( ),
                    function( ) {
                        // https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage
                        scope.postMessage({message: "render", data: textContent}, "*");
                });
            }
        }
    };
}

window.addEventListener('load', function load(event) {
    window.removeEventListener('load', load, false);
    // Remove built-in JSON viewer
    categoryManager.deleteCategoryEntry(GECKO_VIEWER, JSON_TYPE, false);
    // Tell Firefox that .json files are application/json
    categoryManager.addCategoryEntry('ext-to-type-mapping', 'json', 'application/json', false, true);
    var appcontent = document.getElementById('appcontent');
    if ( appcontent && Jason ) 
    {
        appcontent.addEventListener('DOMContentLoaded', Jason.process, true);
    }
}, false);
