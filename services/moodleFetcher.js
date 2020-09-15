const https = require("https");
const fs = require("fs");
const rimraf = require("rimraf");

const site = "https://edu.stankin.ru/";
const courseid = 11557;
const moodle_client = require("moodle-client").init({
	wwwroot: site,
	username: process.env.MOODLE_USER,
	password: process.env.MOODLE_PASS,
});

//получить инфо о файлах с сервера
function getSchedulesData() {
	return moodle_client.then((client) =>
		client
			.call({
				wsfunction: "core_course_get_contents",
				method: "GET",
				args: {
					courseid,
				},
			})
			.then(function(courses) {
				const files = courses
					.reduce(function(files, course) {
						const filesData = course.modules
							.filter((module) => module.modname === "folder")
							.reduce((folders, folder) => {
								folders.push(
									folder.contents.map((file) => ({
										filename: file.filename,
										fileurl: file.fileurl,
									}))
								);

								return folders;
							}, [])
							.flat();

						files.push(filesData);
						return files;
					}, [])
					.flat();

				return files;
			})
	);
}

//скачать файл
function downloadFile(dir, data, token) {
	return new Promise((resolve) => {
		const { filename } = data;
		const file = fs.createWriteStream(`${dir}/${filename}`);

		https.get(`${data.fileurl}&token=${token}`, function(response) {
			response.pipe(file);

			file.on("finish", () => {
				resolve(filename);
			});
		});
	});
}

//скачать файлы
function manageData(dir) {
	if (dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		rimraf.sync(`${dir}/*`);

		return moodle_client.then((client) =>
			getSchedulesData().map((data) =>
				downloadFile(dir, data, client.token)
			)
		);
	} else throw new Error("No dir parametr");
}

module.exports = manageData;
