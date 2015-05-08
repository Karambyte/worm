var worm = {};

var Twitter = require('node-twitter');
var sentiment = require('sentiment'),
	colors = require('colors');
var socketio = require('socket.io');

//
// create socket io server
//
var io = socketio(8081);
var clients = {};

var nextClient = function() {
	for (var i = 0; i < 2000; i++) {
		if (i in clients)
			return i;
	};

	return i;
}

//
// entry expire
//
var entryExpire = 30 * 1000;

//
// execute callback for each client
//
var doAllClients = function(callback) {
	for (var k in clients)
		callback(clients[k]);
}

//
// handle connections
//
io.on('connection', function(sock) {
	// get next client
	var clientId = nextClient();

	if (clientId == -1) {
		console.log("[partyworm] out of socket clients".red);
		sock.disconnect();
		return;
	}

	// setup client
	clients[clientId] = sock;

	// add disconnect hook
	sock.on('disconnect', function() {
		delete clients[clientId];
	});
});

//
// Array.contains utility function
//
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

//
// cross-platform console clear
//
function clear() {
    var stdout = "";

    if (process.platform.indexOf("win") != 0) {
        stdout += "\033[2J";
    } else {
        var lines = process.stdout.getWindowSize()[1];

        for (var i=0; i<lines; i++) {
            stdout += "\r\n";
        }
    }

    // Reset cursur
    stdout += "\033[0f";

    process.stdout.write(stdout);
}

//
// hashtag configuration
//
var hashtags = {
	"#conservative" : {"con" : 1},
	"#conservatives" : {"con" : 1},
	"#sameoldlabour" : {"con" : 1, "lab" : -1},
	"#toriesOutNow" : {"lab" : 1, "con" : -1},
	"#labour" : {"lab" : 1},
	"#votelabour" : {"lab" : 1},
	"#libdems" : {"lib" : 1},
	"#liberaldems" : {"lib" : 1},
	"#liberaldemocrats" : {"lib" : 1},
	"#ukip" : {"ukip" : 1},
	"#dontvoteukip" : {"ukip" : -1},
	"#notukip" : {"ukip" : -1},
	"#gopurple" : {"ukip" : 1},
	"#whyimvotingukip" : {"ukip" : -1},
	"#voteukip" : {"ukip" : 1},
	"#greens" : {"green" : 1},
	"#greenparty" : {"green" : 1},
	"#votegreen" : {"green" : 1},
	"#votinggreen" : {"green" : 1},
	"#votegreen2015" : {"green" : 1},
	"#snp" : {"snp" : 1},
	"#snpout" : {"snp" : -1},
	"#votesnp" : {"snp" : 1},
	"#dup" : {"dup" : 1},
	"#plaid15" : {"plaid" : 1},
};

//
// cached hashtags
//
var _hashtags = [];

//
// cached parties
//
var _parties = [];

//
// twitter client
//
var twitterStreamClient = new Twitter.StreamClient(
	'key',
	'secret',
	'token',
	'token_secret'
);

//
// party scores
//
var partyScores = {};

//
// init
//
worm.init = function() {
	// hashtags
	for (var k in hashtags)
		_hashtags.push(k);

	// parties
	for (var k in hashtags) {
		for (var j in hashtags[k]) {
			if (!_parties.contains(j))
				_parties.push(j);
		}
	}

	console.log("PARTIES: " + _parties);

	// party scores
	for (var i = 0; i < _parties.length; i++) {
		partyScores[_parties[i]] = {
			totalScore : 0,
			averageScore: 0,
			entries : []
		};
	}

	// events
	twitterStreamClient.on('close', function() {
		console.log('Connection closed');
		// try to open again
		worm.start();
	});

	twitterStreamClient.on('end', function() {
		console.log('EOL');
	});

	twitterStreamClient.on('error', function(error) {
		console.log('Err: ' + error);
		// try again
		worm.start();
	});

	twitterStreamClient.on('tweet', function(tweet) {
		worm.analyse(tweet);
	})

	worm.start();

	// start sending
	setTimeout(worm.send, 2000);
}

//
// get hashtag score
//
worm.getHashtagScore = function(hashtag, multiplier) {
	// ignore missing hashtags
	if (!(hashtag.toLowerCase() in hashtags))
		return {};

	// positive multipliers
	var m = multiplier

	if (m == 0) {
		m = 1;
	}

	// multiply
	var scores = {};

	for(var k in hashtags[hashtag]) {
		scores[k] = hashtags[hashtag][k] * m;
	}

	return scores;
}

//
// get scores for a list of hashtags
//
worm.getScore = function(hashtags, multiplier) {
	var scores = {}

	for (var i = 0; i < hashtags.length; i++) {
		// get hashtag
		var hashtag = "#" + hashtags[i].text.toLowerCase();

		// get score
		var score = worm.getHashtagScore(hashtag, multiplier);

		// add
		for (var k in score) {
			// add scores
			if (!(k in scores)) {
				scores[k] = score[k];
			} else {
				scores[k] += score[k];
			}
		}
	};

	return scores;
}

worm.pushScore = function(scoreData) {
	for (var k in scoreData) {
		partyScores[k].totalScore += scoreData[k];
		partyScores[k].entries.push({num:scoreData[k], expire:Date.now() + entryExpire});
	}
}

//
// processes and prunes averages
// (confirmed 2015 web scale lingo)
//
worm.processAverages = function() {
	for (var k in partyScores) {
		var score = 0;
		var numScores = 0;

		// add
		for (var i = 0; i < partyScores[k].entries.length; i++) {
			var entry = partyScores[k].entries[i];

			// process
			if (entry.expire > Date.now()) {
				score += entry.num;
				numScores++;
			}
		};

		// calculate
		if (score == 0)
			partyScores[k].averageScore = 0;
		else
			partyScores[k].averageScore = score / numScores;
	}
}

worm.start = function() {
	twitterStreamClient.start(_hashtags);
}

worm.analyse = function(tweet) {
	var result = sentiment(tweet.text);

	// get score data
	var scoreData = worm.getScore(tweet.entities.hashtags, result.score);

	// push data
	worm.pushScore(scoreData);

	// process averages
	worm.processAverages();

	// display
	var str = "";
	var partyOrdered = [];

	for(var k in partyScores) {
		partyOrdered.push({
			totalScore : partyScores[k].averageScore,
			name : k
		});
	}

	partyOrdered.sort(function(a, b) {
		return b.totalScore - a.totalScore;
	});

	for (var i = 0; i < partyOrdered.length; i++) {
		var sstr = partyOrdered[i].name + ": " + partyOrdered[i].totalScore + " "

		if (partyOrdered[i].totalScore > 0)
			str += sstr.green;
		else if (partyOrdered[i].totalScore == 0)
			str += sstr.white;
		else
			str += sstr.red;
	}

	//clear();
	console.log(str);
}

worm.send = function(send) {
	// emit
	doAllClients(function(client) {
		// build
		var data = {graph:[],total:[]};

		for (var i = 0; i < _parties.length; i++) {
			// graph data
			var graphData = {};
			graphData[_parties[i]] = partyScores[_parties[i]].averageScore.toFixed(2);
			data.graph.push(graphData);

			// total data
			var totalData = {};
			totalData[_parties[i]] = partyScores[_parties[i]].totalScore.toFixed(2);
			data.total.push(totalData);
		}

		// send
		client.emit("update", data);
	})

	// resend
	setTimeout(worm.send, 2000);

	// log
	var n = 0;
	for (var k in clients)
		n++;

	console.log(('sent update to ' + n + ' clients').green)
}

// and start
worm.init();