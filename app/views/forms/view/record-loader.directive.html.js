define(['app',
	'scbd-angularjs-services', 'ngSmoothScroll',
	'scbd-angularjs-filters',
	'./view-history-directive.html.js',
    '/app/js/common.js',
    '/app/views/directives/document-metadata-directive.html.js',
    '/app/views/directives/internal-record-details.js',
    '/app/views/directives/party-status.js',
    '/app/views/forms/view/view-default-reference.directive.js',
    '/app/views/forms/view/view-contact-reference.directive.js',
	'/app/services/search-service.js',
	'/app/views/directives/block-region-directive.js'
], function (app) {
	app.directive('recordLoader', [function () {
		return {
			restrict: 'EAC',
			templateUrl: '/app/views/forms/view/record-loader.directive.html',
			replace: true,
			transclude: false,
			scope: {
				linkTarget: "@",
				document: "=",
				locale: "=",
				hide: "@",
				showDetails: "=",
				api: '=?'
			},
			link: function ($scope) {

				if (!$scope.linkTarget || $scope.linkTarget == '')
					$scope.linkTarget = '_new';
				//debugger;
				$scope.internalDocument = undefined;
				$scope.internalDocumentInfo = undefined;

				if (!$scope.document)
					$scope.init();
			},
			controller: ['$scope', "$route", 'IStorage', "authentication", "$q", "$location", "commonjs", "$timeout",
				"$filter", "$http", "$http", "realm", "$element", '$compile', 'searchService', "IWorkflows",
				function ($scope, $route, storage, authentication, $q, $location, commonjs, $timeout, $filter,
					$http, $httpAWS, realm, $element, $compile, searchService, IWorkflows) {

					var schemaMapping = {
						news: '/app/views/forms/view/view-news.directive.html.js',
						absnationalreport: '/app/views/forms/view/view-abs-national-report.directive.js',
						abscheckpoint: '/app/views/forms/view/view-abs-checkpoint.directive.js',
						abscheckpointcommunique: '/app/views/forms/view/view-abs-checkpoint-communique.directive.js',
						abspermit: '/app/views/forms/view/view-abs-permit.directive.js',
						authority: '/app/views/forms/view/view-authority.directive.js',
						authorityreference: '/app/views/forms/view/view-authority-reference.directive.js',
						contact: '/app/views/forms/view/view-contact.directive.js',
						contactreference: '/app/views/forms/view/view-contact-reference.directive.js',
						database: '/app/views/forms/view/view-database.directive.js',
						measure: '/app/views/forms/view/view-measure.directive.js',
						organization: '/app/views/forms/view/view-organization.directive.js',
						organizationreference: '/app/views/forms/view/view-organization-reference.directive.js',
						resource: '/app/views/forms/view/view-resource.directive.js',
						focalpoint: '/app/views/forms/view/view-focalpoint.directive.html.js',
						meeting: '/app/views/forms/view/view-meeting.directive.html.js',
						statement: '/app/views/forms/view/view-statement.directive.html.js',
						pressrelease: '/app/views/forms/view/view-pressrelease.directive.html.js',
						new: '/app/views/forms/view/view-new.directive.html.js',
						notification: '/app/views/forms/view/view-notification.directive.html.js',
						capacitybuildinginitiative: '/app/views/forms/view/view-capacity-building-initiative.directive.js',
						capacitybuildingresource: '/app/views/forms/view/view-capacity-building-resource.directive.js'
					}

					$scope.$watch("document", function (_new) {
						$scope.error = null;
						$scope.internalDocument = _new;
						if ($scope.internalDocument && ($scope.internalDocument.schema || $scope.internalDocument.header)) {
							loadViewDirective($scope.internalDocument.schema || $scope.internalDocument.header.schema);
							checkIfPermitRevoked();
						}
					});


					$scope.getUserCountry = function (id) {
                        var term = {};
                        term.identifier = id
                        return $filter('term')(term);
					}
					//==================================
					//
					//==================================
					$scope.init = function () {

						if ($scope.internalDocument && !$scope.revisionNo)
							return;

						if ($scope.document || $scope.schema)
							return;

						var documentSchema = $route.current.params.documentSchema;
						var documentRevision = $route.current.params.revision;

						var documentID = $route.current.params.documentID
						//documentSchema ? commonjs.integerToHex($route.current.params.documentID, documentSchema) : $route.current.params.documentID;

						if ($scope.revisionNo)
							documentRevision = $scope.revisionNo;

						if ($route.current.params.documentNumber)
							var documentID = $route.current.params.documentNumber;

						if (documentID && documentID.toLowerCase().indexOf('absch') == 0) {
							var docNum = documentID.split('-');
							if (docNum.length == 5) {
								documentID = documentID.toLowerCase();//.replace('absch','ABSCH');
								$scope.documentUID = documentID.toUpperCase();
								var schemaFolder = $filter("mapSchema")(docNum[1]);
								$scope.documentUrl = "https://s3.amazonaws.com/absch.documents." + realm.value.toLowerCase() + "/" + schemaFolder + '/' + documentID + '.pdf?id=' + new Date();

								$httpAWS.head($scope.documentUrl, { cache: false }).then(function (success) {
									$scope.documentSuccess = true;
									window.location.href = $scope.documentUrl;
									closeWindow();
								},
									function (error) {
										$scope.documentError = true;
										console.log(error);
									});

								return;
							}
							if (docNum.length <= 4)
								documentID = docNum[docNum.length - 1];

						}
						documentID = commonjs.integerToHex(documentID, documentSchema);

						$scope.loadDocument(documentSchema, documentID, documentRevision);
						// else
						// 	$scope.error = "documentID not specified";

					}


					//==================================
					//
					//==================================
					$scope.loadDocument = function (documentSchema, documentID, documentRevision) {

						if (documentSchema &&
							_.contains(["FOCALPOINT", "MEETING", "NOTIFICATION", "PRESSRELEASE", "STATEMENT", "NEWS", "NEW", "NFP", "ST", "NT", "MT", "PR", "MTD"], documentSchema.toUpperCase())) {
							$scope.loading = true;
							commonjs.getReferenceRecordIndex(documentSchema, documentID)
								.then(function (data) {
									$scope.internalDocument = data.data;
									$scope.loading = false;
								});
							loadViewDirective(documentSchema);
						}
						else if (documentID) {
							$scope.load(documentID, documentRevision);
						}
					};

					$scope.timeLaspe = 20;
					function closeWindow() {
						if ($scope.timeLaspe == 0)
							window.close();
						$scope.timeLaspe--;
						$timeout(function () { closeWindow(); }, 1000)
					}
					//==================================
					//
					//==================================
					$scope.getLocale = function () {
						return $scope.currentLocale || $scope.$root.locale;
					}
					$scope.setLocale = function(locale){
						$scope.currentLocale = locale
					}
					//==================================
					//
					//==================================
					$scope.load = function (identifier, version) {

						$scope.error = undefined;
						var qDocument;
						var qDocumentInfo;



						if (version == 'draft') {
							qDocument = storage.drafts.get(identifier).then(function (result) { return result.data || result });
							qDocumentInfo = storage.drafts.get(identifier, { info: true }).then(function (result) { return result.data || result });
						}
						else if (version == undefined) {
							qDocument = storage.documents.get(identifier, {'include-deleted':true}).then(function (result) { return result.data || result });
							qDocumentInfo = storage.documents.get(identifier, { info: true, 'include-deleted':true }).then(function (result) { return result.data || result });
						}
						else {
							qDocument = storage.documents.get(identifier + '@' + version, {'include-deleted':true}).then(function (result) { return result.data || result });
							qDocumentInfo = storage.documents.get(identifier + '@' + version, {'include-deleted':true, info: true }).then(function (result) { return result.data || result });

						}
						$scope.loading = true;
						$q.all([qDocument, qDocumentInfo]).then(function (results) {

							$scope.internalDocument = results[0];
							$scope.internalDocumentInfo = results[1];
							$scope.internalDocument.info = results[1];
							checkIfPermitRevoked();
				
							if (version)
								$scope.revisionNo = version

							checkIfPermitRevoked();

							if ($scope.internalDocumentInfo.workingDocumentLock) {
								IWorkflows.get($scope.internalDocumentInfo.workingDocumentLock.lockID.replace('workflow-', ''))
									.then(function (workflow) {
										if (workflow && workflow.type.name == 'delete-record')
											$scope.workflowRequestType = "deletion";
										else
											$scope.workflowRequestType = "publishing";
									});
							}				
							if (version)
								$scope.revisionNo = version

							loadViewDirective($scope.internalDocument.header.schema);

						}).catch(function (error) {
							if (error.status == 404 && version != 'draft') {
								$scope.load(identifier, 'draft');
							}
						})
							.finally(function () {
								$scope.loading = false;
							})

					};

					//==================================
					//
					//==================================
					$scope.getUser = function () {

						if (!$scope.user)
							$q.when(authentication.getUser(), function (user) { $scope.user = user; });

						return $scope.user
					};

					//==================================
					//
					//==================================
					$scope.edit = function () {
						if (!$scope.canEdit())
							throw "Cannot edit form";

						var schema = $scope.internalDocumentInfo.type;
						var identifier = $scope.internalDocumentInfo.identifier;
						$timeout(function () {
							$location.path("/register/" + $filter("urlSchemaShortName")(schema) + "/" + identifier + '/edit');
						}, 1);

					}

					//==================================
					//
					//==================================
					$scope.canEdit = function () {

						if ($scope.getUser() && !$scope.getUser().isAuthenticated)
							return false;

						if (!$scope.internalDocumentInfo && $scope.internalDocument && $scope.internalDocument.info) {
							$scope.internalDocumentInfo = $scope.internalDocument.info;
						}

						if (!$scope.internalDocumentInfo)
							return false;
						if ($scope.internalCanEdit === undefined) {

							$scope.internalCanEdit = null; // avoid recall => null !== undefined

							var hasDraft = !!$scope.internalDocumentInfo.workingDocumentCreatedOn;
							var identifier = $scope.internalDocumentInfo.identifier;
							var schema = $scope.internalDocumentInfo.type;

							var qCanEdit = hasDraft
								? storage.drafts.security.canUpdate(identifier, schema)  // has draft
								: storage.drafts.security.canCreate(identifier, schema); // has no draft

							qCanEdit.then(function (isAllowed) {

								$scope.internalCanEdit = isAllowed || false;

							}).then(null, function (error) {

								$scope.internalCanEdit = false;
							});
						}

						return $scope.internalCanEdit === true;
					};

					$scope.loadRevision = function (val) {

						if ($scope.revisionNo != val) {
							$scope.revisionNo = val;
							//$scope.internalDocument = null
							$scope.init();
						}
					}

					$scope.$on('loadDocument', function (evt, evtData) {

						if (evtData.documentId && evtData.schema && !$scope.document) {

							$scope.loadDocument(evtData.schema, evtData.documentId);
						}
						if ($scope.document) {
							loadViewDirective(evtData.schema)
						}

					});

					function loadViewDirective(schema) {

						if (!schema)
							return;

						var lschema = _.clone(schema);

						if (schema.toLowerCase() == 'modelcontractualclause' || schema.toLowerCase() == 'communityprotocol')
							lschema = 'resource';

						if (_.contains(["NEWS", "NEW",], lschema.toUpperCase()))
							lschema = lschema.toLowerCase();
						else if (_.contains(["NFP", "ST", "NT", "MT", "PR", "MTD"], lschema.toUpperCase()))
							lschema = $filter("mapSchema")(lschema);

						var schemaDetails = schemaMapping[lschema.toLowerCase()];

						require([schemaDetails], function () {
							var name = snake_case(lschema);
							var directiveHtml =
								"<DIRECTIVE ng-show='internalDocument' ng-model='internalDocument' document-info='internalDocumentInfo' locale='getLocale()' link-target={{linkTarget}}></DIRECTIVE>"
									.replace(/DIRECTIVE/g, 'view-' + name);
							$scope.$apply(function () {
								$element.find('#schemaView')
									.empty()
									.append($compile(directiveHtml)($scope));
							});
						});

					}
					function snake_case(name, separator) {

						separator = separator || '-';
						return name.replace(/[A-Z]/g, function (letter, pos) {
							return (pos ? separator : '') + letter.toLowerCase();
						});
					}

					function checkIfPermitRevoked() {

						if ($scope.internalDocument && $scope.internalDocument.header.schema == 'absPermit') {
							if ($scope.internalDocument.amendmentIntent == 1)
								$scope.isIRCCRevoked = true;
						}
					}

					$scope.api = {
						loadDocument: $scope.loadDocument
					}

				}]
		}
	}]);
});
