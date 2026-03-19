module.exports = (error,req,res,next) => {
    error.statuscode = error.statuscode || 500;
    error.status =  error.status || 'error';
    res.status(error.statuscode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        status: error.status|| 'Error',
        statuscode: error.statuscode || 500
    });
}