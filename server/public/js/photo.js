//inject angular file upload directives and services.
angular.module('myApp')

.controller('ctrlPhoto', function($scope, $http, $rootScope, $upload, $timeout){
	// Check that the browser supports the FileReader API.
	if (!window.FileReader) {
		document.write('<strong>Sorry, your web browser does not support the FileReader API.</strong>');
		return;
	}

    // UPLOAD CLASS DEFINITION
    // ======================

    var dropZone = document.getElementById('drop-zone');
    var uploadForm = document.getElementById('js-upload-form');
    var files;
    var exif_data;
    var listOfEXIF = [];
    var JSONObjFinal;
    var listOfJSONFinal = [];
    var centerOfList = [];
    var checkTotalHaveToClose = true;
    var maxDistance = 25;

    $scope.listImgThumb = [];
    $scope.percent = 0;
    $scope.progress = 0;
    
    // $scope.listImgThumb.push("test1");
    // $scope.listImgThumb.push("test2");
    // $scope.listImgThumb.push("test3");

    document.getElementById("js-upload-files").onclick = function(e) {
    	listOfEXIF = [];
    	listOfJSONFinal = [];
    	centerOfList = [];
    	checkTotalHaveToClose = true;
    }

    document.getElementById("js-upload-files").onchange = function(e) {
        files = e.target.files;
    	//console.log(files);
        //handleFile(files);	
        //uploadImg(files);
        if(files.length != 0){
        	for (var i = 0; i < files.length; i++) {
		    handleFile(files[i], i);
			}
			$timeout(function() {
				checkNearBy();
			}, 10);	
			//console.log(files);
			showThumbnail(e);
        }
        else{
        	listOfEXIF = [];
        }
    }

	function handleFile(file, i) {
	    var reader = new FileReader();  
	    var exif;
	    reader.onload = function(e) {  
	       try {
		        // get file content  
		        var text = e.target.result; 
		        //console.log(text);

		        exif = new ExifReader();
				// Parse the Exif tags.
				exif.load(e.target.result);

				// Or, with jDataView you would use this:
				//exif.loadView(new jDataView(event.target.result));

				// The MakerNote tag can be really large. Remove it to lower memory usage.
				exif.deleteTag('MakerNote');
				exif_data = exif.getAllTags();
				//console.log(exif_data);
				listOfEXIF.push(exif_data);
				//showDataInTable(exif_data);
			} catch (error) {
				alert(error);
			}
	    }
	    //reader.readAsText(file, "UTF-8");

    	reader.readAsArrayBuffer(files[i].slice(0, 128 * 1024));	
	}

	

	showDataInTable = function(tags){
		var tableBody, name, row;
		tableBody = document.getElementById('exif-table-body');
		for (name in tags) {
			if (tags.hasOwnProperty(name)) {
				row = document.createElement('tr');
				row.innerHTML = '<td>' + name + '</td><td>' + tags[name].description + '</td>';
				tableBody.appendChild(row);
			}
		}
	}

    $scope.submitPhoto = function(){
    	var idList = [];
    	//console.log(listOfEXIF);
    	for(var i = 0 ; i < listOfEXIF.length ; i++){
    		listOfJSONFinal.push(findExif(listOfEXIF[i]));
    	}

		//console.log(listOfJSONFinal);

    	if(listOfJSONFinal != null && checkTotalHaveToClose){
   			$http.post('http://shead.cloudapp.net:3000/api/ImageMetadatas', listOfJSONFinal)
			.success(function(data, status, headers, config) {
			    //console.log("Status : " + status + ", save metadata complete!");
			    for(var i = 0 ; i < data.length ; i++){
			    	console.log("Status : " + status + ", ID : "+data[i].id+", save metadata complete!");
			    	idList.push(data[i].id);
			    }
			    	uploadImg(idList); 
			})
			.error(function(data, status, headers, config) {
			    
			});
			
    	}
    	else{
    		console.log("No GPS data or not select file.");
    	}

	}
    
    dropZone.ondrop = function(e) {
        e.preventDefault();
        this.className = 'upload-drop-zone';
        //handleFile(e.dataTransfer.files);
        files = e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
		    handleFile(files[i], i);
		}
    }

    dropZone.ondragover = function() {
        this.className = 'upload-drop-zone drop';
        return false;
    }

    dropZone.ondragleave = function() {
        this.className = 'upload-drop-zone';
        return false;
    }

    $scope.go = function(path) {
  		$location.path(path);
	};

	
	uploadImg = function(idList) {
	    //$files: an array of files selected, each file has name, size, and type. 

	    //var file = $files;
		//console.log($files, id);
		var fileList = [];
		var nameList = [];
		//console.log(idList);

		//console.log(files);
		for(var i = 0 ; i < files.length ; i++){
			fileList.push(files[i]);
			nameList.push(idList[i] + (files[i].type === "image/jpeg" ? ".jpg" : ""));
		}
		//console.log(fileList);
		//console.log(nameList);

		$scope.upload = $upload
		.upload({
		    url: 'http://shead.cloudapp.net:3000/api/containers/images/upload', //upload.php script, node.js route, or servlet url 
		    method: 'POST', 
		    //headers: {'header-key': 'header-value'}, 
		    //withCredentials: true, 
		    //data: {myObj: "test11111111"},
		    file: fileList, // or list of files ($files) for html5 only 
		    //fileName: id + (file.type === "image/jpeg" ? ".jpg" : "")
		    fileName: nameList,
		    // customize file formData name ('Content-Desposition'), server side file variable name.  
		    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'  
		    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code 
		    //formDataAppender: function(formData, key, val){} 
		  }).progress(function(evt) {
		    //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
		    $scope.percent = parseInt(100.0 * evt.loaded / evt.total);
		    //console.log($scope.percent);
		    //console.log(evt);
		  }).success(function(data, status, headers, config) {
		    // file is uploaded successfully
		    for(var i = 0 ; i < data.result.files.file.length ; i++){
		    	console.log("Status : " + status + ", upload " + data.result.files.file[i].name + " complete!");	
		    }
		    
		    listOfEXIF = [];
		    listOfJSONFinal = [];
		    fileList = [];
			nameList = [];
		    console.log(data);
		  });
			
      //.error(...) 
      //.then(success, error, progress);  
      // access or attach event listeners to the underlying XMLHttpRequest. 
      //.xhr(function(xhr){xhr.upload.addEventListener(...)}) 
    }
    /* alternative way of uploading, send the file binary with the file's content-type.
       Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed. 
       It could also be used to monitor the progress of a normal http post/put request with large data*/
    // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code. 
  	// };

  	checkNearBy = function(){
  		list = [];
  		var checkTotalHaveGPS;
  		for(var i = 0 ; i < listOfEXIF.length ; i++){
  			if(listOfEXIF[i].GPSLatitude != undefined && listOfEXIF[i].GPSLongitude != undefined){
  				list.push([listOfEXIF[i].GPSLatitude.description, listOfEXIF[i].GPSLongitude.description]);	
  				checkTotalHaveGPS = true;
  			}
  			else{
  				console.log("File " + files[i].name + " not have GPS.");
  				checkTotalHaveGPS = false;
  				checkTotalHaveToClose = false;
  			}
  		}
  		if(checkTotalHaveGPS){
  			centerOfList = getLatLngCenter(list);
	  		for(var i = 0 ; i < listOfEXIF.length ; i++){
	  			//console.log(calculateDistance(centerOfList[0],centerOfList[1],listOfEXIF[i].GPSLatitude.description,listOfEXIF[i].GPSLongitude.description));
	  			if(calculateDistance(centerOfList[0],centerOfList[1],listOfEXIF[i].GPSLatitude.description,listOfEXIF[i].GPSLongitude.description) > maxDistance){
	  				checkTotalHaveToClose = false;
	  				break;
	  			}
	  			else{
	  				checkTotalHaveToClose = true;
	  			}
	  		}
  		}
  		if(checkTotalHaveToClose){
  			console.log("Can be upload");
  		}
  		else{
  			console.log("GPS point not close");
  		}
  	}

  	function calculateDistance(lat1, lon1, lat2, lon2) {
		var R = 6371000; // metres
		var dLat = (lat2 - lat1).toRad();
		var dLon = (lon2 - lon1).toRad(); 
		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
			Math.sin(dLon / 2) * Math.sin(dLon / 2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
		var d = R * c;
		return d;
	}
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}

	$scope.cancelUpload = function(){
		$scope.upload.abort();
		console.log("canceled.");
		$timeout(function() {
			$scope.percent = 0;
		}, 10);	
	}

	var processedCount=0; // global variable
	var totalFiles = 0; // global variable

    showThumbnail = function(evt){
    	var files = evt.target.files; // FileList object

		totalFiles = files.length; // important

		// files is a FileList of File objects. List some properties.
		for (var i = 0, f; f = files[i]; i++) {
		//Create new file reader
		var r = new FileReader();
		//On load call
		r.onload = (function(theFile){
		    return function(){
		      onLoadHandler(this,theFile);
		      onLoadEndHandler();
		   };
		})(f);
		r.readAsDataURL(f);
		}
    }
 
 	function onLoadEndHandler(){
	  processedCount++;
	  if(processedCount == totalFiles){ 
	    console.log($scope.listImgThumb);
	  }
	  $timeout(function() {
	  	$scope.progress = processedCount/files.length;
	  }, 10);
	}

	function onLoadHandler(fileReader, file){
		$scope.listImgThumb.push(fileReader.result);
	}

});