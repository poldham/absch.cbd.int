define(['app',], function (app) {
// ,
//     './tasks/my-completed-tasks.directive.html.js',
//     './tasks/my-pending-tasks.directive.js',
//     './tasks/my-tasks.directive.js'
"use strict";
//require("app", "dragAndDrop")

app.controller("DashboardController", 
	["$rootScope", "$scope", "underscore", "lstringFilter","IWorkflows","realm","$q",
	function ($rootScope, $scope, _, lstringFilter,workflows,realm,$q) {

    //intro.js configurations
    $scope.introOptions = {
      steps: [
        {
          element: '#dashboard_panels',
          intro: 'Use these panels to get an overview of your documents and requests, as well as view the detail lists of requests.',
        },
        {
          element: '#myTabContent',
          intro: 'This feed give an overview of the activities of all members.',
        },
        {
          element: '#document_type_links',
          intro: 'To create a new document or view and edit current documents, select the type of document you want work with here.',
          position: 'right',
        },
        {
          element: '.label',
          intro: 'These labels describe the number of documents in each phase.<br />Green is published<br />Gray is draft<br />Red is Requests',
          position: 'right',
        },
      ],
    };



  //TODO: this is almost identical to type_document_list.html.js... inherit them

	$scope.dashboardFilter = "All";

 	$scope.setDashFilter = function(filter){
 			$scope.dashboardFilter = filter;
 	}
 	$scope.isFilter = function(filter){
 			return	$scope.dashboardFilter == filter || $scope.dashboardFilter == "All";
 	}


    var myUserID = $scope.$root.user.userID;
    var query    = {  
                $and : [
                    { "createdBy" : myUserID }, 
                    { closedOn : { $exists : true } },
                    { "data.realm" : realm }
                ]                
            };
    $q.when(workflows.query(query), function(data){
        $scope.completedRequestCount = data.length;    
    });
     $scope.completedRequestCount = 0
     $scope.pendingCount = 0;
     $scope.urgentAttentionCount = 0;

 	
}]);
});
