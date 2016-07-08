var express = require('express');
var router = express.Router();
var xlsx = require('node-xlsx');
var fs = require('fs');
var baseDao = require('../dao/base');

/* GET import excel test. */
router.get('/importExcel', function(req, res, next) {
	var filename = './public/test.xlsx';
	console.error(filename);
	// read from a file
	var obj = xlsx.parse(filename);
	console.log(JSON.stringify(obj));

	res.send('import successfully!');
});
/* GET export excel test. */
router.get('/exportExcel', function(req, res, next) {
	// write
	var data = [
		[1, 2, 3],
		[true, false, null, 'sheetjs'],
		['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'],
		['baz', null, 'qux']
	];
	var buffer = xlsx.build([{
		name: "mySheetName",
		data: data
	}]);
	fs.writeFileSync('b.xlsx', buffer, 'binary');
	res.send('export successfully!');

});

router.get('/exportTopics', function(req, res, next) {
	var iconP = '<table><img src="';
	var iconS = '" width="40" height="40">';
	var options = {};
	options.sql = "SELECT * FROM t_test WHERE COL_4 IS NOT NULL";
	//	options.args = [topic.url, topic.title, topic.author, topic.imgSrc];
	options.handler = function(res) {
		var data = [
			['ID', 'URL', '标题', '作者', '头像']
		];
		res.forEach(function(topic) {
			data.push([topic.ID, topic.COL_1, topic.COL_2, topic.COL_3, iconP + topic.ICON + iconS]);
		});
		var buffer = xlsx.build([{
			name: "mySheetName",
			data: data
		}]);
		fs.writeFileSync('a.xlsx', buffer, 'binary');
	};
	baseDao.execQuery(options);
	res.send("任务开始");
})

module.exports = router;