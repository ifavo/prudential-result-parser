// get modules
var fs = require('fs');
var Nightmare = require('nightmare');

// define data source and target
var url = 'http://results.prudentialridelondon.co.uk/2015/?pid=search&num_results=100';
var csvFile = 'prudential.csv';

// init target file with a headline
fs.writeFileSync(csvFile, [
	'Number',
	'Name',
	'Country',
	'Age',
	'Club',
	'Distance',
	'EST MILE 17',
	'EST MILE 26',
	'EST MILE 47',
	'EST MILE 55',
	'EST MILE 75',
	'EST MILE 85',
	'FINISH',
	'FINISH SECONDS',
	'Gender'
].join(';') + "\r\n");

// cache of urls already processed
var processed = [];

// start with loading male data
loadUrl(url + '&search%5Bsex%5D=M', 'Men');

// and load female parallel
loadUrl(url + '&search%5Bsex%5D=W', 'Women');


/**
 * load url and parse content
 * @param {url}
 */
function loadUrl(url, filterString) {
	processed.push(url);
	
	// next url to load
	var nextUrl;
	
	// load process
	new Nightmare()
	
	  // load url
	  .goto(url)
	
		// get next url to load
	    .evaluate(function () {
			var nextPage = document.querySelectorAll('.pages-nav-button');
			return nextPage[nextPage.length-1].href;
		}, function (nextPage) {
			console.log("nextPage", nextPage);
			nextUrl = nextPage;
		})
		
		// get array of participants on the current page
		.evaluate(function () {
			var rows = document.querySelectorAll('.list-table tr');
			var list = [];
			for ( var i = 1; i < rows.length; i++ ) {
				var cols = rows[i].querySelectorAll('td');
				var data = [];
				for ( var j in cols ) {
					// extract country
					var text = cols[j].innerText ? String(cols[j].innerText).replace('» ', '') : '';
					data.push('"' + text + '"');
					
					// extract country code
					if ( j == 1 ) {
						data.push(text.match(/\((.*)\)/)[1]);
					}
					
					// convert finish time into seconds
					if ( j == 11 ) {
						var seconds = 0;
						var num = text.split(':');
						seconds = (Number(num[0]) * 3600) + (Number(num[1]) * 60) + (Number(num[2]));
						data.push(seconds);
					}
				}
				list.push(data);
			}
			return JSON.stringify(list);
			
		// write csv
		}, function (rows) {
			rows = JSON.parse(rows);
			if ( rows ) {
				var row;
				while ( row = rows.shift() ) {
        			row.push(filterString);
					var line = row.join(';');
					fs.appendFileSync(csvFile, line + "\r\n");
				}
			}
		})
		
		// execute and load next url (if available)
	    .run(function (err, nightmare) {
			if (err) return console.log(err);
			if ( nextUrl && processed.indexOf(nextUrl) == -1 ) {
				loadUrl(nextUrl, filterString);
			}
	    });
}