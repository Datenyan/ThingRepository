function convertToB64() {
    var filesSelected = document.getElementById("imageInput").files;
        if (filesSelected.length > 0) {
            var fileToLoad = filesSelected[0];
            var fileReader = new FileReader();

            fileReader.onload = function(fileLoadedEvent) {
                var fileSize = document.getElementById('imageInput').files[0].size;
                fileSize = fileSize / 1024 / 1024;
                // Check filesize before anything else
                if (fileSize >= 120) {
                    alert("File is too large!");
                    document.getElementById('imageInput').files = null;
                    document.getElementById('imageInput').value = "";
                } else {
                    var srcData = fileLoadedEvent.target.result;
                    srcData = srcData.replace(/^data:image.+;base64,/, '');
                    document.getElementById("imageB64").value = srcData;
                } 
            }
        fileReader.readAsDataURL(fileToLoad);
    }
}  
function displayLoading() {
    let nameInput = document.getElementsByName('name')[0];
    let descInput = document.getElementsByName('description')[0];
    let priceInput = document.getElementsByName('price')[0];
    let dateInput = document.getElementsByName('date')[0];

    if (nameInput.value != "" && descInput.value != "" && priceInput.value != "" && dateInput.value != "") {
        document.getElementById('waitText').style.display = "flex";
    }
}