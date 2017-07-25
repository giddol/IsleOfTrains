var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var NaverStrategy = require('passport-naver').Strategy;
var flash = require('connect-flash');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Rndld = null;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'IsleOfTIsleOfTrainsrains',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.engine('html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

require('mongoose-double')(mongoose);


//페이지 연결
app.get('/', function(req, res) {
    res.redirect('/main');
});
//로그아웃
app.get('/logout', function(req, res) {
    //마지막 로그아웃 시간 기록
    var dateUTC = new Date();
    var dateKTC = dateUTC.setHours(dateUTC.getHours() + 9);
    User.update({ _id: req.user._id }, { $set: { last_logout: dateKTC } }, function(err) {
        if (err) throw err;
    });
    req.logout();
    req.session.save(function() {
        res.redirect('/login');
    });
});
//DB 커넥트
mongoose.connect("mongodb://yong.netb.co.kr:443/IsleOfTrains");
var db = mongoose.connection;
db.once("open", function() {
    console.log("DB connected!");
});
db.on("error", function(err) {
    console.log("DB ERROR :", err);
});
//서버 시작
server.listen(3000);


//socket.io


io.on('connection', function(socket) {
    //console.log('user connected: ', socket.id);
    if (Rndld !== null) {
        User.findOne({ user_nick: Rndld }, function(err, user) {
            console.log(Rndld);
            Rndld = null;
            io.to(user.socketID).emit('alert', "message");
        });
    }

    socket.on('send id', function(userNick) {
        User.findOneAndUpdate({ user_nick: userNick }, { $set: { 'socketID': socket.id } }, function(err) {});
    });
    /*
  socket.on('end turn', function(thisTurnUser){
	  //console.log(thisTurnUser);
	  console.log("이게 소켓 메시지");
	  User.findOne({user_nick : thisTurnUser}, function(err, user){
		  io.to(user.socketID).emit('alert', "message");
	  });
	  
  });
  */
    socket.on('hey', function(hey) {
        console.log(hey);
    });
    var name = "user";
    io.to(socket.id).emit('change name', name);
    socket.on('disconnect', function() {
        //console.log('user disconnected: ', socket.id);
    });
});

//유저전역 스키마 생성
var userData = mongoose.Schema({
    user_id: { type: String, unique: true },
    user_pw: { type: String },
    user_nick: { type: String, unique: true },
    lv: { type: Number },
    max_exp: { type: Number },
    exp: { type: Number },
    win: { type: Number },
    lose: { type: Number },
    gold: { type: Number },
    pearl: { type: Number },
    log: [String],
    log_buy: [String],
    read_log: [String],
    email: { type: String },
    sns: { type: String },
    created_at: { type: Date, default: Date.now },
    last_logout: { type: Date },
    socketID: { type: String }
});
//패스워드 비교 userData를 User에 담기 전에 이걸 써넣어야 로그인 사용가능
userData.methods.validPassword = function(password) {
    return this.user_pw == password;
};
var User = mongoose.model('userData', userData);
app.get('/join', function(req, res) {
    res.render('join');
});
//회원가입
app.post('/joinForm', function(req, res) {
    var user = new User({
        user_id: req.body.userId,
        user_pw: req.body.userPw,
        user_nick: req.body.userNick,
        lv: 1,
        max_exp: 10,
        exp: 0,
        win: 0,
        lose: 0,
        gold: 0,
        pearl: 0,
        log: [],
        log_buy: [],
        read_log: [],
        email: "",
        sns: "",
    });
    user.save(function(err) {
        if (err) {
            res.send('<script>alert("사용 중인 닉네임 또는 아이디 입니다.");location.href="/join";</script>');
            return console.error(err);
        } else {
            var rank = new Ranking({
                user_nick : req.body.userNick,
                win : 0,
                lose : 0,
                winRate : 0
            });
            rank.save(function(err){});

            res.send('<script>alert("가입 완료");location.href="/";</script>');
        }
    });
});
//로그인
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});
passport.use(new LocalStrategy({ passReqToCallback: true }, function(req, username, password, done) {
    User.findOne({ user_id: username }, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, req.flash('message', '아이디가 없습니다.'));
        }
        if (!user.validPassword(password)) {
            return done(null, false, req.flash('message', '비밀번호가 틀렸습니다.'));
        }
        return done(null, user);
    });
}));
//네이버 로그인
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
app.get('/account', ensureAuthenticated, function(req, res) {
    res.render('account', { user: req.user });
});
passport.use(new NaverStrategy({
    clientID: "_SX5sVw5qJDBFgMAsJ8p",
    clientSecret: "JUbcQKTuCB",
    callbackURL: "/login/naver"
}, function(accessToken, refreshToken, profile, done) {
    User.findOne({ email: profile._json.email }, function(err, user) {
        if (!user) {
            var user = new User({
                lv: 1,
                max_exp: 10,
                exp: 0,
                win: 0,
                lose: 0,
                gold: 0,
                pearl: 0,
                log: [],
                log_buy: [],
                read_log: [],
                email: profile.emails[0].value,
                sns: "naver"
            });

            user.save(function(err) {
                if (err) console.log(err);
                else {
                    var rank = new Ranking({
                        user_nick : req.body.userNick,
                        win : 0,
                        lose : 0,
                        winRate : 0
                    });
                    rank.save(function(err){});
                }
                return done(err, user);
            });
        } else {
            return done(err, user);
        }
    });

}));
app.get('/login/naver', passport.authenticate('naver'), function(req, res) {
    if (req.user.user_nick !== "") {
        res.render('main', { user: req.user });
    } else {
        res.render('join_nick', { user: req.user });
    }
});
app.get('/join_nick', function(req, res) {
    res.render('join_nick', { user: req.user });
});
app.post('/joinNickForm', function(req, res) {
    User.update({ _id: req.user._id }, { $set: { user_nick: req.body.userNick } }, function(err) {
        res.render('main', { user: req.user });
    });
});
app.get('/login/naver/callback', passport.authenticate('naver', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
app.post('/loginForm', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));
app.get('/login', function(req, res) {
    if (req.user) {
        res.render('main');
    } else {
        res.render('login');
    }
});



function GetCardIndexWithKey(tKey, tCardArray) {
	var i;
	var length = tCardArray.length;
	for (i=0;i<length;i++) {
		if (tCardArray[i]._Key === tKey) {
			return i;
		}
	}
}

function PrintBoard(tDrawPile,tDiscardPile,tPlayer)
{
	console.log("\nDrawPile Length :",tCardArray.length);
	console.log("DiscardPile Length :",tDiscardPile.Card.length);
	for (var i = 0; i<tPlayer.length;i++) {
		console.log("Player",i," Hand Length :",tPlayer[i].Hand.length);
		console.log("Player",i," Car Length :",tPlayer[i].Car.length);
		console.log("Player",i," Engine :",tPlayer[i].Engine.Title);
	}

}
function Setup()
{
	this.SetOne = function(tpPlayer, tpDrawPile){
		for(var i=0; i<tpPlayer.length;i++) {
			tpPlayer[i].Hand = tpPlayer[i].Hand.concat(tpDrawPile.GetThisCard('Level 1 Engine'));
			tpPlayer[i].Hand = tpPlayer[i].Hand.concat(tpDrawPile.GetTopCards(5));
			tpPlayer[i].SetTrain(0);
			console.log('test');
		}
		tpPlayer[0].isYourTurn = true;
	};

}

function GamePlay()
{
	/*
	GetCard;
	Build;
	Load;
	Deliver;
	EndingTheGame;
	Scoring;
	RunningOutOfCards;
	*/
}

function Card()
{
	this.Title;

	/*
	TrainType;
	Cost;
	EndGameTrainPoints;
	CargoCapacity;
	CargoNeededForLoading;
	WeightModifier;
	CargoType;
	BenefitFromLoading;
	*/
}

function Player()
{
	this.isYourTurn = false;
	this.tpDiscardPile;
	this.tpDrawPile;
	this.tpPlayer;
	this.Engine;
	this.Building = null;
	this.Car = new Array();
	//this.Cargo = new Array();
	this.Train;
	this.EnginePower = 0;
	this.Hand = new Array();
	this.SetTrain = function(tIndex){
		if(this.Hand[tIndex].TrainType === 'engine') {
			this.Engine = this.Hand.splice(tIndex,1)[0];
			this.EnginePower -= this.Engine.WeightModifier;
		}
		else if(this.Hand[tIndex].TrainType === 'hopper'|| this.Hand[tIndex].TrainType === 'boxcar'||this.Hand[tIndex].TrainType === 'tanker') {
			this.Car.push(this.Hand.splice(tIndex,1)[0]);
			this.EnginePower -= this.Engine.WeightModifier;
		}
	};
	this.Take = function(tpDrawPile){
		//this.Hand = tpPlayer[i].Hand.concat(tpDrawPile.GetTopCards(5));
		this.Hand.push(tpDrawPile.GetTopCards(1)[0]);
	};
	this.Build = function(tBuildCardKey, tDiscardCardsKeyArray, tType, tIsDiscardTrain, tDiscardTrainKey, tUpgradeCardKey){
		var tBuildCard = this.Hand[GetCardIndexWithKey(tBuildCardKey)];
		if(isDiscardTrain){
			console.log('not constructed');
			//this.DiscardTrain(this.Train[tDiscardTrainKey]);
		}

		
		if(tType === 'new')	{
			if(this.EnginePower >= tBuildCard.WeightModifier) {
				if(tDiscardCardsKeyArray.length === tBuildCard.Cost){	
					DiscardHandCard(tDiscardCardsKeyArray);
					SetTrain(GetCardIndexWithKey(tBuildCardKey,this.Hand));
				}
				else {
					console.log('error : not enough cost. Discard cards more.');
				}
			}
			else {
				console.log('error : not enough engine power.');
			}

		} else if(tType === 'upgrade') {
			var tUpgradeCard = this.Train[GetCardIndexWithKey(tUpgradeCardKey)];
			if(this.EnginePower >= tBuildCard.WeightModifier-tUpgradeCard.WeightModifier) {
				if(tDiscardCardsKeyArray.length === tBuildCard.Cost-tUpgradeCard.Cost){
					if(tUpgradeCard.TrainType === tBuildCard.TrainType) {
						DiscardHandCard(tDiscardCardsKeyArray);
						UpgradeTrain(tBuildCardKey,tUpgradeCardKey);
					}
					else {
						console.log('error : different TrainType.');
					}
				}
				else {
					console.log('error : not enough cost. Discard cards more.');
				}
			}
			else {
				console.log('error : not enough engine power.');
			}
		} else if(tType === 'discard') {
			//train car(engine, car, carboose)를 원하는 만큼 버린다.
			//car에 실려있던 화물은 모두 함께 버려진다.

		} else if(tType === 'building') {
			if(this.Building) //빌딩이 있으면
				{
					tpDiscardPile.push(this.Building);
				} 
			this.Building = tBuildCard;
		}
	};
	this.Load = function(tLoadCardKey, tCarCardKey, tPlayerIndex) {
		if (tHandCardKey.length == 2)
		{
			DiscardHandCard(GetCardIndexWithKey(tLoadCardKey[0], this.Hand));
		}
		else
		{
		var tCarIndex = GetCardIndexWithKey(tCarCardKey, tpPlayer[tPlayerIndex].Car);
		var tHandIndex = GetCardIndexWithKey(tLoadCardKey, this.Hand); 
		var isLoadSuccess = false;
		var tCar = this.Car[tCarIndex];
		if(tCar.CargoNeededForLoading === this.Hand[tHandIndex].CargoNeededForLoading || this.Hand[tHandIndex].CargoNeededForLoading === 'all'){
			for(var i =0; i<tCar.Cargo.length; i++)
			{
				if(tCar.Cargo[i] === null)
				{
					tCar.Cargo[i] = this.Hand.splice(tHandIndex, 1)[0];
					isLoadSuccess = true;
					break;
				}
			}
			if(isLoadSuccess)
			{
				if(!(tpPlayer === this))
				{
					console.log(BenefitFromLoading);
				}

			}
			else {
				console.log('error : Cargo compartment is Full.');
			}
		}
		else {
			console.log('error : different CargoType');
		}
		}

	}
	this.UpgradeTrain = function(tBuildCardKey,tUpgradeCardKey) {
		if (this.Hand[GetCardIndexWithKey(tBuildCardKey, this.Hand)].TrainType === 'hopper'||this.Hand[GetCardIndexWithKey(tBuildCardKey, this.Hand)].TrainType === 'tanker'||this.Hand[GetCardIndexWithKey(tBuildCardKey, this.Hand)].TrainType === 'boxcar') {
			this.tpDiscardPile.push(this.Car.splice(GetCardIndexWithKey(tUpgradeCardKey,this.Train),1)[0]);
			this.Car[GetCardIndexWithKey(tUpgradeCardKey,this.Train)] = this.Hand[GetCardIndexWithKey(tBuildCardKey,this.Hand)];
		}


	}
	this.SetPointer =function(tpDrawPile, tpDiscardPile, tpPlayer) {
		this.tpDrawPile = tpDrawPile;
		this.tpDiscardPile = tpDiscardPile;
		this.tpPlayer = tpPlayer;
	}
	//this.DiscardTrain = function(tKey){
	//	tpDiscardPile.push(this.Train.splice(GetCardIndexWithKey(tKey,this.Train),1)[0]);
	//};
	this.DiscardHandCard = function(tDiscardCardsKeyArray) {
		if(tDiscardCardsKeyArray.length === undefined)
		{
			this.tpDiscardPile.Card.push(this.Hand.splice(GetCardIndexWithKey(tDiscardCardsKeyArray,this.Hand),1)[0]);
		}
		else
		{
			for(var i=0; i<tDiscardCardsKeyArray.length;i++) {
				this.tpDiscardPile.Card.push(this.Hand.splice(GetCardIndexWithKey(tDiscardCardsKeyArray[i],this.Hand),1)[0]);
			}
		}
	}

}

function DrawPile()
{
	this.Card = new Array();
	this.mpDiscardPile;
	this.tpPlayer;
	this.SetPointer = function(tpPlayer, tpDiscardPile) {
		this.tpPlayer = tpPlayer;
		this.tpDiscardPile = tpDiscardPile;
	};
	this.GetTopCards = function(tNum) {
		var tArray = new Array();

		if(this.Card.length < tNum) {
			DoShuffle(this.tpDiscardPile.Card, this.tpDiscardPile.Card.Length);
			this.Card = this.Card.concat(this.tpDiscardPile.Card.slice(0));
		}

		for (var i=0;i<tNum;i++)
			tArray.push(this.Card.pop());
		return tArray;
	};
	this.GetThisCard = function(tTitle){
		for (var i=0;i<this.Card.length;i++)
		{
			if(this.Card[i].Title === tTitle)
				return this.Card.splice(i,1)[0];
		}
		console.log('error : cannot find ', tTitle);
		return -1;
	};

}
//Doshuffle(셔플할 배열, 배열의 길이)
function DoShuffle(xArray, xLength)
{
	for (var i = 0, j, temp; i < xLength; i++) {
		j = Math.floor(Math.random() * (xLength - i));
		temp = xArray[i];
		xArray[i] = xArray[i+j];
		xArray[i+j] = temp;
	}
	return xArray;
}

function DiscardPile()
{
	this.Card = new Array();
}

var tDiscardPile = new DiscardPile;
var tDrawPile = new DrawPile;
var tCardArray = new Array();


var i=0;
for (i=0; i<4;i++){
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Level 1 Engine',
		TrainType : 'engine',
		Cost : 1,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -4,
		CargoType : 'all',
		BenefitFromLoading : 0
	};
}
var end = i;
for(;i<4+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Level 2 Engine',
		TrainType : 'engine',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -6,
		CargoType : 'oil',
		BenefitFromLoading : 0
	};
}
end = i;
for(;i<3+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Level 3 Engine',
		TrainType : 'engine',
		Cost : 6,
		EndGameTrainPoints : 4,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -8,
		CargoType : 'box',
		BenefitFromLoading : 0
	};
}
end = i;
for(;i<4+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Hopper Car',
		TrainType : 'hopper',
		Cost : 1,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 1,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 3 cards into hand, then discard 1 from hand'
	};
}
end = i;
for(;i<3+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Hopper-2 Car',
		TrainType : 'hopper',
		Cost : 4,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 2 cards into hand, then take a Build action'
	};
}
end = i;
for(;i<2+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Megahopper',
		TrainType : 'hopper',
		Cost : 7,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 1,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 2, then perform a bonus action of any type'
	};
}
end = i;
for(;i<4+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Tanker car',
		TrainType : 'tanker',
		Cost : 2,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 1,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 3 cards'
	};
}
end = i;
for(;i<3+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Tanker 201 car',
		TrainType : 'tanker',
		Cost : 5,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 3 cards, then take a Deliver action'
	};
}
end = i;
for(;i<2+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Supertanker',
		TrainType : 'tanker',
		Cost : 8,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 1,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 3 cards, then take a Load action or a Deliver action'
	};
}
end = i;
for(;i<4+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Boxcar',
		TrainType : 'boxcar',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'box',
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 4 cards'
	};
}
end = i;
for(;i<3+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Bigger Boxcar',
		TrainType : 'boxcar',
		Cost : 6,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'box',
		WeightModifier : 3,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 4 cards, then take a Load action'
	};
}
end = i;
for(;i<2+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Supertanker',
		TrainType : 'boxcar',
		Cost : 9,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'box',
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 5 cards into hand, then discard 1 from hand; then take a Load action'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 1',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : '+1 Card after any Delivery action(whether for cards or for a contract)'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 2',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 3,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : '+1 Card when Loading coal(including when Loading onto own train)'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 3',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Owner can store 1 good of any type here with a Load action'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 4',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : 'Owner may have 2 buildings built while Caboose 4 is on his train'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 5',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : 'All train cars cost 1 less (Engines, Cars, &Cabooses)'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Caboose 6',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -2,
		CargoType : 'oil',
		BenefitFromLoading : 'Engine power is increased by +2'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Coal Factory',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Coal delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Oil Refinery',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Oil delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Customs House',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Box delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Grand Central',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 8,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '8 points at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Bank',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '+2 pts for each cargo of any good type still loaded on your train at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tDrawPile.Card[i] = {
		_Key : i,
		Title : 'Rail Yard',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts for each card in your train, excluding engines, at Game End'
	};
}
end = i;


