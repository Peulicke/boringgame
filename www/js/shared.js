(function(exports){
    exports.Random = function(seed){
        this.seed = seed%2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    };
    exports.Random.prototype.next = function(){
        return this.seed = this.seed*16807%2147483647;
    };
    exports.Random.prototype.nextFloat = function(){
        return this.next()/2147483647;
    };
    exports.Game = function(level, fighters){
        this.level = level;
        this.fighters = fighters;
        this.players = null;
        this.player = null;
        this.maxDist = null;
        this.rng = null;
        [this.areas, this.levelAreas] = this.computeAreas(this.level);
        for(var i = 0; i < this.fighters.length; ++i){
            this.level[this.fighters[i].x][this.fighters[i].y] = this.fighters[i];
        }
    };
    exports.Game.prototype.computeAreas = function(level){
        var areas = [];
        var levelAreas = new Array(level.length);
        for(var i = 0; i < levelAreas.length; ++i){
            levelAreas[i] = new Array(level[i].length);
            for(var j = 0; j < levelAreas[i].length; ++j){
                levelAreas[i][j] = [null, null, null, null];
            }
        }
        function increaseOnly(x1, y1, x2, y2, sx, sy){
            for(var i = 0; i <= sx; ++i){
                for(var j = 0; j <= sy; ++j){
                    if(levelAreas[x2+i][y2+j][0] !== null && levelAreas[x2+i][y2+j][1] !== null && levelAreas[x2+i][y2+j][2] !== null && levelAreas[x2+i][y2+j][3] !== null) return false;
                    if(level[x1+i][y1+j] === true && level[x2+i][y2+j] !== true) return false;
                }
            }
            return true;
        }
        function holes(x1, y1, sx, sy){
            var inHole = false;
            var holeCount = 0;
            for(var i = x1; i <= x1+sx; ++i){
                for(var j = y1; j <= y1+sy; ++j){
                    var hole = (level[i][j] !== true);
                    if(inHole == hole) continue;
                    inHole = hole;
                    if(inHole) ++holeCount;
                }
            }
            return holeCount;
        }
        for(var i = 0; i < level.length; ++i){
            for(var j = 0; j < level[i].length; ++j){
                if(level[i][j] === true) continue;
                if(levelAreas[i][j][0] !== null && levelAreas[i][j][1] !== null && levelAreas[i][j][2] !== null && levelAreas[i][j][3] !== null) continue;
                var x1 = i;
                var x2 = i;
                var y1 = j;
                var y2 = j;
                for(var change = true; change;){
                    change = false;
                    if(x2+1 < level.length && increaseOnly(x2, y1, x2+1, y1, 0, y2-y1) && holes(x2, y1, 0, y2-y1) == 1 && holes(x2+1, y1, 0, y2-y1) <= 1){
                        ++x2;
                        change = true;
                    }
                    if(y2+1 < level[0].length && increaseOnly(x1, y2, x1, y2+1, x2-x1, 0) && holes(x1, y2, x2-x1, 0) == 1 && holes(x1, y2+1, x2-x1, 0) <= 1){
                        ++y2;
                        change = true;
                    }
                    if(x1-1 >= 0 && increaseOnly(x1, y1, x1-1, y1, 0, y2-y1) && holes(x1, y1, 0, y2-y1) == 1 && holes(x1-1, y1, 0, y2-y1) <= 1){
                        --x1;
                        change = true;
                    }
                    if(y1-1 >= 0 && increaseOnly(x1, y1, x1, y1-1, x2-x1, 0) && holes(x1, y1, x2-x1, 0) == 1 && holes(x1, y1-1, x2-x1, 0) <= 1){
                        --y1;
                        change = true;
                    }
                }
                var area = {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                };
                if(x1 == 0) --x1;
                if(x2 == level.length-1) ++x2;
                if(y1 == 0) --y1;
                if(y2 == level[0].length-1) ++y2;
                for(var x = x1; x < x2; ++x){
                    for(var y = y1; y < y2; ++y){
                        if(!levelAreas[x] || !levelAreas[x][y]) continue;
                        levelAreas[x][y][0] = areas.length;
                    }
                }
                for(var x = x1+1; x <= x2; ++x){
                    for(var y = y1; y < y2; ++y){
                        if(!levelAreas[x] || !levelAreas[x][y]) continue;
                        levelAreas[x][y][1] = areas.length;
                    }
                }
                for(var x = x1+1; x <= x2; ++x){
                    for(var y = y1+1; y <= y2; ++y){
                        if(!levelAreas[x] || !levelAreas[x][y]) continue;
                        levelAreas[x][y][2] = areas.length;
                    }
                }
                for(var x = x1; x < x2; ++x){
                    for(var y = y1+1; y <= y2; ++y){
                        if(!levelAreas[x] || !levelAreas[x][y]) continue;
                        levelAreas[x][y][3] = areas.length;
                    }
                }
                areas.push(area);
            }
        }
        for(var i = 0; i < levelAreas.length; ++i){
            for(var j = 0; j < levelAreas[i].length; ++j){
                for(var k = 3; k >= 0; --k){
                    var remove = (levelAreas[i][j] === null);
                    for(var l = 0; l < k; ++l){
                        if(levelAreas[i][j][k] == levelAreas[i][j][l]) remove = true;
                    }
                    if(remove) levelAreas[i][j].splice(k, 1);
                }
            }
        }
        return [areas, levelAreas];
    };
    exports.Game.prototype.dist = function(level, areas, levelAreas, areaTargets, pos){
        var dist = null;
        var possibilities = [];
        for(var i = 0; i < levelAreas[pos.x][pos.y].length; ++i){
            var targets = areaTargets[levelAreas[pos.x][pos.y][i]];
            if(!targets) continue;
            var dista = null;
            var poss = [];
            for(var j = 0; j < targets.length; ++j){
                var target = targets[j];
                var dx = target.x-pos.x;
                var dy = target.y-pos.y;
                var dis = target.d+Math.abs(dx)+Math.abs(dy);
                if(dista !== null && dis > dista) continue;
                if(dis < dista) poss = [];
                dista = dis;
                poss.push([dista, {
                    x: Math.sign(dx),
                    y: Math.sign(dy)
                }]);
            }
            if(poss.length == 0) continue;
            var d;
            var direction;
            [d, direction] = poss[Math.floor(this.rng.nextFloat()*poss.length)];
            if(dist !== null && (d > dist || (direction.x == 0 && direction.y == 0))) continue;
            if(d < dist) possibilities = [];
            dist = d;
            possibilities.push(direction);
        }
        return [dist, possibilities[Math.floor(this.rng.nextFloat()*possibilities.length)]];
    };
    exports.Game.prototype.search = function(level, areas, levelAreas, pos, maxDist){
        var areaTargets = [];
        for(var i = 0; i < areas.length; ++i){
            areaTargets.push([]);
        }
        var i = levelAreas[pos.x][pos.y][0] | levelAreas[pos.x][pos.y][1] | levelAreas[pos.x][pos.y][2] | levelAreas[pos.x][pos.y][3];
        var area = areas[i];
        var check = [{
            x: pos.x,
            y: pos.y,
            d: 0
        }];
        function nearestHole(x1, y1, sx, sy, pos){
            for(var i = pos.x; i <= x1+sx; ++i){
                for(var j = pos.y; j <= y1+sy; ++j){
                    if(level[i][j] !== true) return {
                        x: i,
                        y: j
                    };
                }
            }
            for(var i = pos.x; i >= x1; --i){
                for(var j = pos.y; j >= y1; --j){
                    if(level[i][j] !== true) return {
                        x: i,
                        y: j
                    };
                }
            }
            return null;
        }
        check.addElement = function(e){
            var i;
            for(i = 0; i < this.length; ++i){
                if(this[i].d >= e.d) break;
            }
            this.splice(i, 0, e);
        };
        var count = 0;
        while(check.length > 0){
            ++count;
            var p = check.shift();
            //if(p.d > maxDist) break;
            for(var i = 0; i < levelAreas[p.x][p.y].length; ++i){
                var targets = areaTargets[levelAreas[p.x][p.y][i]];
                if(!targets) continue;
                var pos = p;
                var dist;
                if(!targets) [dist, direction] = [null, null];
                else{
                    var dista = null;
                    var direc = {
                        x: 0,
                        y: 0
                    };
                    var poss = [];
                    for(var j = 0; j < targets.length; ++j){
                        var target = targets[j];
                        var dx = target.x-pos.x;
                        var dy = target.y-pos.y;
                        var dis = target.d+Math.abs(dx)+Math.abs(dy);
                        if(dista == null || dis <= dista){
                            if(dis < dista) poss = [];
                            dista = dis;
                            direc.x = 0;
                            direc.y = 0;
                            if(dx > 0) direc.x = 1;
                            if(dx < 0) direc.x = -1;
                            if(dy > 0) direc.y = 1;
                            if(dy < 0) direc.y = -1;
                            poss.push([dista, direc]);
                        }
                    }
                    if(poss.length == 0) [dist, direction] = [null, null];
                    else [dist, direction] = poss[Math.floor(this.rng.nextFloat()*poss.length)];
                }
                if(dist !== null && p.d >= dist) continue;
                targets.push(p);
    
                var area = areas[levelAreas[p.x][p.y][i]];
                var c;
                c = {
                    x: area.x2,
                    y: p.y
                };
                c = nearestHole(area.x2, area.y1, 0, area.y2-area.y1, c);
                if(c !== null){
                    c.d = p.d+Math.abs(c.x-p.x)+Math.abs(c.y-p.y);
                    check.addElement(c);
                }
                c = {
                    x: p.x,
                    y: area.y2
                };
                c = nearestHole(area.x1, area.y2, area.x2-area.x1, 0, c);
                if(c !== null){
                    c.d = p.d+Math.abs(c.x-p.x)+Math.abs(c.y-p.y);
                    check.addElement(c);
                }
                c = {
                    x: area.x1,
                    y: p.y
                };
                c = nearestHole(area.x1, area.y1, 0, area.y2-area.y1, c);
                if(c !== null){
                    c.d = p.d+Math.abs(c.x-p.x)+Math.abs(c.y-p.y);
                    check.addElement(c);
                }
                c = {
                    x: p.x,
                    y: area.y1
                };
                c = nearestHole(area.x1, area.y1, area.x2-area.x1, 0, c);
                if(c !== null){
                    c.d = p.d+Math.abs(c.x-p.x)+Math.abs(c.y-p.y);
                    check.addElement(c);
                }
            }
        }
        return areaTargets;
    };
    exports.Game.prototype.moveFighters = function(areaTargets){
        function move(fighter, dx, dy){
            var x = fighter.x+dx;
            var y = fighter.y+dy;
            if(x < 0) return false;
            if(y < 0) return false;
            if(x >= this.level.length) return false;
            if(y >= this.level[0].length) return false;
            if(this.level[x][y] !== false) return false;
            this.level[x][y] = fighter;
            this.level[fighter.x][fighter.y] = false;
            fighter.x = x;
            fighter.y = y;
            return true;
        }
        var maxDistPrev = this.maxDist;
        this.maxDist = 0;
        for(var i = 0; i < this.fighters.length; ++i){
            var dist, dir;
            if(!areaTargets[this.fighters[i].id]) console.log(this.fighters[i].id);
            [dist, dir] = this.dist(this.level, this.areas, this.levelAreas, areaTargets[this.fighters[i].id], this.fighters[i]);
            this.maxDist = Math.max(this.maxDist, dist);
            if(!dir){
                this.maxDist = maxDistPrev+1;
                continue;
            }
            var m = Math.abs(dir.x)+Math.abs(dir.y);
            if(m == 0) continue;
            if(m == 1){
                if(move.call(this, this.fighters[i], dir.x, dir.y)) continue;
                var rand = (this.rng.nextFloat() < 0.5);
                if(rand){
                    if(move.call(this, this.fighters[i], dir.x-dir.y, dir.x+dir.y)) continue;
                }
                else{
                    if(move.call(this, this.fighters[i], dir.x+dir.y, dir.y-dir.x)) continue;
                }
                rand = (this.rng.nextFloat() < 0.5);
                if(rand){
                    if(move.call(this, this.fighters[i], -dir.y, dir.x)) continue;
                }
                else{
                    if(move.call(this, this.fighters[i], dir.y, -dir.x)) continue;
                }
            }
            if(m == 2){
                if(move.call(this, this.fighters[i], dir.x, dir.y)) continue;
                var rand = (this.rng.nextFloat() < 0.5);
                if(rand){
                    if(move.call(this, this.fighters[i], dir.x, 0)) continue;
                }
                else{
                    if(move.call(this, this.fighters[i], 0, dir.y)) continue;
                }
                rand = (this.rng.nextFloat() < 0.5);
                if(rand){
                    if(move.call(this, this.fighters[i], -dir.y, dir.x)) continue;
                }
                else{
                    if(move.call(this, this.fighters[i], dir.y, -dir.x)) continue;
                }
            }
        }
    };
    exports.Game.prototype.removeFighters = function(id){
        for(var i = this.fighters.length-1; i >= 0; --i){
            if(this.fighters[i].id !== id) continue;
            this.level[this.fighters[i].x][this.fighters[i].y] = false;
            this.fighters.splice(i, 1);
        }
    };
    exports.Game.prototype.updateFighters = function(newFighters, oldFighters){
        for(var i = 0; i < newFighters.length; ++i){
            this.level[newFighters[i].x][newFighters[i].y] = newFighters[i].id;
            this.fighters.push(newFighters[i]);
        }
        for(var i = 0; i < oldFighters.length; ++i){
            this.removeFighters(oldFighters[i]);
        }
    };
    exports.Game.prototype.update = function(players, player, seed){
        this.players = players;
        this.player = player;
        this.rng = new exports.Random(seed);
        var areaTargets = {};
        for(var i = 0; i < Object.keys(this.players).length; ++i){
            var id = Object.keys(this.players)[i];
            var p = this.players[id];
            areaTargets[id] = this.search(this.level, this.areas, this.levelAreas, p.pos, this.maxDist+1);
        }
        this.moveFighters(areaTargets);
    };
}(typeof exports === 'undefined' ? this.shared = {} : exports));
