/**
 * 公用方法
 */

import fs from 'node:fs';
import { readdir, readFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Buffer } from 'node:buffer';
import axios from 'axios';
import md5 from 'md5';

class Common {

    //构造函数，设置默认配置
    constructor() {
        this.configDir = resolve('conf/');
    }

    byteSize(str) {
        return Buffer.byteLength(str, 'utf8');
    }

    getTimestamp() {
        return Math.floor(Date.now());
    }

    getTimestampInSeconds() {
        return Math.floor(Date.now() / 1000);
    }

    getLocalTimeString(locales, timezone) {
        if (typeof(locales) == 'undefined' || !locales) {
            locales = 'zh-Hans-CN';
        }

        if (typeof(timezone) == 'undefined' || !timezone) {
            timezone = 'Asia/Shanghai';
        }

        let date = new Date();
        let option = {"timeZone": timezone};
        return date.toLocaleString(locales, option);
    }

    sortDict(obj) {                         //dict按key排序
        return Object.keys(obj).sort().reduce(function(result, key) {
            result[key] = obj[key];
            return result;
        }, {});
    }

    sign(params, token) {                    //对参数做MD5签名
        return md5( JSON.stringify(this.sortDict(params)) + token );
    }

    //从conf/目录读取配置文件内容
    async getConfigFromJsonFile(filename) {
        let data = null;

        let filePath = this.configDir + `/${filename}`;
        if (fs.existsSync(filePath)) {
            try {
                const contents = await readFile(filePath, { encoding: 'utf8' });
                if (contents) {
                    data = JSON.parse(contents);
                }
            } catch (err) {
                console.error(`[FAILED] get config content from %s failed, error: %s`, filePath, err.message);
            }
        }else {
            console.error("[ERROR] file %s not exist.", filePath);
        }

        return data;
    }

    getLogArguments() {
        let args = [];
        let localTime = this.getLocalTimeString('zh-Hans-CN', 'Asia/Shanghai');

        if (arguments[0]) {
            let logFormat = `[%s] ${arguments[0]}`;
            args.push(logFormat);
            args.push(localTime);
        }

        if (arguments && arguments.length > 1) {
            for (const index in arguments) {
                if (index > 0) {
                    args.push(arguments[index]);
                }
            }
        }

        return args;
    }

    log() {
        let args = this.getLogArguments.apply(this, arguments);
        console.log.apply(this, args);
        return args;
    }

    info() {
        let args = this.getLogArguments.apply(this, arguments);
        console.info.apply(this, args);
        return args;
    }

    warn() {
        let args = this.getLogArguments.apply(this, arguments);
        console.warn.apply(this, args);
        return args;
    }

    error() {
        let args = this.getLogArguments.apply(this, arguments);
        console.error.apply(this, args);
        return args;
    }

    //保存log到指定文件
    async saveLog(filePath, content) {
        let saved = false;

        try {
            let saveRes = await appendFile(filePath, content);
            if (saveRes == undefined) {
                saved = true;
            }
        } catch (err) {
            console.error(`Log save to %s failed: %s`, filePath, err.message);
        }

        return saved;
    }

    async delay(seconds) {
        await setTimeout(seconds * 1000);
    }

    //创建HeroUnion的爬虫任务
    //参考：
    //* https://github.com/filesite-io/herounion
    //* https://github.com/filesite-io/machete_hero
    async createHeroUnionTask(targetUrl, notifyUrl, configs) {
        let params = {
            uuid: typeof(configs.herounion_id) != 'undefined' && configs.herounion_id ? configs.herounion_id : 'herounion_demo',
            url: targetUrl,
            platform: 'website',    //爬虫支持的平台：任意网站
            contract: 'tajiantv',   //爬虫支持的合约：tajiantv
            data_mode: 'json',
            country: 'cn',
            lang: 'zh',
            notify_url: notifyUrl
        };
        let token = typeof(configs.herounion_token) != 'undefined' && configs.herounion_token ? configs.herounion_token : 'hello#world!';
        params.sign = this.sign(params, token);

        let api = typeof(configs.herounion_server) != 'undefined' && configs.herounion_server ?
                    configs.herounion_server + '/api/newtask/' : 'http://127.0.0.1:8080/api/newtask/';

        const axiosConfig = {
            timeout: typeof(configs.request_timeout) != 'undefined' && configs.request_timeout ? configs.request_timeout*1000 : 10000,
            proxy: false
        };

        const response = await axios.post(api, params, axiosConfig);
        if (response.status == 200) {
            return response.data;
        }

        return false;
    }

    //查询HeroUnion任务结果
    async queryHeroUnionTask(task_id, configs) {
        let params = {
            uuid: typeof(configs.herounion_id) != 'undefined' && configs.herounion_id ? configs.herounion_id : 'herounion_demo',
            task_id: task_id
        };
        let token = typeof(configs.herounion_token) != 'undefined' && configs.herounion_token ? configs.herounion_token : 'hello#world!';
        params.sign = this.sign(params, token);

        let api = typeof(configs.herounion_server) != 'undefined' && configs.herounion_server ?
                    configs.herounion_server + '/api/querytask/' : 'http://127.0.0.1:8080/api/querytask/';

        const axiosConfig = {
            timeout: typeof(configs.request_timeout) != 'undefined' && configs.request_timeout ? configs.request_timeout*1000 : 10000,
            proxy: false
        };

        let queryOption = axiosConfig;
        queryOption.method = 'get';
        queryOption.url = api;
        queryOption.params = params;

        const response = await axios(queryOption);
        if (response.status == 200) {
            return response.data;
        }

        return false;
    }

}

let commonFuns = new Common();
export default commonFuns;