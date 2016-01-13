angular.module('controller', [])
    //// controllers
    .controller('uploadCtrl', function($scope, Upload, CSV){

      // table sorting
      $scope.sortType = 'seq';
      $scope.sortReverse = false;

      // export as joined as CSV
      var exportData = function(data){
        var csvContent = new Array();

        var header = "MFR, Part #, Description, Cost, Retail, GSA Old Price, GSA New Price, Variance, Action";

        csvContent.push(header);

        for(var key in data){
        var _manu = data[key].manufacturer;
        var _part = data[key].part_no;
        var _desc = data[key].desc;
        var _cost = data[key].cost;
        var _retail = data[key].retail;
        var _old = data[key].old;
        var _new = data[key].new;
        var _var = data[key].var;
        var _diff = data[key].diff;
        
          var string = _manu + ", " + _part + ", " + _desc + ", " + _cost + ", " + _retail + ", $" + _old + ", $" + _new + ", " + _var + ", " + _diff;
          csvContent.push(string);
        }

        var buffer = csvContent.join("\n");
        var blob = new Blob([buffer], {
          "type":"text/csv;charset=utf8;"
        })
        var filename = 'merged_data.csv';

        $scope.linkObj = window.URL.createObjectURL(blob);
        $scope.linkDL = filename;

        // window.open(encodedUri);

      }


      // all having to do with file upload
      $scope.$watch('file_a', function (file_a) {
        $scope.upload_old($scope.file_a);
      });
      $scope.$watch('file_b', function (file_b) {
        $scope.upload_new($scope.file_b);
      });

      $scope.upload_old = function(file) {
          if(!file){
            return;
          }

              Upload.upload({
                  url: '/api/files/upload',
                  method: 'POST',
                  file: file,
                  data: $scope._id
              }).progress(function (evt) {
                  var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                  console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                  $scope.uploadProgress = progressPercentage;
              }).success(function (data, status, headers, config) {
                  CSV.get(file, function(csvdata){
                    $scope.oldfiledata = csvdata;
                  });

                  $scope.file_a_complete = true;
                  
                  setTimeout(function(){
                    $scope.file_a_complete = false
                  }, 5000);
              });
      };
      $scope.upload_new = function(file) {
          if(!file){
            return;
          }
              Upload.upload({
                  url: '/api/files/upload',
                  method: 'POST',
                  file: file,
                  data: $scope._id
              }).progress(function (evt) {
                  var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                  console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                  $scope.uploadProgress = progressPercentage;
              }).success(function (data, status, headers, config) {
                  $scope.file_b_complete = true;

                  setTimeout(function(){
                    $scope.file_b_complete = false
                  }, 5000);

                  // parse data from CSV and deal with it
                  CSV.get(file, function(csvdata){
                    $scope.newfiledata = csvdata;

                    $scope.showFile = true; 
                    $scope.merged_files = [];

                    for(var key in csvdata){
                      var diff, variation, description, added, removed, product, newdata, olddata, updated, newretail, newwholesale;

                      if(key == 0){
                        continue;
                      }

                      //set status of new data row
                      updated = false;

                      newdata = $scope.newfiledata[key];
                      if(newdata){
                        newretail = newdata[3];
                        if(newretail){
                          newretail = newretail.replace(',','');
                        }
                        newwholesale = newdata[4];
                        if(newwholesale){
                          newwholesale = newwholesale.replace(',','');
                        }
                        description = newdata[2];
                        if (description) {
                          description = description.replace(/,/g ,'');
                        }
                        newdata = newdata[6];

                        if(newdata){
                          newdata = newdata.replace('$','');
                          newdata = newdata.replace(',','');
                          newdata = parseFloat(newdata);
                        }
                      }

                      var oldLength = $scope.oldfiledata.length;


                      product = $scope.newfiledata[key];
                      var manufacturer = product[0];
                      var part_no = product[1];
                      

                      for(var i in $scope.oldfiledata){
                        //get the part number in the old file
                        var old_iteration = $scope.oldfiledata[i];
                        var old_iteration_pt_num = old_iteration[1];
                        
                        //if these part numbers match do things
                        if(old_iteration_pt_num == part_no){
                          olddata = $scope.oldfiledata[i];
                          olddata = olddata[6];

                          if(olddata){
                            olddata = olddata.replace('$','');
                            olddata = olddata.replace(',','');
                            olddata = parseFloat(olddata);
                          }

                          // check variation of value
                          if(newdata > olddata){
                            diff = 'increase';
                            variation = (newdata-olddata);
                          } else if(newdata < olddata) {
                            diff = 'decrease';
                            variation = -(olddata-newdata);
                          } else {
                            diff = "nochange";
                            variation = 0;
                          }

                          var obj = {
                            'manufacturer': manufacturer,
                            'part_no': part_no,
                            'old': olddata,
                            'new': newdata,
                            'var': variation.toFixed(2),
                            'add': '',
                            'del': removed,
                            'diff': diff,
                            'retail': newretail,
                            'cost': newwholesale,
                            'seq': key,
                            'desc': description
                          }

                          updated = true;

                          $scope.merged_files.push(obj);
                        } // end if comparison                       
                      } // end oldfile loop

                      // if there was no comparison found in the old file this is a new item
                      if(!updated){
                        olddata = '-';
                        added = "added";
                        variation = 0;
                        diff = 'added';

                        var obj = {
                          'manufacturer': manufacturer,
                          'part_no': part_no,
                          'old': olddata,
                          'new': newdata,
                          'var': variation.toFixed(2),
                          'add': added,
                          'del': removed,
                          'diff': diff,
                          'retail': newretail,
                          'cost': newwholesale,
                          'seq': key,
                          'desc': description
                        }

                        $scope.merged_files.push(obj); 
                      }
                    } // end new file loop

                    exportData($scope.merged_files);
                  }); // end function

              });
      };
    
    });