/**
 * Monitor via HeroUnion
 */

import path from 'node:path';
import cron from 'node-cron';
import axios from 'axios';
import common from './lib/common.mjs';
import md5 from 'md5';

class Monitor {

    //构造函数，设置默认配置
    constructor(configFilename) {
        this.config = null;
        this.configFile = typeof(configFilename) != 'undefined' && configFilename ? configFilename : 'config.json';

        //默认配置
        this.systemLogDir = 'log/';                             //系统日志保存目录
        this.reloadConfigFrequence = 5;                         //单位：分钟，配置重新加载时间间隔
        this.monitFrequence = 10;                                 //单位：分钟，检测时间间隔
        this.resultQueryFrequence = 1;                             //单位：分钟，检测任务结果查询时间间隔

        this.tasks = [];                                        //HeroUnion检测任务队列
    }

    async getConfig(forceReload) {
        const _self = this;

        if ( !this.config || (typeof(forceReload) != 'undefined' && forceReload) ) {
	        console.log("Load config from %s", this.configFile);
            let config = await common.getConfigFromJsonFile(this.configFile);

            //覆盖默认配置
            for (const key in config) {
                if (typeof(_self[key]) != 'undefined') {
                    _self[key] = config[key];
                }
            }

            this.config = config;
        }

        return this.config;
    }

    //自动重新加载配置文件
    autoReloadConfigs() {
        const _self = this;

        const frequence = typeof(this.config.reloadConfigFrequence) != 'undefined'
                            && this.config.reloadConfigFrequence ? this.config.reloadConfigFrequence : 5;    //5 分钟重新加载一次
        const cronjob = cron.schedule(`*/${frequence} * * * *`, () =>  {
            const forceReload = true;
            _self.getConfig(forceReload);
        }, {
            scheduled: false
        });

        cronjob.start();
        common.log('Cronjob of config auto reload started.');
    }

    //自动向HeroUnion提交检测任务
    autoCreateMonitTask() {
        const _self = this;

        const frequence = typeof(this.config.monitFrequence) != 'undefined'
                            && this.config.monitFrequence ? this.config.monitFrequence : 10;    //10 分钟检测一次
        const cronjob = cron.schedule(`*/${frequence} * * * *`, async () =>  {
            let configs = await _self.getConfig();
            if (configs.monit_urls.length == 0) {
                return false;
            }

            let taskRes;
            let total = configs.monit_urls.length;
            for (let i=0; i<total; i++) {
            	if (_self.tasks.find((item) => item.url == configs.monit_urls[i] && item.stats != 'done')) {continue;}

                console.log("Checking url %s ...", configs.monit_urls[i]);
                taskRes = await common.createHeroUnionTask(configs.monit_urls[i], '', configs);
                if (taskRes && taskRes.code == 1) {
                    _self.tasks.push(taskRes.task);
                }else {
                    console.error("Monit task create failed", taskRes);
                }
            }
        }, {
            scheduled: false
        });

        cronjob.start();
        common.log('Cronjob of url monit started.');
    }

    async queryTasks() {
    	const _self = this;
        let configs = await _self.getConfig();

    	let task, taskRes;
        for(let index = 0; index < _self.tasks.length; index ++) {
        	task = _self.tasks[index];
        	if (task.status == 'done') {continue;}

            //console.log('Query task result of %s', task.id);
            taskRes = await common.queryHeroUnionTask(task.id, configs);
        	if (taskRes && taskRes.code == 1) {
                _self.tasks[index] = taskRes.task;

                common.log('Connect success, url: %s, task id: %s', task.url, task.id);

                let currentTime = common.getLocalTimeString();
                let logFile = path.resolve(_self.systemLogDir) + '/ok.log';
                common.saveLog(logFile, `[${currentTime}] Url request success: ${task.url}, task id: ${task.id}\n`);
            }else {
                console.error("Monit task query failed", taskRes);

                //TODO: 写入日志，或发送告警
                common.error('Connect warning, url: %s, task id: %s', task.url, task.id);

                let currentTime = common.getLocalTimeString();
                let logFile = path.resolve(_self.systemLogDir) + '/fail.log';
                common.saveLog(logFile, `[${currentTime}] Url request failed: ${task.url}, task id: ${task.id}\n`);
            }
        }

        //更新tasks，去掉已完成的
        _self.tasks = _self.tasks.filter((item) => item.status != 'done');
    }

    //自动查询监控任务结果
    autoQueryTaskResult() {
        const _self = this;

        const frequence = typeof(this.config.resultQueryFrequence) != 'undefined'
                            && this.config.resultQueryFrequence ? this.config.resultQueryFrequence : 5;    //5 分钟检测一次
        const cronjob = cron.schedule(`*/${frequence} * * * *`, async () =>  {
            if (_self.tasks.length == 0) {
                return false;
            }

            await _self.queryTasks();
        }, {
            scheduled: false
        });

        cronjob.start();
        common.log('Cronjob of monit task result query started.');
    }

    //初始化
    async init() {
        await this.getConfig();
        this.autoReloadConfigs();
        this.autoCreateMonitTask();
        this.autoQueryTaskResult();
    }


}

export default Monitor;