module.exports.checkAuth = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash('error', 'You must be logged in to view this page')
        return res.redirect('/users/login')
    }
    next()
}

