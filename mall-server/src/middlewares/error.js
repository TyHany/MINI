module.exports = (err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
}; 