//tDrawPile.Card = tDrawPile;

var i=0;
for (i=0; i<4;i++){
	tCardArray[i] = {
		_Key : i,
		Title : 'Level 1 Engine',
		TrainType : 'engine',
		Cost : 1,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -4,
		CargoType : 'all',
		BenefitFromLoading : 0
	};
}
var end = i;
for(;i<4+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Level 2 Engine',
		TrainType : 'engine',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -6,
		CargoType : 'oil',
		BenefitFromLoading : 0
	};
}
end = i;
for(;i<3+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Level 3 Engine',
		TrainType : 'engine',
		Cost : 6,
		EndGameTrainPoints : 4,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -8,
		CargoType : 'box',
		BenefitFromLoading : 0
	};
}
end = i;
for(;i<4+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Hopper Car',
		TrainType : 'hopper',
		Cost : 1,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 1,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 3 cards into hand, then discard 1 from hand'
	};
}
end = i;
for(;i<3+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Hopper-2 Car',
		TrainType : 'hopper',
		Cost : 4,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 2 cards into hand, then take a Build action'
	};
}
end = i;
for(;i<2+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Megahopper',
		TrainType : 'hopper',
		Cost : 7,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'coal',
		WeightModifier : 1,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 2, then perform a bonus action of any type'
	};
}
end = i;
for(;i<4+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Tanker car',
		TrainType : 'tanker',
		Cost : 2,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 1,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 3 cards'
	};
}
end = i;
for(;i<3+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Tanker 201 car',
		TrainType : 'tanker',
		Cost : 5,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 3 cards, then take a Deliver action'
	};
}
end = i;
for(;i<2+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Supertanker',
		TrainType : 'tanker',
		Cost : 8,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'oil',
		WeightModifier : 1,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 3 cards, then take a Load action or a Deliver action'
	};
}
end = i;
for(;i<4+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Boxcar',
		TrainType : 'boxcar',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 1,
		Cargo : [null],
		CargoNeededForLoading : 'box',
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : 'Draw 4 cards'
	};
}
end = i;
for(;i<3+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Bigger Boxcar',
		TrainType : 'boxcar',
		Cost : 6,
		EndGameTrainPoints : 5,
		CargoCapacity : 2,
		Cargo : [null,null],
		CargoNeededForLoading : 'box',
		WeightModifier : 3,
		CargoType : 'oil',
		BenefitFromLoading : 'Draw 4 cards, then take a Load action'
	};
}
end = i;
for(;i<2+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Supertanker',
		TrainType : 'boxcar',
		Cost : 9,
		EndGameTrainPoints : 8,
		CargoCapacity : 3,
		Cargo : [null,null,null],
		CargoNeededForLoading : 'box',
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : 'Draw 5 cards into hand, then discard 1 from hand; then take a Load action'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 1',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : '+1 Card after any Delivery action(whether for cards or for a contract)'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 2',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 3,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : '+1 Card when Loading coal(including when Loading onto own train)'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 3',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 2,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'oil',
		BenefitFromLoading : 'Owner can store 1 good of any type here with a Load action'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 4',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'box',
		BenefitFromLoading : 'Owner may have 2 buildings built while Caboose 4 is on his train'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 5',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 2,
		CargoType : 'coal',
		BenefitFromLoading : 'All train cars cost 1 less (Engines, Cars, &Cabooses)'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Caboose 6',
		TrainType : 'caboose',
		Cost : 3,
		EndGameTrainPoints : 1,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : -2,
		CargoType : 'oil',
		BenefitFromLoading : 'Engine power is increased by +2'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Coal Factory',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Coal delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Oil Refinery',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Oil delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Customs House',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts per Box delivered on completed contracts at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Grand Central',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 8,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '8 points at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Bank',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '+2 pts for each cargo of any good type still loaded on your train at Game End'
	};
}
end = i;
for(;i<1+end;i++) {
	tCardArray[i] = {
		_Key : i,
		Title : 'Rail Yard',
		TrainType : 'building',
		Cost : 6,
		EndGameTrainPoints : 0,
		CargoCapacity : 0,
		CargoNeededForLoading : 0,
		WeightModifier : 0,
		CargoType : 'all',
		BenefitFromLoading : '2 pts for each card in your train, excluding engines, at Game End'
	};
}
end = i;
DoShuffle(tDrawPile.Card, tDrawPile.Card.length);
var tPlayer = new Array();
tPlayer[0] = new Player;
tPlayer[1] = new Player;
var tSetup = new Setup;
//console.log(tCardArray[3]);
//console.log("\n",tPlayer.Engine);
console.log("\n",tCardArray.length);

