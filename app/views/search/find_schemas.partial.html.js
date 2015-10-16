define(['app', '/app/js/common.js', '/app/services/thesaurus-service.js',
 '/app/services/search-service.js'], function (app) {
app.directive('searchFilterSchemas', function ($http) {
    return {
        restrict: 'EAC',
        templateUrl: '/app/views/search/find_schemas.partial.html',
        replace: true,
        scope: {
              title: '@title',
              items: '=ngModel',
              field: '@field',
              query: '=query',
              previewType: '=previewType',
              selectedFilters : '=selectedFilters',
              recordType        : '=recordType'
        },
        link: function ($scope, element, attrs, ngModelController)
        {
        },
        controller : ['$scope', '$element', '$location', 'Thesaurus', "IStorage", "guid", "$q", "Enumerable",
                      "$filter","underscore","realm","$routeParams",'$route', 'commonjs', 'thesaurusService','searchService',
         function ($scope, $element, $location, Thesaurus, storage, guid, $q, Enumerable, $filter,_,realm,
              $routeParams, $route, commonjs, thesaurusService, searchService)
        {

            $scope.groupby=true;
            $scope.orderReferenceBy = 'title_s asc';
            $scope.recordType = $route.current.$$route.type;
            if($scope.recordType == 'reference'){
                $scope.previewType = 'list';
            }
            //**********************************************************
            $scope.isInProfiles = function(tab) {
                return $scope.recordType == 'countryProfile' || ($route.current.$$route.type =='countryProfile' && $scope.recordType == 'countryProfile');
            }

            //**********************************************************
            $scope.isInNationalRecords = function(tab) {
              return  $scope.recordType == 'national' || ($route.current.$$route.type =='national' && $scope.recordType == 'national');
            }

            //**********************************************************
            $scope.isInReferenceRecords = function(tab) {
              return  $scope.recordType == 'reference' || ($route.current.$$route.type =='reference' && $scope.recordType == 'reference');
            }



            $scope.showNationalFilters = $scope.isInNationalRecords();
            $scope.showReferenceFilters = $scope.isInReferenceRecords();
            $scope.expanded = false;
            $scope.selectedItems = [];
            $scope.facet = $scope.field.replace('_s', ''); // TODO: replace @field by @facet
            $scope.queryPartyStatus = '';

            if(!$scope.selectedFilters)
                $scope.selectedFilters = [];

            $scope.$watch('recordType', function(newVal, oldVal){
                if(newVal !=oldVal){
                    clearFilters();
                    if($scope.recordType == 'reference'){
                        $scope.previewType = 'list';
                    }
                    else if($scope.recordType == 'national'){
                        $scope.groupby = true;
                        $scope.previewType = 'group';
                    }
                    $scope.buildQuery()
                }

            })

            $scope.options  = {
                jurisdiction             : function () { return loadDomainWithFacets('jurisdiction','measure','jurisdiction_s'); },
                status                   : function () { return loadDomainWithFacets('status','measure','status_s'); },
                typeOfDocuments          : function () { return loadDomainWithFacets('typeOfDocuments', 'measure','type_s'); },
                cnaJurisdictions         : function () { return loadDomainWithFacets('cnaJurisdictions', 'authority', 'absJurisdiction_ss'); },
                absGeneticResourceTypes  : function () { return loadDomainWithFacets('absGeneticResourceTypes', 'authority','absGeneticResourceTypes_ss') },
                keywords                 : function () { return loadDomainWithFacets('keywords', 'permit', 'keywords_ss'); },
                usage                    : function () { return loadDomainWithFacets('usage', 'permit', 'usage_REL_ss'); },
                cpJurisdictions         : function () { return  loadDomainWithFacets('cpJurisdictions', 'checkpoint', 'jurisdiction_s') },

                countries                : function () { return thesaurusService.getDomainTerms('countries').then(function (o) { return $filter("orderBy")(o, "name"); }); },
                regions                  : function () { return $q.all([thesaurusService.getDomainTerms('countries'),
                                                                        thesaurusService.getDomainTerms('regions')])
                                                                  .then(function(o) {
                                                                                return Enumerable.from($filter("orderBy")(o[0], "name")).union(
                                                                                    Enumerable.from($filter("orderBy")(o[1], "name"))).toArray();
                                                                  });
                                                        },
               resourceTypes            : function () { return $http.get("/api/v2013/thesaurus/domains/83BA4728-A843-442B-9664-705F55A8EC52/terms", { cache: true })
                                                                    .then(function(o){ return $scope.updateFacets($scope.resource,'vlrresourceTypes',Thesaurus.buildTree(o.data)); }); },
                absSubjects             : function () { return $http.get("/api/v2013/thesaurus/domains/CA9BBEA9-AAA7-4F2F-B3A3-7ED180DE1924/terms", { cache: true }).then(function(o){ return o.data; }); },
                languages               : function () { return $http.get("/api/v2013/thesaurus/domains/ISO639-2/terms", { cache: true }).then(function(o){
                                                                      return $filter("orderBy")(o.data, "name");
                                                                    })},
                meetingYear             : function () {
                                                        var year = [];
                                                        year.push({'identifier':'[' + moment().add('days',1).format("YYYY-MM-DD")+ 'T00:00:00Z TO *]','name' : 'Upcoming meetings'});
                                                        year.push({'identifier':'[* TO ' + moment().format("YYYY-MM-DD") + 'T00:00:00Z ]','name' : 'Previous meetings'});
                                                        for (var i=moment().year(); i>= 2009; i--)
                                                            year.push({'identifier':'['+i + '-01-01T00:00:00Z TO ' + i + '-12-31T00:00:00Z]','name' : '' + i});

                                                        return year;
                                                      },
               mccResourceTypes            : function () { return $http.get("/api/v2013/thesaurus/domains/840427E5-E5AC-4578-B238-C81EAEEDBDD8/terms", { cache: true })
                                                                    .then(function(o){ return $scope.updateFacets($scope.modelContractualClause,'mccresourceTypes',Thesaurus.buildTree(o.data)); }); },

               cppResourceTypes            : function () { return $http.get("/api/v2013/thesaurus/domains/ED9BE33E-B754-4E31-A513-002316D0D602/terms", { cache: true })
                                                                    .then(function(o){ return $scope.updateFacets($scope.modelContractualClause,'cppresourceTypes',Thesaurus.buildTree(o.data)); }); },
            };

            $scope.isSelected = function(item) {
                return $.inArray(item.symbol, $scope.selectedItems) >= 0;
            };


            $scope.closeDialog = function() {
                $element.find("#dialogSelect").modal("hide");
            };

            $scope.actionSelect = function(item) {

                if($scope.isSelected(item)) {
                    $scope.selectedItems.splice($.inArray(item.symbol, $scope.selectedItems), 1);
                } else {
                    $scope.selectedItems.push(item.symbol);
                }

                $scope.updateQuery();
            };

            $scope.actionExpand = function() {

                var count1 = Math.ceil($scope.items.length/3);
                var count2 = Math.ceil(($scope.items.length-count1)/2);
                var count3 = Math.ceil(($scope.items.length-count2-count1));

                $scope.items1 = $scope.items.slice(0, count1);
                $scope.items2 = $scope.items.slice(count1, count2+count2);
                $scope.items3 = $scope.items.slice(count1+count2, count1+count2+count3);

                $element.find("#dialogSelect").modal("show");
            };

            $scope.$on('onExpand', function(scope) {
                if(scope!=$scope && $scope.expanded)
                    $scope.expanded = false;
            });

            $scope.filterx = function(item) {
                return $scope.isSelected(item) || $scope.expanded;
            };

            $scope.ccc = function(item) {
                return $scope.isSelected(item) ? 'facet selected' : 'facet unselected';
            };

            $scope.updateQuery = function() {

                $scope.query = '';

                $scope.selectedItems.forEach(function(item) {
                    $scope.query += ($scope.query=='' ? '' : ' OR ') + $scope.field+':' + item;
                });

                if($scope.query!='')
                    $scope.query = '(' + $scope.query + ')';
                else
                    $scope.query = '*:*';

                //console.log($scope.query);
            };

            $scope.onclick = function (scope, evt) {

                $scope[scope].selected = !$scope[scope].selected;
                $scope.buildQuery();
            }

            $scope.buildQuery = function () {
                var conditions = [];
                buildConditions(conditions, $scope.terms);

                var keywordQuery = '';

                if($scope.keyword){
                    keywordQuery = ' AND (title_t:*' + $scope.keyword + '* OR description_t:*' + $scope.keyword + '* OR text_EN_txt:*' + $scope.keyword + '* OR uniqueIdentifier_s:*' + $scope.keyword.toLowerCase() + '*)';
                }

                if(conditions.length==0) {
                    //$scope.query = '*:*';

                    var nationalSchema = [ "absPermit", "absCheckpoint", "absCheckpointCommunique", "authority", "measure", "database","focalPoint"];
                    var referenceSchema= [ "resource", "meeting", "notification","pressRelease","statement" , "news", "modelContractualClause"];

                    var q = '(realm_ss:' + realm.value.toLowerCase() + ') AND NOT version_s:*';
                    var schema = nationalSchema;
                    if($scope.recordType == 'reference'){
                        schema = referenceSchema;
                        $scope.previewType = 'list';
                    }
                    q += keywordQuery
                    q += ' AND (schema_s:(' + schema.join(' ') + '))';
                    q += $scope.queryPartyStatus!='' ? ('AND (' + $scope.queryPartyStatus + ')') : '';
                    $scope.query = q;
                }
                else {
                    var query = '';
                    conditions.forEach(function (condition) { query = query + (query=='' ? '( ' : ' OR ') + condition; });
                    query += ' )';
                    $scope.query = query + keywordQuery  + ($scope.queryPartyStatus!='' ? ('AND (' + $scope.queryPartyStatus + ')') : '');
                    //console.log (query);
                }
               // console.log ($scope.query);
            }

            function buildConditions (conditions, items) {
                $scope.selectedFilters=[];
                items.forEach(function (item) {

                    if(item.selected && (($scope.showNationalFilters  && item.type=='nationalRecord') || ($scope.showReferenceFilters  && item.type=='reference'))){

                        $scope.selectedFilters.push({type:'schema', identifier:item.identifier, value:item.title, count:item.count});

                        var subFilterQuery = '(' + $scope.field+':'+item.identifier;
                        if(item.subFilters){
                            item.subFilters.forEach(function(filter){
                                if(filter.type=='select' || filter.type=='multiselect'){
                                    if( $scope[filter.name] && $scope[filter.name].length > 0){


                                        var selectedValues = $scope[filter.name];
                                        if(typeof selectedValues[0]== "object" )
                                            selectedValues = _.pluck(selectedValues, "identifier");

                                        if(filter.type=='select' && !_.isArray(selectedValues))
                                            selectedValues = [selectedValues];

                                        subFilterQuery = subFilterQuery + ' AND (' + filter.field +':('+ selectedValues.join(' ') + '))';

                                        _.each(selectedValues, function(value){
                                            var selectedItem = $scope[filter.name + 'Api'].getItem(value);
                                            $scope.selectedFilters.push({
                                                        type:'subFilter', schema:item.identifier, value:value, identifier:filter.name,
                                                        count: selectedItem && selectedItem.metadata ? selectedItem.metadata.facet : undefined,
                                                        isTerm : true
                                                    });
                                        })
                                    }
                                }
                                else if(filter.type=='calendar'){
                                        var selectedValues = $scope[filter.name];
                                        if(selectedValues != '*:*'){
                                            subFilterQuery = subFilterQuery + ' AND ' + selectedValues;
                                            var dateString = $scope[filter.name + 'Api'].getDateString();
                                            $scope.selectedFilters.push({
                                                        type:'subFilter', schema:item.identifier, value:dateString, identifier:filter.name
                                                    });
                                        }
                                }
                                else if(filter.type=='radio'){
                                    var selectedValues = $scope[filter.name];

                                    if(selectedValues!=undefined && parseInt(selectedValues) != -2){//skipp All option
                                        if(parseInt(selectedValues) == -1)
                                            subFilterQuery = subFilterQuery + ' AND NOT ' + filter.field + ':*';
                                        else{
                                            var selectedText = selectedValues;
                                            var selectedField = $('#btn' + filter.name + ' span:visible');
                                            if(selectedField)
                                                selectedText = selectedField.text();

                                            subFilterQuery = subFilterQuery + ' AND (' + filter.field +':'+ selectedValues + ')';
                                            $scope.selectedFilters.push({
                                                        type:'subFilter', schema:item.identifier, value:selectedText, identifier:filter.name
                                                    });
                                        }
                                    }
                                }
                                else {
                                    if($scope[filter.name]!=null){
                                        subFilterQuery = subFilterQuery + ' AND ('  + filter.field +':'+  $scope[filter.name] + ')';

                                        $scope.selectedFilters.push({
                                                    type:'subFilter', schema:item.identifier, value:filter.name + '(' + $scope[filter.name] + ')', identifier:filter.name
                                                });
                                    }
                                }
                            });
                        }

                      subFilterQuery = subFilterQuery + ')'
                //console.log(subFilterQuery);
                        conditions.push(subFilterQuery);
                    }
                });


            }
            $scope.updateFacets = function(schema,fieldName,data){

                var facets = _.where(schema.subFilters,{name:fieldName})[0]||[];
                if(!facets.facets)
                    return data;

                facets = facets.facets;
                for (var i = 0; i < facets.length; i+=2) {
                   var item =  _.where(data,{identifier:facets[i]});

                   if(item.length>0){
                       item[0].metadata = {facet : facets[i+1]};
                        item[0].title.en += ' (' + facets[i+1] + ')';
                    }
                };
                return data;
            }

            $scope.loadSchemaFacets=function(schema){

                if($scope[schema].subFilters){

                    var facetFields = [];
                    $scope[schema].subFilters.forEach(function(filter){
                        if((filter.type=='multiselect' || filter.type=='radio') && !filter.facets)
                            facetFields.push(filter.field);
                    });
                    if(facetFields.length<=0)
                        return;
                    var queryFacetsParameters = {
                            'q': '(realm_ss:' + realm.value.toLowerCase() + ' or realm_ss:absch) AND NOT version_s:* AND schema_s:' + schema,
                            'fl': '',       //fields for results.
                            'wt': 'json',
                            'rows': 0,      //limit
                            'facet': true,  //get counts back
                            'facet.field': facetFields,
                            'facet.limit': 512
                        };

                        $http.get('/api/v2013/index/select', { params: queryFacetsParameters })
                        .success(function (data) {
                            $scope[schema].subFilters.forEach(function(filter){
                                if(filter.type=='multiselect' || filter.type=='radio'){
                                    filter.facets = data.facet_counts.facet_fields[filter.field];                                                                ;
                                }
                            });
                        })
                        .error(function (error) {
                             console.log(error);
                        });
                }
            }


            function dictionarize(items) {
                var dictionary = [];
                items.forEach(function (item) {
                    item.selected = false;
                    dictionary[item.identifier] = item;
                });
                return dictionary;
            }

            $scope.focalPoint              = { identifier: 'focalPoint',               title: 'National Focal Points', type:'nationalRecord'};
            $scope.authority               = { identifier: 'authority',                title: 'Competent National Authorities' ,type:'nationalRecord',
                                               subFilters : [
                                                                { name: 'cnaResponsibleForAll',     type: 'radio' , field: 'absResposibleForAll_b'},
                                                                { name: 'cnaJurisdiction',          type: 'multiselect', field: 'absJurisdiction_ss' },
                                                                { name: 'cnaGeneticResourceTypes',  type: 'multiselect' , field: 'absGeneticResourceTypes_ss'}
                                                            ]
                                             };
            $scope.database                = { identifier: 'database',                 title: 'National Websites and Databases',type:'nationalRecord', count: 0 };
            $scope.measure                 = { identifier: 'measure',                  title: 'Legislative, administrative and policy measures', count: 0,type:'nationalRecord',
                                               subFilters : [
                                                                { name: 'msrJurisdiction', type: 'multiselect', field: 'jurisdiction_s' },
                                                                { name: 'msrStatus', type: 'multiselect', field: 'status_s' },
                                                                { name: 'msrType', type: 'multiselect', field: 'type_s' },

                                                                // { name: 'msrAdoptionDate', type: 'calendar' , field: 'adoption_s'},
                                                                // { name: 'msrRetirementDate', type: 'calendar' , field: 'retired_s'},
                                                                // { name: 'msrEntryinForceDate', type: 'calendar' , field: 'entryIntoForce_s'},
                                                                // { name: 'mssApplicationDate', type: 'calendar' , field: 'limitedApplication_s'}
                                                            ]
                                            };
            $scope.absPermit               = { identifier: 'absPermit',                title: 'Internationally Recognized Certificates of Compliance' ,type:'nationalRecord',
                                               subFilters : [
                                                                //{ name: 'permitAuthority',  type: 'reference' , field: 'jurisdiction_s'},
                                                                { name: 'permitusage',          type: 'multiselect' , field: 'usage_REL_ss'},
                                                                { name: 'permitkeywords',       type: 'multiselect' , field: 'keywords_ss'},
                                                                // { name: 'permitExpiryDate',     type: 'calendar' , field: 'expiration_s'},
                                                                // { name: 'permitIssuanceDate',   type: 'calendar' , field: 'date_s'},
                                                                { name: 'amendmentIntent',      type: 'radio' , field: 'amendmentIntent_i'}
                                                            ]
                                             };
            $scope.absCheckpoint           = { identifier: 'absCheckpoint',            title: 'Checkpoints' ,type:'nationalRecord',
                                               subFilters : [
                                                                { name: 'cpInformAllAuthorities', type: 'yesno' , field: 'informAllAuthorities_b'},
                                                                { name: 'cpJurisdiction',      type: 'multiselect', field: 'jurisdiction_s' }
                                                            ]
                                              };
            $scope.absCheckpointCommunique = { identifier: 'absCheckpointCommunique',  title: 'Checkpoint Communiqués' ,type:'nationalRecord',
                                               subFilters : [
                                                                { name: 'cpcoriginCountries',      type: 'multiselect', field: 'originCountries_ss' }
                                                            ]
                                               };

            $scope.resource                = { identifier: 'resource',                 title: 'Virtual Library Record' , type:'reference',
                                               subFilters : [
                                                                { name: 'vlrpublicationYear', type: 'multiselect', field: 'publicationYear_is'},
                                                                { name: 'vlrresourceTypes',   type: 'multiselect' , field: 'resourceTypes_ss'},
                                                                { name: 'vlrRegions',         type: 'multiselect', field: 'regions_ss' },
                                                                { name: 'vlrLanguages',       type: 'multiselect', field: 'resourceLinksLanguage_ss' }
                                                            ]
                                               };
            $scope.organization            = { identifier: 'organization',             title: 'ABS Related Organizations', type:'reference' };
            $scope.meeting                 = { identifier: 'meeting',                  title: 'Meetings', type:'reference',
                                               subFilters : [
                                                                { name: 'mtgRange', type: 'select', field: 'startDate_dt'},
                                                            ]
                                             };
            $scope.notification            = { identifier: 'notification',             title: 'Notifications', type:'reference' };
            $scope.pressRelease            = { identifier: 'pressRelease',             title: 'Press Releases', type:'reference' };
            $scope.statement               = { identifier: 'statement',                title: 'Statements' , type:'reference'};
            $scope.news                    = { identifier: 'news',                     title: 'News', type:'reference' };
            $scope.modelContractualClause  = { identifier: 'modelContractualClause',   title : "Model Contractual Clauses, Codes of Conduct, Guidelines, Best Practices and Standards", type:'reference',
                                               subFilters : [
                                                            { name: 'mccresourceTypes',   type: 'multiselect' , field: 'resourceTypes_ss'}
                                                        ]
                                             }
            $scope.communityProtocol  = { identifier: 'communityProtocol', title : "Community protocols and procedures and customary laws ", type:'reference',
                                               subFilters : [
                                                            { name: 'cppresourceTypes',   type: 'multiselect' , field: 'resourceTypes_ss'}
                                                        ]
                                             }


            $scope.terms  = [ $scope.focalPoint, $scope.authority, $scope.database, $scope.measure, $scope.absPermit, $scope.absCheckpoint,
                              $scope.absCheckpointCommunique, $scope.resource, $scope.organization, $scope.meeting, $scope.notification,
                              $scope.pressRelease, $scope.statement, $scope.news, $scope.modelContractualClause, $scope.communityProtocol ];
            $scope.termsx = dictionarize($scope.terms);

            // Set intitial selection from QueryString parameters

            var initialSelection = $location.search()[$scope.facet];

            if(initialSelection && $scope.termsx[initialSelection]) {
                $scope.termsx[initialSelection].selected = true;
            }

            function onWatch_items(values) {
                if(!values) return;
                values.forEach(function (item) {
                    if(_.has($scope.termsx, item.symbol))
                    {
                        $scope.termsx[item.symbol].count = item.count;

                    }
                });
            }

            $scope.$watch('items', onWatch_items);

            $scope.$watch('previewType', $scope.buildQuery);

            $scope.refresh = function(selected, schema){

                $scope.buildQuery();

                $scope.loadSchemaFacets(schema);

                if(schema == 'absPermit'){
                    console.log($scope.absPermit.subFilters[4]);
                }


            }
            $scope.getAmendmentFacets = function(type){

                if($scope.absPermit.subFilters[4].facets){
                    var facets = $scope.absPermit.subFilters[4].facets;
                   for (var i = 0; i < facets.length; i+=2) {
                        if(facets[i] == type){
                            return '(' + facets[i+1] + ')';
                        }
                    }
                }
            }

            $scope.queryStatus = function(type){
                commonjs.getCountries()
                .then(function(data){
                    $scope.queryPartyStatus = '';
                    var npParties

                    if(type=='parties' || type == 'nonParties'){

                        if(type=='parties'){
                            npParties = _.where(data, {isNPParty:true});
                            //$scope.partiesCount = npParties.length;
                            // $scope.partyStatusString = 'Party to the Nagoya Protocol';
                        }
                        else {
                            npParties = _.where(data, {isNPParty:false});
                            //$scope.nonPartiesCount = npParties.length;
                            //$scope.partyStatusString = 'Non-Party';
                        }
                        $scope.queryPartyStatus =
                                            ('government_s:(' +
                                            _.map(_.pluck(npParties, 'code'), function(country){return country.toLowerCase()=='eu' ? 'eur' : country;}) +
                                            ')').toLowerCase().replace(/,/g, ' ');
                    }

                });
            }

            if($routeParams.documentSchema)
            {
                var documentSchema = $routeParams.documentSchema.toUpperCase();
                var schema = $filter("mapSchema")(documentSchema);
                if(schema == 'NEWS')
                    schema = 'news';
                if($scope[schema])
                    $scope[schema].selected = true;
                else{
                    var schemaShort = $filter("schemaShortName")(documentSchema);
                    if(schemaShort!=documentSchema){
                        var schemaN = $filter("mapSchema")(schemaShort);
                        if($scope[schemaN])
                            $scope[schemaN].selected = true;
                    }
                }

                if(documentSchema=='PARTIES'){
                   $scope.queryPartyStatus ="government_s:(ae al bt by cd cg ch ci bw do dk hu es eg fj fm ga et gm gn gw hn id gt ke jo in km kz la kh mg mh mm mn mu mw mx mz na ne no pa pe sc rw sy tj ug uy za ws bj bi bf gy vn vu sd eur ls kg)";
                   // $scope.queryPartyStatus = $scope.queryStatus('parties');
                }
            }

            $scope.buildQuery();

            $scope.terms.forEach(function (item) {
                if(item.subFilters){
                    item.subFilters.forEach(function(filter){
                        $scope.$watch(filter.name,
                            function(oldValue, newValue){
                               if(oldValue != newValue){
                                    $scope.buildQuery();
                                }
                            });
                        }
                    );
                }
            });

            $scope.$on("clearFilter", function(evt, info){

                clearFilters();

            });
            function clearFilters(){
                $scope.$broadcast('clearSelectSelection');
                $scope.keyword = '';
                $scope.terms.forEach(function(data){
                    if(data.selected){
                        data.selected = false;
                        if((data.identifier == 'absPermit' || data.identifier == 'focalPoint') && data.subFilters){
                            data.subFilters.forEach(function(filter){
                                if(filter.type=='radio')
                                    $scope[filter.name] = null;
                                else if(filter.type=='checkbox')
                                        $scope[filter.name] = false;
                            });
                        }
                    }
                })
                $scope.buildQuery();
            }
            $scope.$on("removeFilter", function(evt, info){

                //if schema clear all subFilters
                if(info.data.type == "schema"){
                    var schema = $scope[info.data.identifier];
                    if(schema){
                        schema.selected = false;
                        _.each(schema.subFilters, function(filter){
                            if(filter.type=='select' || filter.type=='multiselect'){
                                if($scope[filter.name + 'Api']){
                                    $scope[filter.name + 'Api'].unSelectAll();
                                }
                            }
                            else if(filter.type=='calendar'){
                                if($scope[filter.name + 'Api'])
                                    $scope[filter.name + 'Api'].clearSelection();
                            }
                            else if(filter.type=='radio'){
                                $scope[filter.name]=null;
                            }
                            else {
                                $scope[filter.name] = undefined;
                            }
                        });
                    }
                }
                else if(info.data.type == "subFilter"){
                    if($scope[info.data.identifier + 'Api']){

                        if($scope[info.data.identifier + 'Api'].unSelectItem){
                            $scope[info.data.identifier + 'Api'].unSelectItem({identifier:info.data.value});
                        }
                        else if($scope[info.data.identifier + 'Api'].clearSelection){
                            $scope[info.data.identifier + 'Api'].clearSelection();
                        }
                        else {
                            $scope[info.data.identifier] = null;
                        }
                    }
                    else {
                        $scope[info.data.identifier] = null;
                    }
                }

                $scope.buildQuery();

            });



            ////country profile search

            $scope.$watch('countryProfileSearch', function(newVal){
                 if($scope.recordType == 'countryProfile')
                    $scope.query = newVal;
            },true);


             $scope.$watch('keyword', function(newVal){
                 if($scope.recordType == 'national' || $scope.recordType == 'reference' )
                    $scope.buildQuery();
            });

            $scope.$watch('orderReferenceBy', function(newVal){
                 $scope.$parent.orderReferenceBy= newVal;
            });


             $scope.$watch('partyStatus', function(newVal){
                 if($scope.recordType == 'national')
                    $scope.buildQuery();
            });
              $scope.$watch('groupby', function(newVal){
                 if($scope.recordType == 'national')
                    if(newVal)
                        $scope.previewType = "group";
                    else
                        $scope.previewType = "list";
            });


            function loadDomainWithFacets(domainTerm, schema, facetField){
                    return thesaurusService
                            .getDomainTerms(domainTerm)
                            .then(function(domainTermData){
                                var facetQuery = {query:'realm_ss:' + realm.value.toLowerCase() + ' AND NOT version_s:* AND schema_s:' + schema, fields: [facetField] };
                                return searchService.facets(facetQuery)
                                    .then(function(facets){
                                            return commonjs.updateFacets(facets[facetField], domainTermData);
                                    });
                            });
            }

            // if ($routeParams.countryCode && $routeParams.countryCode.toUpperCase() == 'RAT'){
            //     $scope.countryProfileSearch ={partyStatus: 'parties', countryProfile_keyword:''}
            // }



        }]
    }
});

});
