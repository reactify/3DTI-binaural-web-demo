

Utils = {}

Utils.padZeros3 = (number)->
	if number < 10
		return "00" + number
	if number < 100
		return "0" + number

Utils.dr = (degrees)->
	return degrees * (Math.PI / 180.0)

Utils.rd = (radians)->
	return radians * (180.0 / Math.PI)

Utils.cartPolar = (angle, radius)->
	rad = Utils.dr(angle)
	return {
		x : Math.floor(Math.cos(rad) * radius)
		y : Math.floor(Math.sin(rad) * radius)
	}

Utils.trigAngleDiff = (source, target)->
	return Math.atan2(Math.sin(Utils.dr(source) - Utils.dr(target)), Math.cos(Utils.dr(source), Utils.dr(target)))

Utils.getLineSquareIntersection = (cX, cY, dim, x1, y1, x2, y2)->

	# top line
	result = Utils.checkLineIntersection(x1,y1, x2,y2, cX-dim/2, cY-dim/2, cX+dim/2, cY-dim/2)
	if (result.onLine1 && result.onLine2)
		return {
			x : result.x
			y : result.y
		}
	

	# bottom line
	result = Utils.checkLineIntersection(x1,y1, x2,y2, cX-dim/2, cY+dim/2, cX+dim/2, cY+dim/2)
	if (result.onLine1 && result.onLine2)
		return {
			x : result.x,
			y : result.y
		}

	# left line
	result = Utils.checkLineIntersection(x1,y1, x2,y2, cX-dim/2, cY-dim/2, cX-dim/2, cY+dim/2)
	if (result.onLine1 && result.onLine2)
		return {
			x : result.x,
			y : result.y
		}

	# right line
	result = Utils.checkLineIntersection(x1,y1, x2,y2, cX+dim/2, cY-dim/2, cX+dim/2, cY+dim/2)
	if (result.onLine1 && result.onLine2)
		return {
			x : result.x,
			y : result.y
		}

	return {
		x: cX,
		y : cY
	}

Utils.getPerpendicularLineAtDistance = (x1, y1, x2, y2, d1, d2) ->

	grad = (y1 - y2) / (x1 - x2)
	pGrad = -1.0 / grad

	originPoint = {
		x: x1 + (x2 - x1) * d1
		y: y1 + (y2 - y1) * d1
	}

	return {
		x: originPoint.x + d2 * 1 / Math.sqrt(1 + pGrad ** 2)
		y: originPoint.y + d2 * pGrad / Math.sqrt(1 + pGrad ** 2)
	}

`
Utils.checkLineIntersection = function(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {

	// if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	var denominator, a, b, numerator1, numerator2, result = {
		x: null,
		y: null,
		onLine1: false,
		onLine2: false
	};
	denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
	if (denominator == 0) {
		return result;
	}
	a = line1StartY - line2StartY;
	b = line1StartX - line2StartX;
	numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
	numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
	a = numerator1 / denominator;
	b = numerator2 / denominator;

	// if we cast these lines infinitely in both directions, they intersect here:
	result.x = line1StartX + (a * (line1EndX - line1StartX));
	result.y = line1StartY + (a * (line1EndY - line1StartY));

	// if line1 is a segment and line2 is infinite, they intersect if:
	if (a > 0 && a < 1) {
		result.onLine1 = true;
	}
	// if line2 is a segment and line1 is infinite, they intersect if:
	if (b > 0 && b < 1) {
		result.onLine2 = true;
	}
	// if line1 and line2 are segments, they intersect if both of the above are true
	return result;
}
`

module.exports = Utils