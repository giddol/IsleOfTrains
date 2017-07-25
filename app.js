var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
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

var tCardArray = new Array();
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

//게임 전역 스키마 생성
var roomData = new mongoose.Schema({//default: "IsleOfTrains-"+Date.prototype.getDate
    name: { type: String, default: Date.now },
    admin: { type: String },
    member: { type: [String] },
    player : [{
    	nick : {type: String},
    	Hand : {type: Array},
    	Engine : {type: Number},
    	Car : {type: Array},
    	Cargo : {type: Array},
    	Carboose : {type: Array},
    	Building : {type: Number}
    }],
    drawCardPile : { type: Array },
    discardCardPile : { type : Array },
    gameState: { type: Number, default: 0 },
    currentTurn : { type : Number, default: 0 },
    action : {type: Number, default : 2},
    created_at: { type: Date, default: Date.now }
});
var Room = mongoose.model('roomData', roomData);

//랭킹 전역 스키마 생성
var SchemaTypes = mongoose.Schema.Types;
var rankingData = mongoose.Schema({
    user_nick: { type: String, unique: true },
    win: {type: Number},
    lose: {type: Number},
    winRate: { type: SchemaTypes.Double }
});
var Ranking = mongoose.model('rankingData', rankingData);

app.get('/main', function(req, res) {
    if (req.user) {
        User.find({ _id: req.user._id }, { _id: 0, last_logout: 0, user_id: 0, user_pw: 0, __v: 0 }, function(err, userValue) {
            Room.find({ gameState: {$lt : 2} }, function(err, roomValue) {
                res.render('main', { user: userValue[0], room: roomValue});
            });
        });
    } else {
        res.redirect('/login');
    }
});

//방만들기
app.post('/roomCreat', function(req, res) {
    if (req.user) {
        var room = new Room({
		  	admin: req.user.user_nick,
		  	member: [req.user.user_nick],
        });
    	//var CardArray = tCardArray;

        room.save(function(err) {
            if (err) {
                res.send('<script>alert("에러남");location.href="/join";</script>');
                return console.error(err);
            } else res.send('<script>location.href="/";</script>');
        });
    } else {
        res.render('login');
    }
});
//시작 
app.post('/startRoom', function(req, res) {
    if (req.user) {
        var roomId = req.query.roomId;

        Room.findOne({ _id: roomId }, function(err, roomValue) {
        	//턴 순서 정하고 플레이어 초기값 입력 저장
        	var tMember = roomValue.member.slice();
        	DoShuffle(tMember, tMember.length);

            for (var max = tMember.length, i = 0; i < max; i++) {
            	roomValue.player[i] = {
            		nick : roomValue.member[i], 
            		Hand : [], 
            		Engine : -1, 
            		Car : [], 
            		Cargo : [], 
            		Carboose : [], 
            		Building : -1
            	};
            }
            
            Setup(roomValue.player, roomValue.drawCardPile);
            roomValue.gameState = 1;
            roomValue.save(function(err) {
            	console.log(err);
            	res.redirect('/room?roomId=' + roomId);
            });
        });
    } else {
        res.render('login');
    }
});

app.get('/room', function(req, res) {
    if (req.user) {
        var roomId = req.query.roomId;
        if (roomId != null) {
            Room.findOne({ _id: roomId }, function(err, roomValue) {
                res.render('room', { room: roomValue, user: req.user, tCardArray: tCardArray });
                //console.log(roomValue[0].board);
                //console.log(roomValue[0]);
            });
        } else {
            res.send('<script>alert("잘못된 요청");location.href="/main";</script>');
        }
    } else {
        res.render('login');
    }
});

app.post('/action_Take', function(req, res) {
	if(req.user) {
		var roomId = req.query.roomId;
		Room.findOne({ _id: roomId }, function(err, roomValue) {
			//플레이어 찾기
			var tIndex;
			for (var max = roomValue.player.length, i = 0; i < max; i++) {
				if (roomValue.player[i].nick === req.user.user_nick) {
					tIndex = i;
					break;
				}
			}

			//drawCardPile 1보다 작으면 discardCardPile셔플하고 drawCardPile로 옮긴다
			if (roomValue.drawCardPile.length < 1) {
				DoShuffle(roomValue.drawCardPile, roomValue.discardCardPile.length);
				roomValue.drawCardPile = roomValue.drawCardPile.concat(roomValue.discardCardPile.slice(0));
				consoele.log('test');
			}

			//카드 한 장 받기
			roomValue.player[tIndex].Hand.push(roomValue.drawCardPile.shift());

			roomValue.action--;
			
			roomValue.save(function(err) {
            	res.redirect('/room?roomId=' + roomId);
            });
            
		});
	} else {
        res.render('login');
    }

});
//Doshuffle(셔플할 배열, 배열의 길이)
function DoShuffle(xArray, xLength)
{
	//var tArray = xArray.slice();
	for (var i = 0, j, temp; i < xLength; i++) {
		j = Math.floor(Math.random() * (xLength - i));
		temp = xArray[i];
		xArray[i] = xArray[i+j];
		xArray[i+j] = temp;
	}
	return xArray;
}


//
function Setup(tpPlayer, tpDrawPile)
{
	//6장의 배달 계약카드 구현 필요


	//1) 각 플레이어들은 1단계 엔진 카드를 1장씩 나눠받아서 자기 앞에 앞면으로 펼쳐 놓는다.
	for (var i =0; i< tCardArray.length;i++)
    {
    	tpDrawPile.push(tCardArray[i]._Key);
    }
	for(var i=0; i< tpPlayer.length;i++) {
		tpPlayer[i].Engine = tpDrawPile.shift();
	}

	//2) 남은 카드를 모두 섞는다.
	DoShuffle(tpDrawPile, tpDrawPile.length);

	//3) 각자 5장씩 받는다.
	for(var i=0; i< tpPlayer.length;i++) {
		for(var j=0; j<5;j++) {
			tpPlayer[i].Hand.push(tpDrawPile.shift());
		}
	}

}
