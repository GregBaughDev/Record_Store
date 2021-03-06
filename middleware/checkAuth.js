const RecordStore = require('../models/recordstore');
const Review = require('../models/review');

module.exports.checkAuth = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.URLaccess = req.originalUrl
        req.flash('error', 'You must be logged in to view this page')
        return res.redirect('/users/login')
    }
    next()
}

module.exports.canEdit = async (req, res, next) => {
    const {id} = req.params
    const recordstore = await RecordStore.findById(id)
    if(req.user._id && !recordstore.author.equals(req.user._id)){
        req.flash('error', 'You don\'t have permission to do that')
        return res.redirect(`/recordstores/${id}`)
    }
    next()
}

module.exports.canEditReview = async (req, res, next) => {
    const {id, reviewId} = req.params
    const review = await Review.findById(reviewId)
    if(req.user._id && !review.author.equals(req.user._id)){
        req.flash('error', 'You don\'t have permission to delete this review')
        return res.redirect(`/recordstores/${id}`)
    }
    next()
}