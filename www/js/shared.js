(function(exports){
    exports.Random = function(seed){
        this.seed = seed%2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    };
    exports.Random.prototype.next = function(){
        return this.seed = this.seed*16807%2147483647;
    };
    exports.computeAreas = function(level){
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
        var list = [];
        
        for(var i = 0; i < level.length; ++i){
            for(var j = 0; j < level[i].length; ++j){
                list.push([i, j]);
            }
        }
        function shuffle(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }
        shuffle(list);
        for(var k = 0; k < list.length; ++k){
            var i = list[k][0];
            var j = list[k][1];
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
    exports.distAreaTargets = function(targets, pos){
        if(!targets) return null;
        var result = null;
        for(var i = 0; i < targets.length; ++i){
            var target = targets[i];
            var res = target.d+Math.abs(target.x-pos.x)+Math.abs(target.y-pos.y);
            if(result == null || res < result) result = res;
        }
        return result;
    };
    exports.dist = function(level, areas, levelAreas, areaTargets, pos){
        var result = null;
        for(var i = 0; i < levelAreas[pos.x][pos.y].length; ++i){
            var targets = areaTargets[levelAreas[pos.x][pos.y][i]];
            var res = exports.distAreaTargets(targets, pos);
            if(result == null || res < result) result = res;
        }
        return result;
    };
    exports.search = function(level, areas, levelAreas, pos){
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
        }
        var count = 0;
        while(check.length > 0){
            ++count;
            var p = check.shift();
            for(var i = 0; i < levelAreas[p.x][p.y].length; ++i){
                var targets = areaTargets[levelAreas[p.x][p.y][i]];
                if(!targets) continue;
                var dist = exports.distAreaTargets(targets, p);
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
    exports.distance = function(level, pos){
        result = new Array(level.length);
        for(var i = 0; i < result.length; ++i){
            result[i] = new Array(level[i].length);
            for(var j = 0; j < result[i].length; ++j){
                result[i][j] = level.length*10;
            }
        }
        var check = [pos];
        pos.d = 0;
        var bla = 0;
        while(check.length > 0){
            ++bla;
            var p = check[0];
            check.shift();
            if(p.x < 0 || p.x >= level.length || p.y < 0 || p.y >= level[0].length) continue;
            if(level[p.x][p.y] == 1) continue;
            if(result[p.x][p.y] != level.length*10) continue;
            result[p.x][p.y] = p.d;
            check.push({
                x: p.x-1,
                y: p.y,
                d: p.d+1
            });
            check.push({
                x: p.x+1,
                y: p.y,
                d: p.d+1
            });
            check.push({
                x: p.x,
                y: p.y-1,
                d: p.d+1
            });
            check.push({
                x: p.x,
                y: p.y+1,
                d: p.d+1
            });
        }
        return result;
    };
}(typeof exports === 'undefined' ? this.shared = {} : exports));
