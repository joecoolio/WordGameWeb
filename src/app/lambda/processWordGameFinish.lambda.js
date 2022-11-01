var AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

async function processSingleLeaderboard(
    username,
    boardName,
    calcField1Name,
    calcField2Name,
    incrementField1Function,
    incrementField2Function,
    mostRecentGame,
    scoreCalcFunction,
    initialField1Value,
    initialField2Value,
    initialScore
) {
    console.log("Board start: " + boardName);

    // Get my leaderboard record for this game type
    var params = {
        TableName: 'wordgame_leaderboard',
        Key: {
            'username': {'S': username},
            'category': {'S': boardName}
        }
    };
    
    try {
        const data = await dynamodb.getItem(params).promise()
        
        if (data['Item']) {
            // User already has a record, update it
            console.log("User has a record");

            const item = data['Item'];
            var calcField1Value = undefined;
            var calcField2Value = undefined;
            
            if (calcField1Name != undefined) {
                var calcField1Value = Number(item[calcField1Name].N) * 1.0;  // Make everything a float
                console.log("Old field 1 value: " + calcField1Value);
            }
            if (calcField2Name != undefined) {
                var calcField2Value = Number(item[calcField2Name].N) * 1.0;  // Make everything a float;
                console.log("Old field 2 value: " + calcField2Value);
            }
            var previousScore = Number(item.score.N) * 1.0;  // Make everything a float;
            console.log("Old score: " + previousScore);

            // Increment the calculation fields
            if (incrementField1Function != undefined) {
                calcField1Value = incrementField1Function(calcField1Value);
                console.log("New field 1 value: " + calcField1Value);
            }
            if (incrementField2Function != undefined) {
                calcField2Value = incrementField2Function(calcField2Value);
                console.log("New field 2 value: " + calcField2Value);
            }

            // Calculate the new score
            const calculatedScore = scoreCalcFunction(calcField1Value, calcField2Value, previousScore);
            console.log("New score: " + calculatedScore);
            
            // Bail out if no score was calculated
            if (!calculatedScore) {
                console.log("Calculated score is null, bailing");
                return;
            }
            
            // Build update parameters
            var updateExpression = "SET #score = :score, #lastGame = :lastGame";
            var expressionAttributeNames = {
                '#score': 'score',
                '#lastGame': 'lastGame'
            };
            var expressionAttributeValues = {
                ':score': {'N': '' + calculatedScore },
                ':lastGame': {'N': '' + mostRecentGame }
            };
            
            if (calcField1Name != undefined && calcField1Value != undefined) {
                updateExpression += ", #field1 = :field1Value";
                expressionAttributeNames["#field1"] = calcField1Name;
                expressionAttributeValues[":field1Value"] = {'N': '' + calcField1Value };
            }
            
            if (calcField2Name != undefined && calcField2Value != undefined) {
                updateExpression += ", #field2 = :field2Value";
                expressionAttributeNames["#field2"] = calcField2Name;
                expressionAttributeValues[":field2Value"] = {'N': '' + calcField2Value };
            }
            
            // Do the update
            var paramsUpdate = {
                TableName: 'wordgame_leaderboard',
                ExpressionAttributeNames: expressionAttributeNames,
                Key: {
                    'username': {'S': username},
                    'category': {'S': boardName}
                },
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'NONE'
            };
            await dynamodb.updateItem(paramsUpdate).promise()

        } else {
            // User doesn't have a record, create a new one
            console.log("User does not have a record");

            var itemAttributes = {
                'username': {'S': username},
                'category': {'S': boardName},
                'score': {"N": '' + initialScore },
                'lastGame': {"N": '' + mostRecentGame }
            };
            if (calcField1Name) {
                itemAttributes[calcField1Name] = {'N': '' + initialField1Value};
            }
            if (calcField2Name) {
                itemAttributes[calcField2Name] = {'N': '' + initialField2Value};
            }

            var paramsInsert = {
                TableName: 'wordgame_leaderboard',
                Item: itemAttributes,
                ReturnValues: 'NONE'
            };
            await dynamodb.putItem(paramsInsert).promise()
        }

    console.log("Board end: " + boardName);

    } catch (err) {
        console.log("Error", err);
    }
}

exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        
        // This runs for: record.eventName === "MODIFY"

        console.log("GameId: ", record.dynamodb.Keys.gameId);
        console.log("Record: ", record);
        
        // Only process records that have a game result
        if (record.dynamodb.NewImage.gameResult) {
            console.log("Result: ", record.dynamodb.NewImage.gameResult.S);
            
            const username = record.dynamodb.NewImage.username.S;
            const letters = Number(record.dynamodb.NewImage.letters.N);
            const hops = Number(record.dynamodb.NewImage.hops.N);
            const numHints = Number(record.dynamodb.NewImage.numHints.N);
            const createTime = Number(record.dynamodb.ApproximateCreationDateTime);
            const result = record.dynamodb.NewImage.gameResult.S;
            const execMs = Number(record.dynamodb.NewImage.execMs.N);
            
            console.log("Username: ", username);
            console.log("Result: ", result);
            console.log("Number of letters: ", letters);
            console.log("Number of hops: ", hops);
            console.log("Number of hints: ", numHints);
            console.log("Create time: ", createTime);
            console.log("Exec time: ", execMs);
            
            console.log('DynamoDB Record: %j', record.dynamodb);
    
            // Guests can't be on the leaderboard
            if (username.startsWith("Guest")) {
                continue;
            }
    
            // If you got any hints, your game doesn't get on the leaderboards
            if (numHints == 0) {
    
                // You have to win to bother registering on these leaderboards
                if (result === 'win') {
                    
                    // Overall wins for the user
                    await processSingleLeaderboard(
                        username, // username
                        "numwins" + "_" + letters + "_" + hops, // board name
                        null, // field 1
                        null, // field 2
                        null, // field 1 increment
                        null, // field 2 increment
                        createTime, // this event create time
                        (unused, unused2, previousScore) => { return previousScore + 1; }, // score calc
                        null, // Initial field 1 value
                        null, // Initial field 2 value
                        1 // Initial score
                    );
                    
                    // Fastest win leaderboard
                    await processSingleLeaderboard(
                        username, // username
                        "fastestwin" + "_" + letters + "_" + hops, // board name
                        null, // field 1
                        null, // field 2
                        null, // field 1 increment
                        null, // field 2 increment
                        createTime, // this event create time
                        (unused, unused2, previousScore) => // score calc
                        {
                            if (execMs < previousScore) return execMs;
                            else return null;
                        },
                        null, // Initial field 1 value
                        null, // Initial field 2 value
                        execMs // Initial score
                    );
    
                }
    
                // Win Percent leaderboard
                await processSingleLeaderboard(
                    username, // username
                    "winpct" + "_" + letters + "_" + hops, // board name
                    "wins", // field 1
                    "totalGames", // field 2
                    (numwins) => { return numwins + (result === 'win' ? 1 : 0) }, // field 1 increment
                    (totGames) => { return totGames + 1 }, // field 2 increment
                    createTime, // this event create time
                    (wins, totGames, unused) => { return wins / totGames; }, // score calc
                    result === 'win' ? 1 : 0, // Initial field 1 value
                    1, // Initial field 2 value
                    result === 'win' ? 1 : 0 // Initial score
                );

            }            
                
        }

    }
    return `Successfully processed ${event.Records.length} records.`;
};
