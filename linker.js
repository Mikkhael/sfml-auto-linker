function append(element, tag, property, value){
    element.innerHTML += `<${tag} ${property}="${value}" />`;
}

function create(element, tag, property, value){
    if(property){
        element.innerHTML+=`<${tag} ${property}="${value}" >   </${tag}>`;
    }else{
        element.innerHTML+=`<${tag}>   </${tag}>`;
    }
    return element.children[element.children.length-1];
}

function createIfNotExists(element, tag, property, value){
    if(property){
        for(let elem of element.children){
            if(elem.localName === tag && elem.attributes[property] && elem.attributes[property].value === value){
                return;
            }
        }
    }else{
        for(let elem of element.children){
            if(elem.localName === tag){
                return;
            }
        }
    }
    create(element, tag, property, value);
}

function getChildByTag(element, childTag){
    for(let elem of element.children){
        if(elem.localName === childTag){
            return elem;
        }
    }
    return create(element, childTag);
}

function getChildByTagWithProperty(element, childTag, propertyName, propertyValue){
    for(let elem of element.children){
        if(elem.localName === childTag && elem.attributes[propertyName] && elem.attributes[propertyName].value === propertyValue){
            return elem;
        }
    }
    return create(element, childTag, propertyName, propertyValue);
}


function appendIfNotExists(element, tag, property, value){
    for(let elem of element.children){
        //console.log("CJ", elem.attributes[property], value, elem.attributes[property] === value);
        if(elem.localName === tag && elem.attributes[property] && elem.attributes[property].value === value){
            return;
        }
    }
    append(element, tag, property, value);
}

function removeIfMatches(element, tag, property, valueRegExp){
    for(let i=0; i<element.children.length; i++){
        let elem = element.children[i];
        //console.log("CJ", elem.attributes[property], value, elem.attributes[property] === value);
        //console.log("AAA", elem.attributes[property].value, valueRegExp);
        if(elem.localName === tag && elem.attributes[property] && valueRegExp.test(elem.attributes[property].value)){
            element.removeChild(element.children[i]);
            i--;
        }
    }
}

const Dependencies = {
    "main":["opengl32", "freetype", "winmm", "gdi32"],
    "2.4": ["jpeg"],
    "network": ["ws2_32"],
    "audio": ["openal32", "flac", "vorbisenc", "vorbisfile", "vorbis", "ogg"],
    "all": ["opengl32", "freetype", "winmm", "gdi32", "jpeg", "ws2_32", "openal32", "flac", "vorbisenc", "vorbisfile", "vorbis", "ogg"]
};

const allDependenciesRegExp = new RegExp("^(?:" + Dependencies.all.join("|") + ")$");
const sfmlLibraryRegExp = /sfml-(?:graphics|window|audio|network|system)/;

function removeDependencies(target){
    removeIfMatches(target, "Add", "library", sfmlLibraryRegExp);
    removeIfMatches(target, "Add", "library", allDependenciesRegExp);
}

function appendGivenDependencies(target, libs, deps, isStatic, isDebug){
    for(let lib of libs){
        append(target, "Add", "library", `sfml-${lib}${isStatic?"-s":""}${isDebug?"-d":""}`);
    }
    for(let dep of deps){
        append(target, "Add", "library", dep);
    }
}

function appendRequiredDependencies(debug, release, options){
    let deps = Dependencies.main.filter(() => true);
    if(options.sfmlVersion === "2.4")
        Dependencies["2.4"].forEach(x => deps.push(x));
    
    let libs = ["graphics", "window"];
    if(options.linkAudio){
        Dependencies["audio"].forEach(x => deps.push(x));
        libs.push("audio");
    }
    if(options.linkNetwork){
        Dependencies["network"].forEach(x => deps.push(x));
        libs.push("network");
    }
    libs.push("system");
    
    appendGivenDependencies(debug, libs, deps, options.isStatic, true);
    appendGivenDependencies(release, libs, deps, options.isStatic, false);
}

function modifyXML(xmlData, options){
    
    //console.log(options);
    
    let anchor = xmlData.firstChild;
    //console.log(anchor);
    
    createIfNotExists(anchor, "Project");
    let project = getChildByTag(anchor, "Project");
    
    createIfNotExists(project, "Linker");
    createIfNotExists(project, "Compiler");
    createIfNotExists(project, "Build");
    let linker = getChildByTag(project, "Linker");
    let compiler = getChildByTag(project, "Compiler");
    let build = getChildByTag(project, "Build");
    
    createIfNotExists(build, "Target", "title", "Debug");
    let debug = getChildByTagWithProperty(build, "Target", "title", "Debug");
    createIfNotExists(debug, "Linker");
    let debugLinker = getChildByTag(debug, "Linker");
    
    createIfNotExists(build, "Target", "title", "Release");
    let release = getChildByTagWithProperty(build, "Target", "title", "Release");
    createIfNotExists(release, "Linker");
    let releaseLinker = getChildByTag(release, "Linker");
    
    removeDependencies(linker);
    removeDependencies(debugLinker);
    removeDependencies(releaseLinker);
    
    removeIfMatches(compiler,  "Add", "directory", /sfml.*include/i);
    appendIfNotExists(compiler, "Add", "directory", options.sfmlDirectory + "include");
    removeIfMatches(linker,  "Add", "directory", /sfml.*lib/i);
    appendIfNotExists(linker,   "Add", "directory", options.sfmlDirectory + "lib");
    
    appendRequiredDependencies(debugLinker, releaseLinker, options);
    
    if(options.isStatic){
        appendIfNotExists(compiler, "Add", "option", "-DSFML_STATIC");
    }else{
        removeIfMatches(compiler, "Add", "option", /^-DSFML_STATIC$/i);
    }
    
    console.log("Compiler", compiler.outerHTML);
    return anchor.outerHTML;
}


function getOptions(){
    
    let sfmlDirectory = document.getElementById("sfmlPath").value.trim().replace(/\\/g, "/");
    if(!sfmlDirectory){
        return {good: false, data: "No SFML directory provided"};
    }
    if(sfmlDirectory[sfmlDirectory.length - 1] !== "/"){
        sfmlDirectory += "/";
    }
    
    return {good: true, data:{
        sfmlDirectory: sfmlDirectory,
        sfmlVersion: document.getElementById("sfmlVersion").value,
        isStatic: document.getElementById("sLinking").checked,
        linkAudio: document.getElementById("linkAudio").checked,
        linkNetwork: document.getElementById("linkNetwork").checked
    }};
    
    
}

function link(){
    
    let options = getOptions();
    if(!options.good){
        document.getElementById("infoSection").innerHTML = options.data;
        return;
    }
    
    
    let file = document.getElementById("projectPath").files[0];
    
    loadFile(file, function(data){
        
        let header = data.slice(0, data.indexOf("?>")+2);
        let parser = new DOMParser();
        let xmlData = parser.parseFromString(data,"text/xml");
        //console.log(parser);
        //console.log(xmlData);
        
        let linkedXml = modifyXML(xmlData, options.data);
        //console.log(linkedXml);
        
        if(linkedXml){
            console.log(header + "\n" + linkedXml);
            downloadFile(file.name, header + "\n" + linkedXml);
        }
    })
}

document.getElementById("linkButton").addEventListener("click", link);