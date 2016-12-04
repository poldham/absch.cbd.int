define(['app', 'underscore', 'scbd-angularjs-services/generic-service', '/app/js/common.js', 'ngInfiniteScroll', 'moment', 'scbd-angularjs-controls',
    '/app/views/register/directives/register-top-menu.js',
    ], function (app, _) {

        "use strict";
        app.controller("subscriptionsCotroller", ["$scope", "$timeout", "IGenericService", "realm", "commonjs",
            function ($scope, $timeout, IGenericService, realm, commonjs) {
                $scope.filters = {};
                var filterQuery = {
                    $and: [                        
                        { "realm": realm.value },
                        {'isSystemAlert': $scope.filters.systemAlerts||false}
                    ]
                };
                
                $scope.length = 25;
                $scope.skip = 0;
                $scope.sort = { timestamp: -1 };
                
                
                $scope.loadSubscriptions = function (loadCount) {
                    if ($scope.loadingErrors || $scope.skip > Math.ceil($scope.recordCount / $scope.length))
                        return;

                    $scope.loadingErrors = true;
                    if(loadCount){
                         IGenericService.query('v2016', 'subscriptions', filterQuery, null, null, null, 1)
                                    .then(function (recordCount) {
                                        $scope.recordCount = recordCount.count;
                                    })
                    }
                    IGenericService.query('v2016', 'subscriptions', filterQuery, $scope.skip == 0 ? 0 : $scope.length * $scope.skip, $scope.length, $scope.sort)
                                    .then(function (errors) {
                                        $scope.skip++;
                                        $scope.errors = _.union($scope.errors||[], errors);
                                    })
                                    .finally(function(){ 
                                        $scope.loadingErrors = false;
                                    });
                }
                

                $scope.$watch('filters', function(newVal){

                    var queries = [ 
                                    { realm: realm.value }
                                  ]
                    if($scope.filters.endDate)
                        queries.push({ 'meta.createdOn': { "$lte": moment(moment($scope.filters.endDate).format("YYYY-MM-DD")).toISOString() } })
                    
                    if($scope.filters.startDate)
                        queries.push({ 'meta.createdOn': { "$gte": moment(moment($scope.filters.startDate).format("YYYY-MM-DD")).toISOString() } })
                    
                    queries.push({ 'isSystemAlert': $scope.filters.systemAlerts||false})
                    
                    filterQuery.$and = queries;
                    
                    $scope.errors = [];
                    $scope.recordCount = 0;
                    $scope.length = 25;
                    $scope.skip = 0;
                    $scope.loadSubscriptions(true);
                }, true)
                
                $scope.loadSubscriptions(true);
                
            }]);
    });
