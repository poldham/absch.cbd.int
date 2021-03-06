define(['app'], function(app) {

    app.directive('nationalFilter', function($timeout) {
        return {
            restrict: 'EAC',
            replace: true,
            // transclude: true,
            require:'^searchDirective',
            templateUrl: '/app/views/search/search-filters/national-filter.html',
            scope:false,
            link: function($scope, $element, $attrs, searchDirectiveCtrl) {
               
               $scope.nf_searchFilters = searchDirectiveCtrl.getSearchFilters('national');
               $scope.nf_partyStatus = searchDirectiveCtrl.getSearchFilters("partyStatus");
               
               
                  $timeout(function(){
                                $element.find('[data-toggle="tooltip"]').tooltip();
                            },50);
   
            }//link
        };
    });
});
