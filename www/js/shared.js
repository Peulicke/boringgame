(function(exports){
    exports.Random = function(seed){
        this.seed = seed%2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
    };
    exports.Random.prototype.next = function(){
        return this.seed = this.seed*16807%2147483647;
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
