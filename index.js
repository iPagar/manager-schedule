require("dotenv").config();
const fs = require("fs");
const moodle = require("./services/moodleFetcher");
const parser = require("./services/parser");
const {
	insertLessons,
	insertFiles,
	getFile,
	insertFavourite,
	removeFavourite,
	getFavourites,
	getLessons,
	getStgroup,
	getGroups,
} = require("./services/mongoDriver");
const rimraf = require("rimraf");

const dir = `./schedules`;

function update(courseExp, folderExp) {
	return moodle(dir, courseExp, folderExp)
		.then(async (files) => {
			const promises = files.map((filename) =>
				parser(`${dir}/${filename}`)
			);
			let lessons = [];
			const pdfs = [];

			await Promise.all(promises).then((schedules) =>
				schedules.map((schedule) => {
					const { filename, file, parsed } = schedule;

					lessons = lessons.concat(parsed);
					pdfs.push({ name: filename, file });
				})
			);

			return { pdfs, lessons };
		})
		.then(async (resp) => {
			await insertFiles(resp.pdfs);
			return insertLessons(resp.lessons);
		})
		.then(() => rimraf.sync(dir))
		.catch((e) => console.log(e));
}

module.exports = {
	update,
	getFile,
	insertFavourite,
	getFavourites,
	getLessons,
	getStgroup,
	getGroups,
};
