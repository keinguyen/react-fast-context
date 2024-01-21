const fs = require("fs");
const packagejson = require("../package.json");

function copyPackageJSON() {
	return new Promise((resolve, reject) => {
		console.info('[COPYING & MODIFYING] Package JSON');
		console.time('[COPIED & MODIFIED] Package JSON in:');

		const cloned = JSON.parse(JSON.stringify(packagejson));

		fs.writeFile('dist/package.json', JSON.stringify(cloned, null, '\t'), 'utf-8', (err) => {
			if (err) {
				reject(err);
				return;
			}

			console.timeEnd('[COPIED & MODIFIED] Package JSON in:');
			resolve(true);
		});
	});
}


async function main() {
	console.time('Postbuild function end in');

	await Promise.all([
		copyPackageJSON(),
	]);

	console.timeEnd('Postbuild function end in');
}

main();
