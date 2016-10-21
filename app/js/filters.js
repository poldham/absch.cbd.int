﻿
define(["app",'/app/js/common.js', '../services/app-config-service'], function (app) {

	app.directive("translationUrl", ['$browser', function($browser){
		return {
			restrict : 'A',
			link :  function($scope, $element, $attrs){

				var lastPath;
				// console.log($attrs.ngClick);
				if(!$attrs.ngClick){
					$attrs.$observe('href', function(){
						// console.log($attrs)        			
						var langRegex 			= new RegExp('^\/(ar|en|es|fr|ru|zh)');
						var externalUrlRegex 	= new RegExp('^(http|https|mailto)');
						var startWithRegex	 	= new RegExp('^\/');

						if(lastPath != $attrs.href && !langRegex.test($attrs.href) && startWithRegex.test($attrs.href)){
							lastPath = $browser.baseHref() + $attrs.href.replace(/^\//, ''); 
							$attrs.$set('href', lastPath);
						};
					})
				}
			}
		};		
	}]);


	//============================================================
	//
	//
	//
	//============================================================
	function findString(str, arr)
	{
		if(!arr)
			return false;
		if(!str)
			return false;


			for(var i=0; i>arr.count(); i++) {
				if(arr[i] == str)
					return true;
			}

			return false;


	}

//============================================================
    app.filter("uniqueID", ["IStorage", '$filter', '$q','commonjs', 'realm', 'appConfigService',
	 						function(storage, $filter, $q, commonjs, realm, appConfigService) {
		var cacheMap = {};

		return function(term) {

			if(!term)
				return "";

            var document;

			if(term && angular.isString(term)){

                term = { identifier : term };
    		    if(cacheMap[term.identifier])
    			     return cacheMap[term.identifier] ;

                document = storage.documents.get(term.identifier, {info:""});

            }
            else if(term && angular.isObject(term)){

                document = term.info && term.info.metadata ? term.info : term;

                var revision = ''
                if(document.revision)
                    revision = '-' + document.revision;
                var identifier = '';
                if(term.identifier)
                    identifier = term.identifier;
                else if(document.identifier)
                    identifier = document.identifier;
                else if(document.data && document.data.identifier)
                    identifier = document.data.identifier;
                else if(document.id)
                    identifier = document.id;

				if(identifier == '')
					return;
				
				if( document.documentID === undefined && !document.id)
                    revision = "DRAFT";

                term = { identifier : identifier + revision};

        		if(cacheMap[term.identifier]){
        				return cacheMap[term.identifier] ;
				}
            }

            if(!document)
                return;

			cacheMap[term.identifier] = $q.when(document).then(function(document) {

                if(document.data)
                    document = document.data;
                else
                    document = document;

                var government = '';
				var documentId;

				if(document.documentID)
					documentId = document.documentID;
				else if(document.id){

						if(document.id.indexOf('_')>0)
							documentId = commonjs.hexToInteger(document.id.substr(0,document.id.indexOf('_')));
						else
							documentId = commonjs.hexToInteger(document.id);
				}

                if(documentId === undefined)
                    documentId = "DRAFT";

				if(document.government_s)
                    government = document.government_s;
                else if(document.government)
                    government = document.government.identifier;
                else if(document.metadata && document.metadata.government)
                    government = document.metadata.government;
                else if(document.body && document.body.government)
                    government = document.body.government.identifier;


				var relamPrefix = '';
				if((!_.contains(appConfigService.scbdSchemas, (document.schema_s||'').toLowerCase() || (document.schema_s||'').toLowerCase()!= 'focalpoint')))
					relamPrefix = (realm.value.toUpperCase().replace('ABS','').replace('-',''));

				var unique = 'ABSCH' + relamPrefix +
						'-' + $filter("schemaShortName")($filter("lowercase")(document.type||document.schema_s||document.schema)) +
                        '-' + (government != '' ?  $filter("uppercase")(government) : 'SCBD') +
                        '-' + documentId;

				if(document.revision === 'draft'){
                    document.revision = "0";
                }

                if( document.revision)
					unique = unique + '-' + document.revision;

				cacheMap[term.identifier] = unique;

				return unique;

			}).catch(function(){

				cacheMap[term.identifier] = term.identifier;

				return term.identifier;

			});
			return cacheMap[term.identifier];
		};
	}])
//============================================================
    app.filter("uniqueIDWithoutRevision", ['$filter', 'commonjs', function($filter, commonjs) {

		return function( document ) {
            var unique = $filter("uniqueID")(document);


            if(angular.isString(unique) && document)
                return unique.substring(0,unique.lastIndexOf('-'));
			// else if(angular.isString(unique) && document.identifier)
            //     return unique.substring(0,unique.lastIndexOf('-'));

            return '';

		};
	}]);



	app.filter("partyStatus", ['$q', 'commonjs',	function($q, commonjs) {
		var partyStatusMap = {};

		return function(term) {

			if(!term)
				return "";

			if (term && angular.isString(term))
                term = {
                    identifier: term
                };

			term.identifier = term.identifier.toUpperCase();

			if(partyStatusMap[term.identifier])
				return partyStatusMap[term.identifier] ;

			partyStatusMap[term.identifier] = $q.when(commonjs.getCountry(term.identifier))
			.then(function(country) {

				partyStatusMap[term.identifier] = country;
				console.log(country);
				return country;

			}).catch(function(){

				partyStatusMap[term.identifier] = term.identifier;

				return term.identifier;

			});
			return partyStatusMap[term];
		};
	}]);

	//============================================================
	//
	//
	//
	//============================================================
	app.filter("schemaNamePlural", [function() {

		return function( schema ) {
			if(!schema)
				return schema;

			if(schema.toLowerCase()=="focalpoint"				 ) return "ABS National Focal Points";
			if(schema.toLowerCase()=="authority"				 ) return "Competent National Authorities";
			if(schema.toLowerCase()=="contact"					 ) return "Contact";
			if(schema.toLowerCase()=="database"					 ) return "National Websites or Databases";
			if(schema.toLowerCase()=="resource"					 ) return "Virtual Library Resources";
			if(schema.toLowerCase()=="organization"				 ) return "Organizations";
			if(schema.toLowerCase()=="measure" 					 ) return "Legislative, Administrative or Policy Measures";
			if(schema.toLowerCase()=="abscheckpoint"			 ) return "Checkpoints";
			if(schema.toLowerCase()=="abscheckpointcommunique"   ) return "Checkpoint Communiqués";
			if(schema.toLowerCase()=="abspermit"				 ) return "Internationally Recognized Certificates of Compliance";
            if(schema.toLowerCase()=="meetingdocument"			 ) return "Meeting Documents";
            if(schema.toLowerCase()=="pressrelease"				 ) return "Press Releases";
			if(schema.toLowerCase()=="news"						 ) return "News";
			if(schema.toLowerCase()=="new"						 ) return "What's New";
            if(schema.toLowerCase()=="statement"			     ) return "Statement";
			if(schema.toLowerCase()=="absnationalreport"		 ) return "Interim National Reports on the Implementation of the Nagoya Protocol";
			if(schema.toLowerCase()=="modelcontractualclause"	 ) return "Model Contractual Clauses, Codes of Conduct, Guidelines, Best Practices and/or Standards";
			if(schema.toLowerCase()=="communityprotocol"		 ) return "Community Protocols and Procedures and Customary Laws";
			if(schema.toLowerCase()=="meeting"					 ) return "Meetings";
			if(schema.toLowerCase()=="notification"				 ) return "Notifications";
			if(schema.toLowerCase()=="capacitybuildinginitiative") return "Capacity-building Initiatives";
			if(schema.toLowerCase()=="capacitybuildingresource"  ) return "Capacity-building Resources";
			if(schema.toLowerCase()=="endorsement"				 ) return "Endorsements";


			return schema;
		};
	}]);

	//============================================================
	//
	//
	//
	//============================================================
	app.filter("schemaIcon", [function() {

		return function( schema ) {

			if(!schema)
				return schema;

			if(schema.toLowerCase()=="focalpoint" 				  ||	schema.toLowerCase()=="nfp"	) return "account_box";
			if(schema.toLowerCase()=="authority"  				  ||	schema.toLowerCase()=="cna"	) return "account_box";
			if(schema.toLowerCase()=="contact"  				  ||	schema.toLowerCase()=="con"	) return "contacts";
			if(schema.toLowerCase()=="database"	 				  ||	schema.toLowerCase()=="ndb"	) return "folder";
			if(schema.toLowerCase()=="resource"	  				  ||	schema.toLowerCase()=="vlr"	) return "insert_drive_file";
			//if(schema.toLowerCase()=="organization"  			  ||	schema.toLowerCase()=="org"	) return "Organization";
			if(schema.toLowerCase()=="measure" 	  				  ||	schema.toLowerCase()=="msr"	) return "stars";
			if(schema.toLowerCase()=="abscheckpoint" 			  ||	schema.toLowerCase()=="cp"	) return "verified_user";
			if(schema.toLowerCase()=="abscheckpointcommunique"    ||	schema.toLowerCase()=="cpc"	) return "message";
			if(schema.toLowerCase()=="abspermit"  				  ||	schema.toLowerCase()=="ircc") return "bookmark";
			if(schema.toLowerCase()=="absnationalreport" 		  ||	schema.toLowerCase()=="nr"	) return "folder";
			//if(schema.toLowerCase()=="meetingdocument" 		  ||	schema.toLowerCase()=="nfp"	) return "Meeting Document";
			//if(schema.toLowerCase()=="pressrelease"	 		  ||	schema.toLowerCase()=="nfp"	) return "Press Release";
			//if(schema.toLowerCase()=="news"		 			  ||	schema.toLowerCase()=="nfp"	) return "News";
			if(schema.toLowerCase()=="modelcontractualclause" 	  ||	schema.toLowerCase()=="a19a20"	) return "folder";
			if(schema.toLowerCase()=="communityprotocol" 		  ||	schema.toLowerCase()=="cpp"	) return "folder";
			if(schema.toLowerCase()=="capacitybuildinginitiative" ||	schema.toLowerCase()=="cbi"	) return "insert_drive_file";
			if(schema.toLowerCase()=="capacitybuildingresource"   ||	schema.toLowerCase()=="cbr"	) return "insert_drive_file";
			if(schema.toLowerCase()=="endorsement" 				||	schema.toLowerCase()=="edr"	) return "folder";

			return schema;
		};
	}]);
	
	//https://github.com/HubSpot/humanize/blob/master/public/src/humanize.js
	app.filter('humanizeNumber', function() {
		return function(value) {
		    var end, leastSignificant, number, specialCase;
		    number = parseInt(value, 10);
		    if (number === 0) {
		      return value;
		    }
		    specialCase = number % 100;
		    if (specialCase === 11 || specialCase === 12 || specialCase === 13) {
		      return "" + number + "th";
		    }
		    leastSignificant = number % 10;
		    switch (leastSignificant) {
		      case 1:
		        end = "st";
		        break;
		      case 2:
		        end = "nd";
		        break;
		      case 3:
		        end = "rd";
		        break;
		      default:
		        end = "th";
		    }
		    return "" + number + end;
		};
	});
});
