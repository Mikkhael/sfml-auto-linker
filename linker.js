function getChildByTag(element, childTag, nth = 0){
    for(let elem of element.children){
        if(elem.localName === childTag){
            if(nth <= 0){
                return elem;
            }
            nth--;
        }
    }
    return null;
}

function getChildByTagWithProperty(element, childTag, propertyName, propertyValue, nth = 0){
    for(let elem of element.children){
        if(elem.localName === childTag && elem.attributes[propertyName] && elem.attributes[propertyName].value === propertyValue){
            if(nth <= 0){
                return elem;
            }
            nth--;
        }
    }
    return null;
}

function appendIfNotExists(element, tag, property, value){
    for(let elem of element.children){
        //console.log("CJ", elem.attributes[property], value, elem.attributes[property] === value);
        if(elem.localName === tag && elem.attributes[property] && elem.attributes[property].value === value){
            return;
        }
    }
    element.innerHTML += `<${tag} ${property}="${value}" />`;
}

function ereseIfMatches(element, tag, property, valueRegExp){
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

function modifyXML(xmlData, options){
    
    //console.log(options);
    
    let anchor = xmlData.firstChild;
    //console.log(anchor);
    
    let project = getChildByTag(anchor, "Project");
    let build = getChildByTag(project, "Build");
    let compiler = getChildByTag(project, "Compiler");
    let linker = getChildByTag(project, "Linker");
    
    
    ereseIfMatches(compiler,  "Add", "directory", /\/sfml\/.*include/i);
    appendIfNotExists(compiler, "Add", "directory", options.sfmlDirectory + "include");
    ereseIfMatches(linker,  "Add", "directory", /\/sfml\/.*lib/i);
    appendIfNotExists(linker,   "Add", "directory", options.sfmlDirectory + "lib");
    
    if(options.isStatic){
        appendIfNotExists(compiler, "Add", "option", "-DSFML_STATIC");
    }
    
    
    
    
    //console.log(compiler);
    console.log(anchor.innerHTML);
    
}


function getOptions(){
    
    let sfmlDirectory = document.getElementById("sfmlPath").value.trim().replace("\\", "/");
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
        
        parser = new DOMParser();
        xmlData = parser.parseFromString(data,"text/xml");
        
        modifyXML(xmlData, options.data);
    })
}

document.getElementById("linkButton").addEventListener("click", link);