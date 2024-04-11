const puppeteer = require('puppeteer');
/*
 * 命名简写备注
 *
 * 省级（省份，Province）           p
 * 地级（城市，City）               c
 * 县级（区县，Area）               a
 * 乡级（乡镇街道，Street）         s
 * 村级（村委会居委会，Village）    v
 */

const pReg = /<a href="(.*?).html">(.*?)<br><\/a>/;
const casReg =
	/<td><a href=.*?>(.*?)<\/a><\/td><td><a href=.*?>(.*?)<\/a><\/td>/;
const vReg = /<td>(.*?)<\/td><td>.*?<\/td><td>(.*?)<\/td>/;

const host = 'https://www.stats.gov.cn';
const path = '/sj/tjbz/tjyqhdmhcxhfdm/2023/#{route}.html';

/**
 * 抓取数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 19:23
 */
exports.fetch = async (host, route, regexp, codeLen) => {
	let browser = await puppeteer.launch({
		// 若是手动下载的chromium需要指定chromium地址, 默认引用地址为 /项目目录/node_modules/puppeteer/.local-chromium/
		// executablePath: '',

		ignoreDefaultArgs: ['--disable-extensions'],
		//设置超时时间
		timeout: 15000,
		//如果是访问https页面 此属性会忽略https错误
		ignoreHTTPSErrors: true,
		// 窗口大小
		// defaultViewport: {
		//   width: 600,
		//   height: 700
		// },
		// 打开开发者工具, 当此值为true时, headless总为false
		// devtools: false,
		// 关闭headless模式, 会打开浏览器
		headless: false,
	});
	let page = await browser.newPage();
	await page.goto(`${host}${path.replace('#{route}', route)}`);
	// await page.waitForNavigation({ waitUntil: 'networkidle0' });
	// https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/index.html
	const data = await page.evaluate(() => {
		console.log('excute');
		let List2map = {};
		let list = [];
		let regexp = null;
		let codeLen = 0;
		if (document.querySelector('.provincetable')) {
			list = document.querySelectorAll('.provincetr td');
			regexp = /<a href="(.*?).html">(.*?)<br><\/a>/;
			codeLen = 2;
		} else if (document.querySelector('.citytable')) {
			list = document.querySelectorAll('.citytable .citytr');
			regexp =
				/<td><a href=.*?>(.*?)<\/a><\/td><td><a href=.*?>(.*?)<\/a><\/td>/;
			codeLen = 4;
		} else if (document.querySelector('.countytable')) {
			list = document.querySelectorAll('.countytable .countytr');

			regexp = (node) => {
				let codeAndName = Array.from(node.querySelectorAll('td')).map((td) => {
					return td.innerText;
				});
				return [0, ...codeAndName];
			};

			codeLen = 6;
		} else if (document.querySelector('.towntable')) {
			list = document.querySelectorAll('.towntable .towntr');
			regexp =
				/<td><a href=.*?>(.*?)<\/a><\/td><td><a href=.*?>(.*?)<\/a><\/td>/;
			codeLen = 9;
		} else if (document.querySelector('.villagetable')) {
			list = document.querySelectorAll('.villagetable .villagetr');
			regexp = /<td>(.*?)<\/td><td>.*?<\/td><td>(.*?)<\/td>/;
			codeLen = 12;
		}
		Array.from(list).map((pNode) => {
			let current = [];
			if (Object.prototype.toString.call(regexp) == '[object Function]') {
				current = regexp(pNode);
				debugger
			} else {
				current = new RegExp(regexp).exec(pNode.innerHTML);
			}
			try {
				List2map[current[1].substr(0, codeLen)] = current[2].trim();
			} catch (error) {
				console.log(error);
			}
			console.log(current);
		});
		return List2map;
	});
	browser.close();
	return data;
};

/**
 * 抓取省级数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 19:40
 */
exports.fetchProvinces = async () => {
	try {
		return await exports.fetch(host, 'index', pReg, 2);
	} catch (err) {
		if (err.message !== 'timeout')
			console.log(`抓取省级数据失败（${err}），正在重试...`);
		return exports.fetchProvinces();
	}
};

/**
 * 抓取地级数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 19:51
 */
exports.fetchCities = async (pCode) => {
	try {
		return await exports.fetch(host, pCode, casReg, 4);
	} catch (err) {
		if (err.message !== 'timeout')
			console.log(`抓取省级（${pCode}）的地级数据失败（${err}），正在重试...`);
		return exports.fetchCities(pCode);
	}
};

/**
 * 抓取县级数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 20:03
 */
exports.fetchAreas = async (cCode) => {
	cCode = cCode.toString();
	const pCode = cCode.substr(0, 2);

	try {
		return await exports.fetch(host, `${pCode}/${cCode}`, casReg, 6);
	} catch (err) {
		if (err.message !== 'timeout')
			console.log(`抓取地级（${cCode}）的县级数据失败（${err}），正在重试...`);
		return exports.fetchAreas(cCode);
	}
};

/**
 * 抓取乡级数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 20:08
 */
exports.fetchStreets = async (aCode, route) => {
	aCode = aCode.toString();
	const pCode = aCode.substr(0, 2);
	const cCodeSuffix = aCode.substr(2, 2);
	const _route = route || `${pCode}/${cCodeSuffix}/${aCode}`;

	try {
		return await exports.fetch(host, _route, casReg, 9);
	} catch (err) {
		if (err.message !== 'timeout')
			console.log(`抓取县级（${aCode}）的乡级数据失败（${err}），正在重试...`);
		return exports.fetchStreets(aCode, route);
	}
};

/**
 * 抓取村级数据
 * @author modood <https://github.com/modood>
 * @datetime 2018-01-31 20:19
 */
exports.fetchVillages = async (sCode, route) => {
	sCode = sCode.toString();
	const pCode = sCode.substr(0, 2);
	const cCodeSuffix = sCode.substr(2, 2);
	const aCodeSuffix = sCode.substr(4, 2);
	const _route = route || `${pCode}/${cCodeSuffix}/${aCodeSuffix}/${sCode}`;

	try {
		return await exports.fetch(host, _route, vReg, 12);
	} catch (err) {
		if (err.message !== 'timeout')
			console.log(`抓取乡级（${sCode}）的村级数据失败（${err}），正在重试...`);
		return exports.fetchVillages(sCode, route);
	}
};
