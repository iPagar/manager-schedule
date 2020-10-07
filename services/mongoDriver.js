const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

// Connection URL
const url = "mongodb://localhost:27017";

// Database Name
const dbName = "stankin";

// Use connect method to connect to the server
const mongo = new MongoClient.connect(url, {
	useUnifiedTopology: true,
}).then((client) => {
	const db = client.db(dbName);

	return db;
});

const insertLessons = function(lessons) {
	return mongo.then(async (client) => {
		await client
			.collection("lessons")
			.catch((err) => console.error(`Fatal error occurred: ${err}`));

		return client.collection("lessons").insertMany(lessons);
	});
};

const drop = function() {
	return mongo.then(async (client) => {
		await client
			.collection("lessons")
			.drop()
			.catch((err) => console.error(`Fatal error occurred: ${err}`));

		await client
			.collection("files")
			.drop()
			.catch((err) => console.error(`Fatal error occurred: ${err}`));
	});
};

const insertFiles = function(files) {
	return mongo.then(async (client) => {
		await client
			.collection("files")
			.catch((err) => console.error(`Fatal error occurred: ${err}`));

		return client.collection("files").insertMany(files);
	});
};

const getGroups = function(stgroup) {
	return mongo.then(async (client) => {
		return client
			.collection("lessons")
			.distinct("group", { stgroup })
			.catch((err) => console.error(`Fatal error occurred: ${err}`));
	});
};

const insertFavourite = function(id, stgroup, group) {
	return mongo.then((client) => {
		return client
			.collection("favourites")
			.updateOne({ id }, { $set: { stgroup, group } }, { upsert: true });
	});
};

const getFavourites = function(id) {
	return mongo.then((client) =>
		client.collection("favourites").findOne({ id })
	);
};

const getFile = function(stgroup) {
	return mongo.then((client) =>
		client.collection("files").findOne({ name: stgroup })
	);
};

const getStgroup = function(stgroup = "") {
	return mongo.then((client) =>
		client
			.collection("files")
			.find(
				{ name: { $regex: `${stgroup.trim()}`, $options: "i" } },
				{ projection: { name: 1 } }
			)
			.toArray()
	);
};

const getLessons = async function(
	stgroup,
	group = "Без подгруппы",
	today = new Date(
		new Date(Date.now()).getFullYear(),
		new Date(Date.now()).getMonth(),
		new Date(Date.now()).getDate()
	)
) {
	const todayFullYear = today.getFullYear();
	const todayMonth = today.getMonth() + 1;
	const todayDate = today.getDate();
	const todayDay = today.getDay() + 1;

	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	const oneDay = await mongo.then((client) =>
		client
			.collection("lessons")
			.find({
				$and: [
					{ stgroup },
					{ $or: [{ group }, { group: "Без подгруппы" }] },
					{ repeat: "once" },
					{ start_date: { $gte: today } },
					{ start_date: { $lte: tomorrow } },
				],
			})
			.toArray()
	);

	const everyWeek = await mongo.then((client) =>
		client
			.collection("lessons")
			.aggregate([
				{
					$match: {
						$and: [
							{ stgroup },
							{ $or: [{ group }, { group: "Без подгруппы" }] },
							{ repeat: "к.н." },
							{
								$expr: {
									$and: [
										{ $gte: [tomorrow, "$start_date"] },
										{ $lte: [today, "$end_date"] },
										{
											$eq: [
												todayFullYear,
												{ $year: "$start_date" },
											],
										},
										{
											$and: [
												{
													$gte: [
														todayMonth,
														{
															$month:
																"$start_date",
														},
													],
												},
												{
													$lte: [
														todayMonth,
														{ $month: "$end_date" },
													],
												},
											],
										},
										{
											$eq: [
												{ $dayOfWeek: "$start_date" },
												todayDay,
											],
										},
									],
								},
							},
						],
					},
				},
			])
			.toArray()
	);

	// console.log(Math.abs((new Date("2020-10-23T15:00:00.000Z") - today)) % 1209600000)
	// console.log((new Date("2020-10-01T09:20:00.000Z")).toString())
	// console.log(Math.abs((new Date("2020-10-01T09:20:00.000Z") - today)) % 1209600000)
	const overWeek = await mongo.then((client) =>
		client
			.collection("lessons")
			.aggregate([
				{
					$match: {
						$and: [
							{ stgroup },
							{ $or: [{ group }, { group: "Без подгруппы" }] },
							{ repeat: "ч.н." },
							{
								$expr: {
									$and: [
										{ $gte: [tomorrow, "$start_date"] },
										{ $lte: [today, "$end_date"] },
										{
											$lte: [
												{
													$mod: [
														{
															$abs: {
																$subtract: [
																	"$start_date",
																	tomorrow,
																],
															},
														},
														1209600000,
													],
												},
												86400000,
											],
										},

										{
											$eq: [
												{ $dayOfWeek: "$start_date" },
												todayDay,
											],
										},
									],
								},
							},
						],
					},
				},
			])
			.toArray()
	);

	return new Promise((resolve) =>
		resolve([...oneDay, ...everyWeek, ...overWeek])
	);
};

module.exports = {
	drop,
	insertLessons,
	insertFiles,
	getFile,
	insertFavourite,
	getFavourites,
	getLessons,
	getStgroup,
	getGroups,
};
