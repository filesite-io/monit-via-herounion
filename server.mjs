import common from './lib/common.mjs';
import Monitor from './monitor.mjs';

(async () => {
	let configFile = 'config.json';

	//命令行参数支持，格式：npm start -- my_config.json
    if (process.argv.length >= 3) {
        configFile = process.argv[2];
    }

    //环境变量支持，格式：CONFIGFILE=my_config.json pm2 start server.mjs
    if (typeof(process.env.CONFIGFILE) != 'undefined') {
        configFile = process.env.CONFIGFILE;
    }

    let monitor = new Monitor(configFile);
    await monitor.init();
})();