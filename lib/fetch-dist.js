const axios = require('axios');
const fs = require('fs');
const path = require('path');
async function fetchGitHubDist() {
	let preLoad = '';
	let res = await axios({
		method: 'get',
		url: 'https://github.com/modood/Administrative-divisions-of-China/raw/master/dist/data.sqlite',
		responseType: 'arraybuffer',
		onDownloadProgress(ProgressEvent) {
			console.clear();
			let speed = (ProgressEvent.loaded - preLoad) * 2;
			console.log(
				`正在下载 ${(ProgressEvent.progress * 100).toFixed(2)}% ${
					ProgressEvent.loaded / 1024 / 1024
				}MB / ${ProgressEvent.total / 1024 / 1024}MB   ETA ${(
					(ProgressEvent.total - ProgressEvent.loaded) /
					speed
				).toFixed(0)}s`
			);
			preLoad = ProgressEvent.loaded;
		},
	});
	const dataFile = Buffer.from(res.data);
	fs.writeFileSync(path.join(__dirname, '../data2.sqlite'), dataFile);
}
// fetchGitHubDist();

async function xxx(){
	let res = await axios({
		method: 'get',
		url: 'https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/index.html',
	});
	console.log(res)
}
xxx()
