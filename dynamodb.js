'use strict';

var AWS = require("aws-sdk");

AWS.config.update({
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        StreamArn: "arn:aws:dynamodb:us-east-1:328779899436:table/rm_predictions"
});

var dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.query = function(userId, func) {
        var array = [];

        var params = {
                TableName : "rm_predictions",
                KeyConditionExpression: "#ui = :id",
                ExpressionAttributeNames:{
                        "#ui": "userId"
                },
                ExpressionAttributeValues: {
                        ":id": userId
                }
        };

        dynamo.query(params, function(err, data) {
                if (err) {
                        func(err, null);
                } else {
                        data.Items.forEach(function (item) {
                                array = item.Movies.values
                                //console.log(array);
                                func(null, array);
                        });
                }
        }, array);
};
