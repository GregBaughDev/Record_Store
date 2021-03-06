const RecordStore = require('../models/recordstore');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({accessToken: mapBoxToken});
const {cloudinary} = require("../cloudinary");

module.exports.index = async (req, res, next) => {
    const recordstore = await RecordStore.find({});
    res.render('recordstores/index', {recordstore})
}

module.exports.postNew = async (req, res, next) => {
    const geoData = await geoCoder.forwardGeocode({
        query: req.body.recordstore.location,
        limit: 1,
    }).send()
    const recordStore = new RecordStore(req.body.recordstore)
    recordStore.geometry = geoData.body.features[0].geometry
    recordStore.author = req.user._id;
    if(req.session.passport.user === 'admin'){
        recordStore.images = req.files.map(image => ({url: image.path, filename: image.filename}))
    } else {
        recordStore.images = [{url: 'https://res.cloudinary.com/dbdcclhzw/image/upload/v1629696459/Recordstore/vpbj7jln1lokww6k84du.jpg', filename: 'Recordstore/vpbj7jln1lokww6k84du'}, {url: 'https://res.cloudinary.com/dbdcclhzw/image/upload/v1629594887/Recordstore/l9sjancxucn859hmed99.jpg', filename: 'Recordstore/l9sjancxucn859hmed99'}]
    }
    await recordStore.save()
    req.flash('success', 'New record store added!')
    res.redirect(`recordstores/${recordStore.id}`)
}

module.exports.renderNew = function(req, res) {
    res.render('recordstores/new');
}

module.exports.renderEdit = async (req, res, next) => {
    const recordstore = await RecordStore.findById(req.params.id)
    if(!recordstore){
        req.flash('error', 'That store can\'t be found')
        return res.redirect('/recordstores')
    }
    res.render('recordstores/edit', {recordstore})
}

module.exports.idStore = async (req, res, next) => {
    const recordstore = await RecordStore.findById(req.params.id).populate({path: 'reviews', 
        populate: {
            path: 'author'
        }
    }).populate('author')
    const currentUser = req.user;
    if(!recordstore){
        req.flash('error', 'That store can\'t be found')
        return res.redirect('/recordstores')
    }
    res.render('recordstores/show', {recordstore, currentUser})
}

module.exports.editStore = async (req, res, next) => {
    const {id} = req.params
    const record = await RecordStore.findByIdAndUpdate(id, {...req.body.recordstore})
    const images = req.files.map(image => ({url: image.path, filename: image.filename}))
    record.images.push(...images)
    await record.save()
    if (req.body.deleteImages){
        for(let file of req.body.deleteImages){
            cloudinary.uploader.destroy(file)
        }
        await record.updateOne({$pull: {images: { filename: {$in: req.body.deleteImages}}}})
    }
    req.flash('success', 'Record store updated!')
    res.redirect(`/recordstores/${record._id}`)
}

module.exports.deleteStore = async (req, res, next) => {
    const {id} = req.params;
    await RecordStore.findByIdAndDelete(id);
    req.flash('success', 'Record store deleted')
    res.redirect('/recordstores')
}