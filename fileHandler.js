function loadFile(file, callback){
    
    let fileReader = new FileReader();
    fileReader.onload = function(event) {
        callback(event.target.result);
    };
    fileReader.readAsText(file);
    
}