function loadFile(file, callback){
    
    let fileReader = new FileReader();
    fileReader.onload = function(event) {
        callback(event.target.result);
    };
    fileReader.readAsText(file);
    
}

function downloadFile(filename, data){
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}