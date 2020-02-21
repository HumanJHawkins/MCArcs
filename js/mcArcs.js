function doArc(){
    alert("Got here!");
    let radius = 6;

    let curX = 0;
    let curY = radius;

    let startPoint = [curX, curY];
    let endPoint = rotatePointInt(0,0,startPoint[0],startPoint[1],45);

    let resultArray = [startPoint];
    resultArray[endPoint[0]] = endPoint;

    alert(resultArray.toString());

    while(curX < endPoint[0]){
        let deltaYMinusZero = Math.abs(radius - getDistance(0,0, curX, curY));
        let deltaYMinusOne  = Math.abs(radius - getDistance(0,0, curX,curY - 1));

        // if one lower than Y is closer to the radius, make that the current Y
        if(deltaYMinusOne < deltaYMinusZero){
            curY--;
        }

        resultArray[curX] = [curX, curY];
        curX++;
    }

    alert(resultArray.toString());
}

// Based on https://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
function rotatePointInt(cx, cy, x, y, angle) {
    let radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [Math.round(nx), Math.round(ny)];
}

function getDistance(pointAx, pointAy, pointBx, pointBy) {
    return Math.sqrt(
        (pointBx - pointAx) ^ 2 + (pointBy - pointAy) ^2
    )
}