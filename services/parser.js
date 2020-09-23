const fs = require("fs");
const parser = require("rector-schedule-parser");
const db = require("./mongoDriver");

function parseFile(path) {
	return parser(path).then((lessons) => {
		return lessons
			.map((lesson) => {
				const {
					stgroup,
					subject,
					audience,
					group,
					teacher,
					type,
					start_time,
				} = lesson;

				const oneDay = lesson.dates.map((date) => {
					//год, месяц(0 - 11), день, часы, минуты
					const newDate = new Date(
						new Date(Date.now()).getFullYear(),
						date.match(/\d{2}$/) - 1,
						date.match(/^\d{2}/),
						start_time.match(/^\d{1,2}/)[0],
						start_time.match(/\d{1,2}$/)[0]
					);

					return {
						stgroup,
						subject,
						audience,
						group,
						teacher,
						type,
						start_date: newDate,
						end_date: newDate,
						repeat: "once",
					};
				});

				const repeatDay = lesson.periods.map((period) => {
					const { start_date, end_date, repeat } = period;

					//год, месяц(0 - 11), день, часы, минуты
					const startDate = new Date(
						new Date(Date.now()).getFullYear(),
						start_date.match(/\d{2}$/) - 1,
						start_date.match(/^\d{2}/)[0],
						start_time.match(/^\d{1,2}/)[0],
						start_time.match(/\d{1,2}$/)[0]
					);

					const endDate = new Date(
						new Date(Date.now()).getFullYear(),
						end_date.match(/\d{2}$/) - 1,
						end_date.match(/^\d{2}/)[0],
						start_time.match(/^\d{1,2}/)[0],
						start_time.match(/\d{1,2}$/)[0]
					);

					// console.log(lesson, startDate.toString());

					return {
						stgroup,
						subject,
						audience,
						group,
						teacher,
						type,
						start_date: startDate,
						end_date: endDate,
						repeat,
					};
				});

				return [...oneDay, ...repeatDay];
			})
			.flat();
	});
}

// parseFile("./schedules/АДБ-18-10.pdf").then((r) => {
// console.log(r);
// });

function fileToBuffer(path) {
	return new Promise((resolve, reject) => {
		// const stream = fs.createReadStream(path);
		// stream.setEncoding("binary");

		// let data = "";

		// stream.on("readable", function() {
		// 	let chunk = stream.read();

		// 	if (chunk !== null) data += chunk;
		// });

		// stream.on("end", function() {
		// 	resolve(data);
		// });

		// stream.on("error", function(err) {
		// 	if (err.code == "ENOENT") {
		// 		reject("Файл не найден");
		// 	} else {
		// 		reject(err);
		// 	}
		// });

		fs.readFile(path, function(err, data) {
			if (err) throw err;

			// console.log(data.toString("base64"));
			resolve(data.toString("base64"));
		});
	});
}

function getFile(path) {
	const filename = path.match(/(?<name>[А-яа-я\d-() ]*)\.pdf/).groups.name;

	return fileToBuffer(path).then((file) => {
		return parseFile(path).then((parsed) => {
			return { filename, file, parsed };
		});
	});
}

module.exports = getFile;
