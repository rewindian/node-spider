var express = require('express');
var router = express.Router();
var eventproxy = require('eventproxy');
var cheerio = require('cheerio');
var url = require('url');
var async = require('async');
var http = require("http");
var fs = require("fs");
//var superagent = require('superagent');
const charset = require('superagent-charset');
const superagent = require('superagent');
charset(superagent);

//var pool = require('../dao/base').pool;
var baseDao = require('../dao/base');
var cnodeUrl = 'https://cnodejs.org';

var spider = function(page, cnodeUrl) {
	var params = "tab=all&page=" + page;
	var url = cnodeUrl + "/?" + params;

	var saveData = function(topic) {
		var options = {};
		options.sql = "select count(0) from T_TEST where COL_1=?";
		options.args = [topic.url];
		options.handler = function(res) {
			if (res[0]['count(0)'] > 0) {
				return;
			} else {
				options = {};
				options.sql = "insert into T_TEST (COL_1,COL_2,COL_3,COL_4,CREATE_DATE) values (?,?,?,?,NOW())";
				options.args = [topic.url, topic.title, topic.author, topic.imgSrc];
				options.handler = function(res) {

				}
				baseDao.execQuery(options);
			}
		}
		baseDao.execQuery(options);
	}

	superagent.get(url)
		.end(function(err, res) {
			if (err) {
				return console.error(err);
			}
			var topicUrls = [];
			var titles = [];
			var topics = [];
			var $ = cheerio.load(res.text);
			// 获取首页所有的链接
			$('#topic_list .topic_title').each(function(idx, element) {
				var $element = $(element);
				var imgSrc = $element.parent().parent().find('a.user_avatar').find('img').attr('src');
				topics.push({
					title: $element.attr('title'),
					url: cnodeUrl + $element.attr('href'),
					imgSrc: imgSrc
				});
			});

			setTimeout(function() {
				async.mapLimit(topics, 5, function(topic, callback) {
					setTimeout(function() {
						superagent.get(topic.url)
							.end(function(err, res) {
								console.log('fetch ' + topic.url + ' successful');
								//console.log(res.text);
								var $ = cheerio.load(res.text);
								//debugger
								var author = $('div.user_card').find('span.user_name').find('a').text();
								topic.author = author;
								console.log(author);
								saveData(topic);
							});
						callback(null, topics);
					}, 2000);
				}, function(err, result) {
					console.log('final:');
					//				console.log(result);
				});
			}, 2000);
		});
}

/* GET home page. */
router.get('/pachong', function(req, res, next) {
	//debugger
	var page = req.query.page || 1;
	spider(page, cnodeUrl);
	res.json({
		"status": "任务开始"
	});

});

router.get('/mysql', function(req, res, next) {
	var mysql = require('mysql');
	var conn = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'drawler',
		port: 3306
	});
	conn.connect();
	var sqls = {
		'insertSQL': 'insert into T_TEST(COL_1) values("conan"),("fens.me")',
		'selectSQL': 'select * from T_TEST limit 10',
		'deleteSQL': 'delete from T_TEST',
		'updateSQL': 'update T_TEST set COL_1="conan update"  where COL_1="conan"'
	};

	var tasks = ['deleteSQL', 'insertSQL', 'selectSQL', 'updateSQL', 'selectSQL'];
	async.eachSeries(tasks, function(item, callback) {
		console.log(item + " ==> " + sqls[item]);
		conn.query(sqls[item], function(err, res) {
			console.log(res);
			callback(err, res);
		});
	}, function(err) {
		console.log("err: " + err);
		conn.end();
	});
});

router.get("/pool", function(req, res, next) {
	var options = {};
	options.sql = "select * from T_TEST where ID = ? limit 10";
	options.args = [5];
	options.handler = function(res) {
		res.forEach(function(item, i) {
			console.log(item.COL_1);
		})
	}
	baseDao.execQuery(options);

});

router.get("/spider", function(req, res, next) {
	var urls = [];
	for (var i = 1; i <= 100; i++) {
		urls.push("http://localhost:3000/pachong?page=" + i);
	}
	async.mapLimit(urls, 1, function(url, callback) {
		setTimeout(function() {
			superagent.get(url)
				.end(function(err, res) {
					console.log('-------------------requesting:' + url);
				});
			callback(null, urls);
		}, 10000);
	}, function(err, result) {
		if (err) console.log("err: " + err);
	});
	res.send("任务开始");
});

router.get("/getImg", function(req, res, next) {
	var u = 'https://gravatar.com/avatar/dbefd0e4d332a8d252c0251075262e8d?s=48';
	//	var u = "http://s0.hao123img.com/res/img/logo/logonew.png";
	//本地存储目录
	var dir = 'D:/nodejsWorkspace/spider/public/images/';
	//通过superagent 获取图片数据，并保存到本地。
	superagent.get(u).set({
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36'
		})
		.end(function(err, sres) {
			if (err) throw err;
			//根据访问路径获得文件名称
			var ttt = u.split('/');
			var name = ttt[ttt.length - 1];
			var path = dir + 'logo.png';
			fs.writeFile(path, sres.body, function() {
				console.log(u);
				console.log('已成功抓取至' + path);
			});
		});
	res.send("任务开始");
});

router.get("/saveImg", function(req, res, next) {
	var dir = 'D:/nodejsWorkspace/spider/public/images/';
	var options = {};
	options.sql = "SELECT * FROM t_test WHERE COL_4 IS NOT NULL";
	//	options.args = [topic.url, topic.title, topic.author, topic.imgSrc];
	options.handler = function(res) {
		console.log(res);
		async.mapLimit(res, 5, function(topic, callback) {
			setTimeout(function() {
				superagent.get(topic.COL_4).set({
						'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36'
					})
					.end(function(err, sres) {
						if (err) throw err;
						//根据访问路径获得文件名称
						var path = dir + topic.ID + '.png';
						fs.writeFile(path, sres.body, function() {
							console.log(topic.COL_4+'已成功抓取至 ' + path);
							var opt={};
							opt.sql="update t_test set ICON = ? where ID = ?";
							opt.args = [path,topic.ID];
							opt.handler = function(res){
								
							};
							baseDao.execQuery(opt);
						});
					});
				callback(null, res);
			}, 10000);
		}, function(err, result) {
			if (err) console.log("err: " + err);
		});
	}
	baseDao.execQuery(options);
	res.send("任务开始");
});

module.exports = router;