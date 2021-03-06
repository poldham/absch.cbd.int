define(['app'], function (app) {

app.directive("viewOrganizationReference", [function () {
	return {
		restrict: "EAC",
		templateUrl: "/app/views/forms/view/view-organization-reference.directive.html",
		replace: true,
		transclude: false,
		scope: {
			document: "=ngModel",
			locale: "=",
			target: "@linkTarget"
		},
		controller: ["$scope", "IStorage", function ($scope, storage){

			$scope.$watch("document", function(newVal)
			{
				if(newVal && newVal.identifier)
					loadReferences(newVal);
				else
					$scope.organization = newVal;
			});
			function loadReferences(ref) {

				storage.documents.get(ref.identifier, { cache : true})
					.success(function(data){
						$scope.organization = data;
					})
					.error(function(error, code){
						if (code == 404) {

							storage.drafts.get(ref.identifier, { cache : true})
								.success(function(data){
									$scope.organization = data;
								});
						};

					});
			};

		}]
	};
}]);
});
