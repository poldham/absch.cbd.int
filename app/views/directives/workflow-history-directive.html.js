define(['app'], function(app) {

    app.directive('workflowHistory', ["$q", "$timeout", "underscore",
        function($q, $timeout, _) {

            return {
                restrict: 'EAC',
                replace: false,
                templateUrl: '/app/views/directives/workflow-history-directive.html',
                scope: {
                    documentId: '='
                },
                link: function($scope, $element) {

                },
                controller: ["$scope", "IWorkflows", '$element',
                    function($scope, IWorkflows, $element) {


                        $scope.showPreviousHistory = function() {
                            if (!$scope.workflowHistory) {
                                $scope.loading = true;
                                IWorkflows.query({
                                        "data.identifier": $scope.documentId
                                    })
                                    .then(function(data) {
                                        $scope.workflowHistory = data;
                                    })
                                    .finally(function(){
                                        $scope.loading = false;
                                    });
                            }
                        }

                        $scope.formatWID = function(workflowID) {
                            return workflowID ? workflowID.replace(/(?:.*)(.{3})(.{4})$/g, "W$1-$2") : "";
                        };

                    }
                ]
            };

        }
    ]);
});
