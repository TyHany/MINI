// 登录验证中间件
module.exports = (req, res, next) => {
    console.log('=== 权限验证 ===')
    console.log('Session ID:', req.sessionID)
    console.log('Session 数据:', req.session)
    
    if (!req.session.adminId) {
        console.log('验证失败：未登录')
        return res.status(401).json({
            code: 401,
            message: '请先登录'
        });
    }
    console.log('验证通过')
    next();
}; 