const app = require("./app");

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	server.close(() => process.exit(1));
});

const server = app.listen(3500, () => {
	console.log(`App is running on port 3500.`);
});