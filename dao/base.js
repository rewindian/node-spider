var mysql = require('mysql');
var pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'drawler',
	port: 3306
});

exports.pool = pool;

/**
 * 释放数据库连接
 */
exports.release = function(connection) {
    connection.end(function(error) {
        console.log('Connection closed');
    });
};
 
/**
 * 执行查询
 */
exports.execQuery = function(options) {
    pool.getConnection(function(error, connection) {
        if(error) {
            console.log('DB-获取数据库连接异常！');
            throw error;
        }
 
        /*
         * connection.query('USE ' + config.db, function(error, results) { if(error) { console.log('DB-选择数据库异常！'); connection.end(); throw error; } });
         */
 
        // 查询参数
        var sql = options['sql'];
        var args = options['args'];
        var handler = options['handler'];
 
        // 执行查询
        if(!args) {
            var query = connection.query(sql, function(error, results) {
                if(error) {
                    console.log('DB-执行查询语句异常！');
                    throw error;
                }
 
                // 处理结果
                handler(results);
            });
 
            console.log(query.sql);
        } else {
            var query = connection.query(sql, args, function(error, results) {
                if(error) {
                    console.log('DB-执行查询语句异常！');
                    throw error;
                }
 
                // 处理结果
                handler(results);
            });
 
            console.log(query.sql);
        }
 
        // 返回连接池
        connection.release(function(error) {
            if(error) {
                console.log('DB-关闭数据库连接异常！');
                throw error;
            }
        });
    });
};