var app = document.getElementById('app');

var router = new Router({
	'' : homeController(app),
	'emperor' : emperorController(app)
});

function emperorController(appEl) {
	return function handleRequest(queryString) {
		addLoadingPanel();
		getEmperorData(queryString).then(function(model){
			appEl.innerHTML = '';
			var el = document.createElement('div');
			delegate(el, {
				'click [data-internal-link]' : handleInternalLink
			});
			el.className = 'container';
			addSection(el, 'banner-template', {});
			addSection(el, 'emperor-template', model.getEmperor());
			appEl.appendChild(el);
			removeLoadingPanel();
		});
	};
}

function homeController (appEl) {
	return function handleRequest(queryString) {
		addLoadingPanel();
		getData(queryString).then(function (model) {
			var el = document.createElement('div');
			el.className = 'container';
			appEl.innerHTML = '';
			delegate(el, {
				'click [data-internal-link]' : handleInternalLink
			});

			var asideEl = document.createElement('div');
			asideEl.className = 'aside';
			renderAside(asideEl, model);

			var mainEl = document.createElement('div');
			mainEl.className = 'content';

			addSection(el, 'banner-template', {});

			renderResults(mainEl, model.getResults());

			el.appendChild(asideEl);
			el.appendChild(mainEl);

			addSection(el, 'footer-template', {});

			appEl.appendChild(el);

			new SelectionBox('#simple-styling');
			new SelectionBox('#dynasties');
			removeLoadingPanel();

		});
	}
}

function renderAside(el, model) {
	var asideTemplate = getTemplate('aside-template');
	html(el, TemplateEngine(asideTemplate, model.getRefinements()));

	delegate(el, {
		'change #simple-styling' : createHandleSortByToggle(model),
		'change #dynasties' : createFilterByDynasty(model),
		'change #year-from' : createFilterByYearFrom(model),
		'change #year-to' : createFilterByYearTo(model)
	});
}

function renderResults(el, results) {
	var resultTemplate = getTemplate('result-template');
	var frag = document.createDocumentFragment();
	var loadingPanel = document.createElement('div');
	loadingPanel.className = 'loading-panel';
	frag.appendChild(loadingPanel)
	frag = results.reduce(function (frag, resultData) {
		html(frag, TemplateEngine(resultTemplate, resultData));
		return frag;
	}, frag);
	el.appendChild(frag);
}

function createHandleSortByToggle(model) {
	return function handleSortByToggle(event) {
		model.setSortBy(event.target.value);
		router.navigate(createPath(model));
	}
}
function createFilterByDynasty(model) {
	return function filterByDynasty(event) {
		model.setFilterByDynasty(event.target.value);
		router.navigate(createPath(model));
	}
}

function createFilterByYearFrom(model) {
	return function (event) {
		model.setYearFrom(event.target.value);
		router.navigate(createPath(model));
	}
}

function createFilterByYearTo(model) {
	return function (event) {
		model.setYearTo(event.target.value);
		router.navigate(createPath(model));
	}
}

function createPath(model) {
	return '' + model.getQueryString();
}

//  no need to remove as will be wiped out when page is re-rendered
function addLoadingPanel() {
	document.body.classList.add('loading');
}

function removeLoadingPanel() {
	document.body.classList.remove('loading');
}

function getData(queryString) {
	return fetch('http://localhost:3000/api/emperors' + '?' + queryString).then(function (response) {
		return response.json().then(function(json) {
			return createModel(json, queryString);
		});
	});
}

function getEmperorData(queryString) {
	return fetch('http://localhost:3000/api/emperor' + '?' + queryString).then(function (response) {
		return response.text().then(function (text) {
			return createEmperorModel(text);
		});
	});
}

function getQueryParams(queryString) {
	//  http://stevenbenner.com/2010/03/javascript-regex-trick-parse-a-query-string-into-an-object/
	var queryParams = {};

	queryString.replace(
		new RegExp("([^?=&]+)(=([^&]*))?", "g"),
		function($0, $1, $2, $3) {
			queryParams[$1] = $3;
		}
	);
	return queryParams;
}

function createEmperorModel(text) {
	return {
		getEmperor : function () {
			return {
				text : text
			}
		}
	};
}

function createModel(json, queryString) {
	var queryParams= {};
	if(queryString) {
		queryParams = getQueryParams(queryString);
	}
	return {

		setSortBy : function (sortBy) {
			queryParams['sort-by'] = sortBy;
		},

		setYearFrom : function (yearFrom) {
			queryParams['year-from'] = yearFrom;
		},

		setYearTo : function (yearTo) {
			queryParams['year-to'] = yearTo;
		},

		setFilterByDynasty : function (dynasty) {
			queryParams['dynasty'] = dynasty;
		},

		getRefinements : function () {
			//  get refinements from query string
			//  Need to only return properties for existing params
			//  let server handle default results
			return json.criteria;
		},

		getResults : function () {
			return json.results;
		},

		getQueryString : function () {
			return Object.keys(queryParams).reduce(function (memo, key, index) {
				var amper = (index > 0) ? '&' : '';
				return memo + amper + key + '=' + queryParams[key];
			}, '?');
		},

		getPagination : function () {}

	};
}

function handleInternalLink(event) {
	event.preventDefault();
	var href = event.target.getAttribute('href');
	router.navigate(href);
}

function html(el, htmlString) {
	//  todo should also handle case where string represents more than single root element
	//  iterate through children and append each to node.
	var tempEl = document.createElement('div');
	tempEl.innerHTML = htmlString;
	el.appendChild(tempEl.firstElementChild);
}

function getTemplate(id) {
	return document.getElementById(id).textContent;
}

function addSection(el, templateId, data) {
	var bannerTemplate = getTemplate(templateId);
	html(el, TemplateEngine(bannerTemplate, data));
}

router.start();





