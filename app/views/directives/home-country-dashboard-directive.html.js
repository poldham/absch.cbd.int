define(['app'], function (app) {
	app.directive('homeCountryDashboard', function($http){
		return{
			restrict: 'EAC',
			replace:true,
			templateUrl: '/app/views/directives/home-country-dashboard-directive.html',
			link : function($scope, $element){
				//$element.find("[data-toggle='tooltip']").tooltip({trigger:'hover'});
			},
			controller: ['$scope', '$filter','schemaTypes', 'realm', '$q', 'underscore', function($scope, $filter, schemaTypes, realm, $q, _){
                var referenceRecordSchemas = ['resource','modelContractualClause', 'communityProtocol'];
                
				$scope.wellChanged = function(facet){
					$scope.currentFacet = facet;
				}
                $scope.options  = {
                      countries		: function() {
                        return $http.get("/api/v2013/thesaurus/domains/countries/terms", { cache: true }).then(function(o){
                          var countries = $filter("orderBy")(o.data, "name");
                          _.each(countries, function(element) {
                            element.__value = element.name;
                          });
                          return countries;
                        });
                      }
                }
                $scope.genericFilter = function($query, items) {
                  var matchedOptions = [];
                  for(var i=0; i!=items.length; ++i)
                    if(items[i].__value.toLowerCase().indexOf($query.toLowerCase()) !== -1)
                      matchedOptions.push(items[i]);

                  return matchedOptions;
                };

                $scope.genericMapping = function(item) {
                  return {identifier: item.identifier};
                };
                $scope.$watch('document.countryStats', function(newValue){
                    //console.log(newValue)
                    if(newValue && newValue.identifier){
                        $scope.loadFacets(newValue.identifier);
                    }
                    else if(newValue ==null)
                        $scope.loadFacets();
                })

				schemas = _.clone(schemaTypes);
				//schemas.push('focalPoint');

    			$scope.loadFacets = function(country){

                    var countryQuery = '';
                    $scope.loadingFacets = true;

                    if(country){
                        countryQuery = ' AND government_s:' + country;
                    }

					var queryFacetsVLRParameters = {
                        'q': '(realm_ss:' + realm.value.toLowerCase() + ') AND NOT version_s:* AND schema_s:(resource modelContractualClause communityProtocol)',
                        'fl': '', 		//fields for results.
                        'wt': 'json',
                        'rows': 0,		//limit
                        'facet': true,	//get counts back
						'facet.query': '(realm_ss:' + realm.value.toLowerCase() + ') AND NOT version_s:* AND (schema_s:(resource modelContractualClause communityProtocol))',
                        'facet.field': ['schema_s'],
                        'facet.limit': 512
                    };
                    var queryFacetsVLR = $http.get('/api/v2013/index/select', { params: queryFacetsVLRParameters })

    				var queryFacetsParameters = {
                        'q': '(realm_ss:' + realm.value.toLowerCase() + ' or realm_ss:absch) AND NOT version_s:* AND ((schema_s:'
                                          + schemas.join(' OR schema_s:') + ') OR (schema_s:focalPoint AND type_ss:ABS-FP)) '+ countryQuery ,
                        'fl': '', 		//fields for results.
                        'wt': 'json',
                        'rows': 0,		//limit
                        'facet': true,	//get counts back
                        'facet.pivot': 'government_s,schema_s',
                        'facet.limit': 512
                    };

                    var queryFacets = $http.get('/api/v2013/index/select', { params: queryFacetsParameters });
					var countries = $http.get('/api/v2013/countries');

					$q.all([queryFacets, queryFacetsVLR, countries]).then(function (results) {
						console.log(results)
                        var tempFacets = {};
						tempFacets['absPermit'] = {"facetCount" :0,"countryCount" :0,"id": getSequence('absPermit')};
						tempFacets['absCheckpointCommunique'] = {"facetCount" :0,"countryCount" :0,"id": getSequence('absPermit')};
                        _.each(results[0].data.facet_counts.facet_pivot['government_s,schema_s'], function(data){
                            _.each(data.pivot, function(facets){
                                tempFacets[facets.value] = {"facetCount" : (tempFacets[facets.value] ? tempFacets[facets.value].facetCount : 0) + facets.count,
                                                "countryCount" : (tempFacets[facets.value] ? tempFacets[facets.value].countryCount : 0) + 1,
												"id": getSequence(facets.value)};
                            });

                        });

						var resourceFacets = results[1].data.facet_counts.facet_fields.schema_s;
						for (var i = 0; i < resourceFacets.length; i += 2) {
		                    var facet = resourceFacets[i];
							if(_.contains(referenceRecordSchemas,facet))
		                    	tempFacets[facet] = {"facetCount" : resourceFacets[i + 1],
								"id" : getSequence(facet)};
		                }

						var ratificationCount=0;
						_.each( results[2].data, function(country){
							if (  (country.treaties.XXVII8b.instrument == "ratification"
			                	|| country.treaties.XXVII8b.instrument == "accession"
			                	|| country.treaties.XXVII8b.instrument == "acceptance"
			                  	|| country.treaties.XXVII8b.instrument == "approval"
			                  	|| country.code == 'EU') && moment().diff(moment(country.treaties.XXVII8b.deposit),'days')>=90) {

			                    	ratificationCount++;
			                }
						});
						tempFacets['RAT'] = {"facetCount" : ratificationCount,
								"id" : getSequence('ratification')};

						tempFacets['focalPoint'] = {"facetCount" : tempFacets['focalPoint'].facetCount,
								"countryCount" : tempFacets['focalPoint'].countryCount,
								"id" : 2 };

                        $scope.commonFormatFacets = _.sortBy(_.pairs(tempFacets), function(format){ return format[1].id});
                        $scope.loadingFacets = false;

                    },function (error) {$scope.commonFormatFacets={};console.log(error); } )
                    .finally(function(){$scope.loadingFacets = false;})




    			}
                $scope.isReferenceRecord = function(schema){
                    return _.contains(referenceRecordSchemas,schema)                    
                }
                
				function getSequence(format){
					switch(format.toLowerCase()){

						case  'ratification':
							return 1;
						case  'FP':
							return 2;
						case  'authority':
							return 3;
						case  'measure':
							return 4;
						case  'abscheckpoint':
							return 5;
						case  'abspermit':
							return 6;
						case  'abscheckpointcommunique':
							return 7;
						case 'database':
							return 8;
						case  'resource':
							return 9;
						case  'modelContractualClause':
							return 10;
						case  'communityProtocol':
							return 11;
					}
				}
                //$scope.loadFacets();


			}]
		};

	});
});
