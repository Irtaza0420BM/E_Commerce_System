const jwt = require('jsonwebtoken')

// So this is my Identifier, My identifier will do three things, it will check if the user is logged-in(Authenticated), it will check if the user is Admin or Employee, and it will check if the Employee is verified

exports.identifier = (req, res, next) => {
    let token;
    if(req.body.Authorization)
    {
        token = req.body.Authorization;
    }
    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization;
    } 
     else {
        token = req.cookies['Authorization'];
    }

    if (!token) {
        return res.status(403).json({ success: false, message: 'Please log in first' });
    }

    try {
        const userToken = token.split(' ')[1];
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        if (jwtVerified) {
            req.user = jwtVerified;
            if (req.user.role === 'admin') {
                console.log(req.user)
                return next();
            }
            if (req.user.role === 'employee') {
                if (!req.user.verified) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not verified. Please contact the admin.',
                    });
                }
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Unauthorized role. Access denied.',
            });
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
