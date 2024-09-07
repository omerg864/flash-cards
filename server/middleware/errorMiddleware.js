const errorHandler = (err, req, res, next) => {
	const statusCode = res.statusCode ? res.statusCode : 500;
	if (process.env.NODE_ENV !== 'production') {
		console.log(err.stack);
	}
	res.status(statusCode).json({
		message: err.message,
		stack: process.env.NODE_ENV === 'production' ? '(:' : err.stack,
	});
};

export { errorHandler };
