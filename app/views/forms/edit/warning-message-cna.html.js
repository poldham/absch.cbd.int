
define(['app', 'underscore', '/app/js/common.js',
'/app/views/search/search-results/result-default.js', 
'/app/services/search-service.js',
'/app/services/app-config-service.js'
], function(app, _) {

    app.directive('warningMessageCna', function() {
        return {
           restrict: 'EAC',
           replace: true,
           templateUrl: "/app/views/forms/edit/warning-message-cna.html",
           scope: {
                doc:'='
           },
           controller: ["$scope", "underscore", "searchService", "appConfigService","$q",
                function($scope,  _, searchService, appConfigService, $q) {

                 $scope.responsibleCNA = [];
                 $scope.showWarning = false;
                 
                //==================================
                //
                //==================================
                function moreCNAAllowed() {

                    if(!$scope.doc.government)
                    {
                        console.log($scope.doc);
                        return;
                    }
                    
                    var searchOperation;
                    var q  = "government_s:" + $scope.doc.government.identifier + " AND schema_s:authority AND absResposibleForAll_b:true"
                    
                    var queryParameters = {
                        'query'    : q,
                        'currentPage' : 0,
                        'rowsPerPage': 1000
                    };
                    
                    searchOperation = searchService.list(queryParameters, null);

                    $q.when(searchOperation)
                        .then(function(data) {
                            $scope.responsibleCNA = data.data.response;
                        }).catch(function(error) {
                            console.log('ERROR: ' + error);
                        })
                        .finally(function(){
                            var found;
                            found =  _.find($scope.responsibleCNA.docs, function(item){
                                if($scope.doc.header.identifier === item.identifier_s){
                                    return true;
                                }
                            });
                           if (found)
                                $scope.showWarning= false;
                           else 
                                $scope.showWarning = true;
 
                        });
   
                }
                
                //==================================
                //
                //==================================
                 $scope.$watch('doc', function(newVal,oldVal){
					//if(newVal !== oldVal)
						moreCNAAllowed();
				 })
                 
          
            }],
        };
    });
});


