var app = angular.module('ngapp', ['ngSanitize', 'appCommon'])

app.controller('printContacts', ['$scope', '$http', '$location', '$sce', '$filter', '$q', function($scope, $http, $location, $sce, $filter, $q) {

    var sLocale = "en";
    $scope.locale = sLocale;

    var realm = $location.search().realm;
    var schemaQuery = '';
    $scope.schema = $location.search().schema;

    if (!$scope.schema)
    $scope.schema = "authority";

	if ($scope.schema.toLowerCase()=='focalpoint')
		schemaQuery = 'focalPoint AND (type_ss:NP-FP OR type_ss:ABS-FP)';
    else
        schemaQuery = $scope.schema;

    var queryURL = '/api/v2013/index/select?fl=id,identifier_s,title_t,description_t,url_ss,schema_EN_t,date_dt,' +
        'government_s,government_EN_t,schema_s,number_d,aichiTarget_ss,reference_s,sender_s,meeting_ss,recipient_ss,' +
        'symbol_s,eventCity_EN_t,eventCountry_EN_t,startDate_s,endDate_s,body_s,code_s,meeting_s,group_s,function_t,' +
        'department_t,organization_t,summary_EN_t,reportType_EN_t,completion_EN_t,jurisdiction_EN_t,development_EN_t' +
        ',type_ss,email_ss,fax_ss,telephone_ss,government_CEN_s,type_EN_t' +
        '' +
        '&q=(realm_ss:' + realm.toLowerCase() + ') AND (schema_s:' + schemaQuery + ')' +
        '&rows=1000&sort=createdDate_dt+desc,+title_t+asc&start=0&wt=json';

    var queryProfile = $http.get(queryURL, {
        cache: true
    });

    $q.all([queryProfile])
        .then(function(results) {
            $scope.absch_nfp = results[0].data.response.docs;
            console.log(results)

            $scope.countries = _.sortBy(_.uniq(_.pluck($scope.absch_nfp,'government_EN_t'), false));
            console.log($scope.countries);

			$scope.absch_nfp.forEach(function(document){
				document.identifier = document.identifier_s
				if(document.schema_s == "focalPoint" ){
					document.description_t = document.description_t.replace(/\n/g, '<br/>');
					document.documentId = hexToInteger(document.identifier_s);
				}
				else if(document.schema_s == "authority" || document.schema_s == "database" ||
				document.schema_s == "absCheckpoint"){
					document.description_t = '';
					$q.when($http.get('/api/v2013/documents/' +  document.identifier_s, { info:""}))
					.then(function(data) {
						var doc = data.data
						var details = '';
						if(doc.address)
							details += $filter("lstring")(doc.address) + '<br/>';
						if(doc.city)
							details += $filter("lstring")(doc.city)  + '<br/>';
						if(doc.postalCode)
							details += $filter("lstring")(doc.postalCode)  + '<br/>';
						if(document.government_CEN_s)
							details += $filter("lstring")(JSON.parse(document.government_CEN_s));

						document.description_t = details;
						document.telephones = doc.phones;
						document.emails = doc.emails;
						document.doc = data.data;
					});
				}

			});

        });

    $scope.title = function(schema){

        if(schema=='authority')
            return 'Competent National Authority';
        if(schema=='focalPoint')
            return 'ABS National Focal Points';
        if(schema=='absCheckpoint')
            return 'ABS Checkpoints';
    }
    $scope.getTitle = function(schema, type, schemaFull) {
        if (schema == 'focalPoint') {

            if (_.contains(type, 'NP-FP') || _.contains(type, 'ABS-FP'))
                return 'ABS National Focal Point';
            // else if(_.contains(type,'ABS-IC'))
            //     return 'ABS ICNP Focal Point';
            else if (_.contains(type, 'CBD-FP1') || _.contains(type, 'CBD-FP2'))
                return 'CBD National Focal Point';
            else
                return 'National Focal Point';
        } else
            return schemaFull;

    }
    $scope.getCountryRecords = function(country){

        return _.filter($scope.absch_nfp,function(item){
            return item.government_EN_t == country;
        })

    }
    $scope.parseJSON = function(value) {
        if (value)
            return JSON.parse(value);
    }
	function hexToInteger (hex){
		if(hex && hex.length==24)
			return parseInt(hex.substr(15, 9),16);

		return hex;
	}

}]);
