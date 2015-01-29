 define(['app',
   '/app/views/forms/view/record-loader.directive.html.js',
   '/app/views/directives/document-list.partial.html.js',
   '/app/views/forms/view/view-abs-checkpoint.directive.js',
   '/app/views/forms/view/view-abs-checkpoint-communique.directive.js',
   '/app/views/forms/view/view-abs-permit.directive.js',
   '/app/views/forms/view/view-authority.directive.js',
   '/app/views/forms/view/view-authority-reference.directive.js',
   '/app/views/forms/view/view-contact.directive.js',
   '/app/views/forms/view/view-contact-reference.directive.js',
   '/app/views/forms/view/view-database.directive.js',
   '/app/views/forms/view/view-measure.directive.js',
   '/app/views/forms/view/view-organization.directive.js',
   '/app/views/forms/view/view-organization-reference.directive.js',
   '/app/views/forms/view/view-resource.directive.js',
   '/app/js/directives/angucomplete-extended.js',
   '/app/js/common.js', 'jqvmap', 'jqvmapworld',
   '/app/views/countries/country-map-list-directive.html.js'
 ], function(app) {

   app.controller("ProfileController", ["$scope", "authHttp", "$routeParams", "linqjs", "$filter", "realm", "commonjs", "$q", '$element', '$timeout',
     function($scope, $http, $routeParams, linqjs, $filter, realm, commonjs, $q, $element, $timeout) {


       $scope.showMap = function(newValue) {
         if (newValue) {
           $element.find('#countryDetails').slideUp('slow');
           $element.find('#worldMap').slideDown('slow');
         } else {
           $element.find('#worldMap').slideUp('slow');
           $element.find('#countryDetails').slideDown('slow');
         }
       }

       $scope.loadCountryDetails = function(countryCode) {

         $scope.code = countryCode || $routeParams.code;
         $scope.documentCount = 0;
         $scope.currentPage = 0;
         $scope.searchText = '';
         $scope.autocompleteData = [];
         $scope.absch_nfp = null;
         //*******************************************************
         if ($scope.code) {
           $scope.showMap(false);
           $http.get('/api/v2013/countries/' + $scope.code.toUpperCase(), {
             cache: true
           }).then(function(response) {
             $scope.country = response.data;
             $scope.searchText = '';
             $scope.autocompleteData = [];
             $scope.entryIntoForceDate = moment($scope.country.treaties.XXVII8b.deposit).add(90, 'days');
           });
           //*******************************************************
           $http.get('/api/v2013/index/select?cb=1394816088237&fl=id,identifier_s,title_t,description_t,url_ss,schema_EN_t,date_dt,government_s,government_EN_t,schema_s,number_d,aichiTarget_ss,reference_s,sender_s,meeting_ss,recipient_ss,symbol_s,eventCity_EN_t,eventCountry_EN_t,startDate_s,endDate_s,body_s,code_s,meeting_s,group_s,function_t,department_t,organization_t,summary_EN_t,reportType_EN_t,completion_EN_t,jurisdiction_EN_t,development_EN_t&q=(realm_ss:' + realm.value.toLowerCase() + ' or realm_ss:absch)+AND+schema_s:*+AND+((+schema_s:*+))+AND+((+government_s:' + $scope.code.toLowerCase() + '+))+AND+(*:*)&rows=25&sort=createdDate_dt+desc,+title_t+asc&start=0&wt=json', {
             cache: true
           }).then(function(response) {
             $scope.absch_nfp = response.data;
             // console.log($scope.absch_nfp);

             $scope.absch_nfp.response.docs.forEach(function(document) {
               $scope.autocompleteData.push({
                 title: document.title_t ? document.title_t : ''
               });
               $scope.autocompleteData.push({
                 title: document.description_t ? document.description_t : ''
               });
               $scope.autocompleteData.push({
                 title: document.department_t ? document.department_t : ''
               });
               $scope.autocompleteData.push({
                 title: document.organization_t ? document.organization_t : ''
               });
             });
           });
         }
       }
       $scope.loadCountryDetails();
       $scope.isInbetweenParty = function() {
         if ($scope.country)
           return moment().diff(moment($scope.country.treaties.XXVII8b.deposit), 'days') < 90;
         return '';
       }
       $scope.$watch('absch_nfp', function(value) {

         if (!value) return;

         $scope.getFacets(value.response.docs);


       });

       $scope.getFacets = function(data) {

         var linqObj = linqjs.from(data);
         $scope.nationalAuthority = linqObj.count(function(schema) {

           return schema.schema_s.toLowerCase() == 'authority';
         });
         //console.log(response.data.response.docs);
         $scope.nfpCount = linqObj.count(function(schema) {
           // console.log(schema.schema_EN_t.toLowerCase() + ' ' + 'national focal point'.toLowerCase());
           return schema.schema_s.toLowerCase() == 'focalpoint'.toLowerCase();
         });

         $scope.nationalMeasure = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'measure';
         });

         $scope.Permit = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'abspermit';
         });

         $scope.absCheckpoint = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'abscheckpoint';
         });

         $scope.absCheckpointCommunique = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'abscheckpointcommunique';
         });

         $scope.database = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'database';
         });
         $scope.resource = linqObj.count(function(schema) {
           return schema.schema_s.toLowerCase() == 'resource';
         });
       }

       $scope.$watch('searchText.$', function(value) {

         if (undefined == value || value == null || $scope.absch_nfp == null) return;
         $scope.getFacets($filter('filter')($scope.absch_nfp.response.docs, value));


       });

       $scope.showlist = false;



       if ($routeParams.commonFormat || $routeParams.code)
         $scope.showMap(false);
       else
         $scope.showMap(true);


       //    $(".toggleMe").click(function(e) {
       //
       //        e.preventDefault();
       //        $("#wrapper").toggleClass("active");
       //        $("#sidebar-wrapper").toggleClass("hide");
       //        $("#sidebar-wrapper").toggleClass("show");
       //
       //    });
     }
   ]);

 })
