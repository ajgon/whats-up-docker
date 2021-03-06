const joi = require('joi');
const Loki = require('lokijs');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const moment = require('moment');
const { byString, byValues } = require('sort-es');
const log = require('../log');
const { getStoreConfiguration } = require('../configuration');
const Image = require('../model/Image');

// Store Configuration Schema
const configurationSchema = joi.object().keys({
    path: joi.string().default('/store'),
    file: joi.string().default('wud.json'),
});

// Validate Configuration
const configurationToValidate = configurationSchema.validate(getStoreConfiguration() || {});
if (configurationToValidate.error) {
    throw configurationToValidate.error;
}
const configuration = configurationToValidate.value;

// Loki DB
const db = new Loki(`${configuration.path}/${configuration.file}`, { autosave: true });

let images;

/**
 * Load DB.
 * @param err
 * @param resolve
 * @param reject
 * @returns {Promise<void>}
 */
async function loadDb(err, resolve, reject) {
    if (err) {
        reject(err);
    } else {
        images = db.getCollection('images');
        if (images === null) {
            log.info('DB empty => Create DB Collections');
            images = db.addCollection('images');
        }
        resolve();
    }
}

/**
 * Init DB.
 * @returns {Promise<unknown>}
 */
async function init() {
    log.info(`Init DB (${configuration.path}/${configuration.file})`);
    if (!fs.existsSync(configuration.path)) {
        log.debug(`Create folder ${configuration.path}`);
        fs.mkdirSync(configuration.path);
    }
    return new Promise((resolve, reject) => {
        db.loadDatabase({}, (err) => loadDb(err, resolve, reject));
    });
}

/**
 * Find unique Image by registry + image.
 * @param registry
 * @param image
 * @returns {null|Image}
 */
function findImage({
    watcher,
    registryUrl,
    image,
    version,
    includeTags,
    excludeTags,
}) {
    const imageInDb = images.findOne({
        'data.watcher': watcher,
        'data.registryUrl': registryUrl,
        'data.image': image,
        'data.version': version,
        'data.includeTags': includeTags,
        'data.excludeTags': excludeTags,
    });
    if (imageInDb !== null) {
        return new Image(imageInDb.data);
    }
    return null;
}

/**
 * Insert new Image.
 * @param image
 */
function insertImage(image) {
    const imageToReturn = {
        ...image,
        id: uuid(),
        created: moment.utc().toISOString(),
        updated: moment.utc().toISOString(),
    };
    images.insert({
        data: imageToReturn,
    });
    return imageToReturn;
}

/**
 * Update existing image.
 * @param image
 */
function updateImage(image) {
    const imageToUpdate = findImage(image);
    const imageToReturn = {
        ...imageToUpdate,
        result: image.result,
        updated: moment.utc().toISOString(),
    };

    // Remove
    images.chain().find({
        'data.registryUrl': image.registryUrl,
        'data.image': image.image,
        'data.version': image.version,
        'data.includeTags': image.includeTags,
        'data.excludeTags': image.excludeTags,
    }).remove();

    images.insert({
        data: imageToReturn,
    });
    return imageToReturn;
}

/**
 * Get all (filtered) images.
 * @param query
 * @returns {*}
 */
function getImages(query = {}) {
    const filter = {};
    Object.keys(query).forEach((key) => {
        filter[`data.${key}`] = query[key];
    });
    if (!images) {
        return [];
    }
    const imageList = images.find(filter).map((item) => new Image(item.data));
    return imageList.sort(byValues([
        ['watcher', byString()],
        ['registry', byString()],
        ['image', byString()],
        ['version', byString()],
    ]));
}

/**
 * Get image by id.
 * @param id
 * @returns {null|Image}
 */
function getImage(id) {
    const image = images.findOne({
        'data.id': id,
    });

    if (image !== null) {
        return new Image(image.data);
    }
    return null;
}

/**
 * Delete image by id.
 * @param id
 */
function deleteImage(id) {
    images.chain().find({
        'data.id': id,
    }).remove();
}

/**
 * Get configuration.
 * @returns {*}
 */
function getConfiguration() {
    return configuration;
}

module.exports = {
    init,
    findImage,
    insertImage,
    updateImage,
    getImages,
    getImage,
    deleteImage,
    getConfiguration,
};
