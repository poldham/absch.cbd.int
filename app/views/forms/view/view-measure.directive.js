define(['app',
        '/app/views/measure-matrix/measure-matrix-elements-derective.html.js',
        '/app/services/search-service.js', '/app/services/app-config-service.js','/app/views/directives/party-status.js',
    '/app/views/forms/view/view-contact-reference.directive.js'
    ], function (app) {

app.directive("viewMeasure", [function () {
	return {
		restrict   : "EAC",
		templateUrl: "/app/views/forms/view/view-measure.directive.html",
		replace    : true,
		transclude : false,
		scope: {
			document    : "=ngModel",
			locale      : "=",
			target      : "@linkTarget",
			allowDrafts : "@",
			hide		: "@"
		},
		controller : ["$scope", "IStorage","$filter", "searchService", "$q", "appConfigService",
         function ($scope, storage, $filter, searchService, $q, appConfigService)
		{
			//====================
			//
			//====================
			$scope.display = function(field) {

				if(!$scope.hide) return true; //show all fields

				return( $scope.hide.indexOf(field) >= 0 ? false : false);
			}

            $scope.$watch("document", function (_new) {
				if ($scope.document && $scope.document.header
                    && $scope.document.header.identifier) {
                        var queries = [];
                        if(!$scope.document.measureAmendedBy){
                            var listQuery = {
                                query: 'realm_ss:' + appConfigService.currentRealm.toLowerCase() +
                                 ' AND schema_s:measure AND NOT virtual_b:* AND amendedMeasures_ss:'  + $scope.document.header.identifier+'*'
                            };
                            queries.push(searchService.list(listQuery));
                        }
                        // if(!$scope.document.linkedMeasures){
                        //     var listQuery = {
                        //         query: 'realm_ss:' + appConfigService.currentRealm.toLowerCase() +
                        //          ' AND schema_s:measure AND NOT virtual_b:* AND linkedMeasures_ss:'  + $scope.document.header.identifier+'*'
                        //     };
                        //     queries.push(searchService.list(listQuery));
                        // }
                        $q.all(queries)
                          .then(function(data){
							  if(data[0])
                              	$scope.document.measureAmendedBy = data[0].data.response.docs;
                            //   if(data[1])
							//   	$scope.document.linkedMeasures = data[1].data.response.docs;
                              if($scope.measureMatrixApi)
							  	$scope.measureMatrixApi.reloadMatrix(true);
                          });
				}
			});

			$scope.showLanguage = function(model, type){

				if(type=='file'){
					return $filter("term")(model);
				}
				else
					return model;
			}

		
		}]
	};
}]);

});
