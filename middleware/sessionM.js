var middlewares = {
    estaLogueado : function(req, res, next){
        if(req.session && req.session.email && req.session.password){
            return next();   
        }
        res.redirect('/');
    }
};

module.exports = middlewares;