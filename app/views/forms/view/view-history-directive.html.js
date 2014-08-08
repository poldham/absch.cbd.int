define(['app'], function (app) {

app.directive("viewHistory", [function () {
	return {
		restrict   : "EAC",
		templateUrl: "/app/views/forms/view/view-history-directive.html",
		replace    : true,
		transclude : false,
		scope: {
			documentID: "=documentId",
			loadDocuments: "=loadDocuments",
			government:  "=government"
		},
		link: function($scope, $element) {
		//	$element.find("[data-toggle='tooltip']").tooltip({trigger:'hover'});
		},
		controller: ['$scope', 'IStorage', "$q","$route",
			function ($scope, storage, $q,$route) {

			$scope.$watch('documentID', function(value){
				if(value && !$scope.documents){
					$scope.load($scope.documentID);
				}
				else
					$scope.loading=false;
			});

			$scope.$watch('loadDocuments', function(value){
				if(value && !$scope.documents){
					$scope.load($scope.documentID);
				}
				else
					$scope.loading=false;
			});


			//==================================
			//
			//==================================
			$scope.load = function (identifier) {

				$scope.error = undefined;

				if(!identifier)
				{
					$scope.loading=false;
					return;
				}
				var qDocument     = storage.documentVersions.get(identifier,{body:true});
				// .then(function(result) { return result.data || result });

				$q.when(qDocument).then(function(results) {

					$scope.documents     = results.data.Items;
					if($scope.documents && $scope.documents.length >0 && ($scope.documents[0].type=="absPermit" || $scope.documents[0].type=="absCheckpointCommunique"))
					 	$scope.showFile = true;
// console.log($("[data-toggle='tooltip']"));
// 					$("[data-toggle='tooltip']").tooltip({trigger:'hover'});

				}).then(null, function(error) {
					$scope.error = "error loading document history";
					 console.log( $scope.error );
				})

			};


		}]
	};
}]);
});