tSetup.SetOne(tPlayer, tDrawPile);
tDrawPile.SetPointer(tPlayer, tDiscardPile);
for (var i=0;i<tPlayer.length;i++) {
	tPlayer[i].SetPointer(tDrawPile, tDiscardPile, tPlayer);
}
/*
console.log("\n",tCardArray.length);
//console.log(tCardArray[3]);
//console.log(tDrawPile.GetTopCards(5));
//console.log("\n",tPlayer);


for (var i =0; i<tPlayer.length;i++)
{
	console.log("\n Player",i," hand : ")
	for (var j = 0; j<tPlayer[i].Hand.length;j++)
		console.log(tPlayer[i].Hand[j].Title);
	console.log("\n Player",i," Engine : ")
	console.log(tPlayer[i].Engine.Title);

}
*/
tPlayer[0].Take(tDrawPile);
//console.log

console.log("\nDrawPile Length :",tCardArray.length);
console.log("DiscardPile Length :",tDiscardPile.Card.length);
for (var j = 0; j<tPlayer[0].Hand.length;j++)
{
	console.log(tPlayer[0].Hand[j].Title);
}
tPlayer[0].DiscardHandCard([tPlayer[0].Hand[2]._Key,tPlayer[0].Hand[4]._Key]);

console.log("\nDrawPile Length :",tCardArray.length);
console.log("DiscardPile Length :",tDiscardPile.Card.length);
console.log("Player0 Length :",tPlayer[0].Hand.length);
for (var j = 0; j<tPlayer[0].Hand.length;j++)
{
	console.log(tPlayer[0].Hand[j].Title);
}
//console.log("\n",tPlayer[0].Engine.Title);


app.get('/main', function(req, res) {
	res.render('main', { user: userValue[0], room: roomValue });
    /*
    if (req.user) {
        User.find({ _id: req.user._id }, { _id: 0, last_logout: 0, user_id: 0, user_pw: 0, __v: 0 }, function(err, userValue) {
            Room.find({ full: "no", delete: "no" }, function(err, roomValue) {
                res.render('main', { user: userValue[0], room: roomValue });
            });
        });
    } else {
        res.redirect('/login');
    }
    */
});