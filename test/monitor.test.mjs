/**
 * Monitor测试用例
 */

import test from 'node:test';
import assert from 'node:assert';
import axios from 'axios';
import common from '../lib/common.mjs';
import Monitor from '../monitor.mjs';

const axiosConfig = {
    timeout: 5000,
    proxy: false
};

test('common.createHeroUnionTask test', async (t) => {
    let configFile = 'config_test.json';
    let configs = await common.getConfigFromJsonFile(configFile);
    console.log("configs from %s", configFile, configs);

    let targetUrl = 'https://tajian.tv';
    let notifyUrl = '';

    let taskRes = await common.createHeroUnionTask(targetUrl, notifyUrl, configs);
    console.log("Task create result", taskRes);
    assert.equal(taskRes.code, 1);
});

test('common.queryHeroUnionTask test', async (t) => {
    let configFile = 'config_test.json';
    let configs = await common.getConfigFromJsonFile(configFile);
    console.log("configs from %s", configFile, configs);

    let task_id = 'machete_tajian_1717495858207';
    let taskRes = await common.queryHeroUnionTask(task_id, configs);
    console.log("Task data", taskRes);
    assert.equal(taskRes.code, 1);
});