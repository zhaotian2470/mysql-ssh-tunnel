/**
 * @author Zhao Tian <zhaotian@hotmail.com>
 */

const mysql  = require('mysql2/promise');
const Client = require('ssh2').Client;

class MysqlSSHTunnel {
    constructor(sshConfig, dbConfig) {
        this._conn = null;
        this._sql = null;

        this._sshConfig = Object.assign({}, sshConfig);

        this._dbConfig = Object.assign({}, dbConfig);
        this._dbConfig.port = this._dbConfig.port || 3306;
        this._dbConfig.host = this._dbConfig.host || "localhost";
    }

    connect() {
        return new Promise((resolve, reject) => {
            this._conn = new Client();
            this._conn.on('ready', () => {
                this._conn.forwardOut(
                    '127.0.0.1',
                    0,
                    this._dbConfig.host,
                    this._dbConfig.port,
                    (err, stream) => {
                        if (err) {
                            this.close();
                            const msg = err.reason == 'CONNECT_FAILED' ? 'Connection failed.' : err;
                            return reject(msg);
                        }

                        this._dbConfig.stream = stream;

                        this._sql = mysql.createConnection(this._dbConfig);
                        resolve(this._sql);
                        return null;
                    }
                );
            }).connect(this._sshConfig);
        });
    }

    close() {
        if ('end' in this._sql) {
            this._sql.end((err) => {});
        }

        if ('end' in this._conn) {
            this._conn.end();
        }

    }
}
module.exports = MysqlSSHTunnel;
