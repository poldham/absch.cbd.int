define(['app'], function (app) {

app.directive("viewAbsNationalReport", [function () {
	return {
		restrict   : "EAC",
		templateUrl: "/app/views/forms/view/view-abs-national-report.directive.html",
		replace    : true,
		transclude : false,
		scope: {
			document: "=ngModel",
			locale  : "=",
			target  : "@linkTarget",
			hide	: "@"
		},
		controller : ["$scope", "underscore", "commonjs", "$filter", function ($scope, _, commonjs, $filter)
		{

			//====================
			//
			//====================
			$scope.display = function(field) {

				if(!$scope.hide) return true; //show all fields

				return( $scope.hide.indexOf(field) >= 0 ? false : true);
			}


			//==================================
		    //
		    //==================================
		    $scope.booleanToText = function(item) {
		        if (item===undefined)
		        	return "No selection made";
				return item ? "Yes" :  "No";
			}


			//==================================
		    //
		    //==================================
		    $scope.q18BooleanToText = function(item) {
		        if (item===undefined || !item)
		        	return "No selection made";
				else return "Yes" ;
			}


			//==================================
		    //
		    //==================================
		    $scope.q42BooleanToText = function(item) {
		        if (item===undefined || !item)
		        	return "No selection made";
				else return "Yes" ;
			}

			//==================================
		    //
		    //==================================
		    $scope.conditionalBooleanToText = function(condition, item) {
		    	if(condition)
		    		return "Not applicable";
		    	if(!condition)
		    	{
		    		if (item===undefined)
		        		return "No selection made";
		        
					return item ? "Yes" :  "No";
				}
		    }


			//==================================
		    //
		    //==================================
		    $scope.text = function(input) {
		        if (input===undefined)
		        	return "No information provided";
		        
				return input;
			}


			//==================================
		    //
		    //==================================
		    $scope.getLink = function(reference) {

		    	if(!reference)
		    		return;

		        if ((reference.identifier).indexOf("52000000cbd") == 0) {
					
		        	return "https://www.cbd.int/kb/record/focalPoint/" + commonjs.hexToInteger(reference.identifier);
		        }
				var revsionNumber = '';
		        if(reference.identifier.indexOf('@')>=0)
				    revsionNumber = reference.identifier.substr(reference.identifier.indexOf('@')+1, reference.identifier.length - (reference.identifier.indexOf('@')+1));
				
				var UID = $filter("uniqueIDWithoutRevision")(reference.identifier);
				if(!UID)
					return;

				var schema = UID.split('-')[1];

				return  "/database/" + schema + '/' + UID + (revsionNumber ? ('/' + revsionNumber) : '');
			}

			//==================================
		    //
		    //==================================
		    $scope.getLinkText = function(reference) {

		    	if(!reference)
		    		return;

		        if ((reference.identifier).indexOf("52000000cbd") == 0) {
					
		        	return "https://www.cbd.int/kb/record/focalPoint/" + commonjs.hexToInteger(reference.identifier);
		        }
		        
				return  $filter("uniqueID")(reference.identifier);
			}


			//==================================
		    //
		    //==================================
		    $scope.documentReferenceIDsEmpty = function(reference) {

		    	return _.isEmpty(reference);
			}


		}]
	};
}]);

});


_.isEmpty