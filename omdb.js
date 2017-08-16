'use strict';

const async = require('async');
const request = require('request');

let link = 'https://www.omdbapi.com/?t=TITLE&apikey=93673820';

function links(titles) {
        let ret = [];

        for (let i = 0; i < titles.length; ++i) {
                //titles[i] = titles[i].split(' ').join('+');
                ret.push(link.replace('TITLE', titles[i]));
        }

        return ret;
}

function get(url, callback) {
        request({ url: url, json: true }, function (err, response, body) {
                callback(err, body);
        });
}

module.exports.query = function (titles, func) {
        let urls = links(titles);

        async.map(urls, get, function (err, response) {
                if (err) {
                        console.log(err);
                } else {
                        let ret = [];

                        for (let i in response) {
                                let t = { title: response[i].Title, poster: response[i].Poster };
                                ret.push(t);
                        }

                        func(ret);
                }
        });
};
