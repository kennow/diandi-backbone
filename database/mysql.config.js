module.exports =
    {
        mysql: {
            /**
             * 最大连接数. (默认: 10)
             */
            connectionLimit: 0,

            /**
             * 当没有连接池或者链接数打到最大值时pool的行为.
             *      -- 为true时链接会被放入队列中，当可用是调用
             *      -- 为false时会立即返回error.
             *      (默认: true)
             */
            waitForConnections: true,

            /**
             * 连接数据库所在的主机名. (默认: localhost)
             */
            host: 'www.pusudo.cn',

            /**
             * MySQL用户的用户名
             */
            user: 'root',

            /**
             * MySQL用户的密码
             */
            password: 'BigUp888',

            /**
             * 链接到的数据库名称 (可选)
             */
            database: 'crumb',

            /**
             * 连接端口. (默认: 3306)
             */
            port: 3306

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
            // localAddress: 用于TCP连接的IP地址. (可选)
            // socketPath: 链接到unix域的路径。在使用host和port时该参数会被忽略.
            // charset: 连接的字符集. (默认: 'UTF8_GENERAL_CI'.设置该值要使用大写!)
            // timezone: 储存本地时间的时区. (默认: 'local')
            // stringifyObjects: 是否序列化对象. See issue #501. (默认: 'false')
            // insecureAuth: 是否允许旧的身份验证方法连接到数据库实例. (默认: false)
            // typeCast: 确定是否讲column值转换为本地JavaScript类型列值. (默认: true)
            // queryFormat: 自定义的查询语句格式化函数.
            // supportBigNumbers: 数据库处理大数字(长整型和含小数),时应该启用 (默认: false).
            // bigNumberStrings: 启用 supportBigNumbers和bigNumberStrings 并强制这些数字以字符串的方式返回(默认: false).
            // dateStrings: 强制日期类型(TIMESTAMP, DATETIME, DATE)以字符串返回，而不是一javascript Date对象返回. (默认: false)
            // debug: 是否开启调试. (默认: false)
            // multipleStatements: 是否允许在一个query中传递多个查询语句. (默认: false)
            // flags: 链接标志.
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
    };