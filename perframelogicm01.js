// JavaScript source code


const FrameLogic = (function () {

    var keystates = new Array(256).fill().map(x => false);
    var spaceWasDown = { value: false };

    var framenum = 0;

    var onFrame = function () {
        //console.log('why lparen why')
        framenum++;
        if (keystates[37] && !keystates[39]) {
            tryMoveObject(StageData.objects[0], [-0.07, 0.0, 0.0]);
        }
        if (keystates[39] && !keystates[37]) {
            tryMoveObject(StageData.objects[0], [0.07, 0.0, 0.0]);
        }
        if (keystates[38] && !keystates[40]) {//upkey
            tryMoveObject(StageData.objects[0], [ 0.0, 0.0, -0.07]);
        }
        if (keystates[40] && !keystates[38]) {
            tryMoveObject(StageData.objects[0], [0.0, 0.0, 0.07]);
        }
        if (keystates[65] && !keystates[68]) {
            tryRotateObject(StageData.objects[0], 0.05);
        }
        if (keystates[68] && !keystates[65]) {
            tryRotateObject(StageData.objects[0], -0.05);
        }
        if (keystates[32]) {
            if (!spaceWasDown.value) {
                tryJump(StageData.objects[0]);
                spaceWasDown.value = true;
            }
        }

        applyVeleocity();
        applyGravityAndGround();
    }

    var tryMoveObject = function (object, vec) {
        const x = 12;
        const y = 13;
        const z = 14;


        var probx = object.matrix[x] + vec[0];
        var proby = object.matrix[y] + vec[1];
        var probz = object.matrix[z] + vec[2];
        //console.log(probx + ', ' + proby + ', ' + probz);


        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] != object && oo != 2) {
                var other = StageData.objects[oo];
                if (object.collider && object.collider.type == 'rotationlesscylinder' && other.collider && other.collider.type == 'rotationlesscylinder') {
                    var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
                    var movemag = Math.sqrt(movsquared);
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;
                    //var maxrad = (other.collider.radius + object.collider.radius);//Math.max(other.collider.radius, object.collider.radius);
                    var maxallowedrad = (other.collider.radius + object.collider.radius);
                    var maxradsquared = (other.collider.radius + object.collider.radius) * (other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    var vectorsMapToRelative = vec[0] != 0.0 ? [0, 2, 1] : [2, 0, 1];
                    var relativeVector = [movemag, 0.0, 0.0];//main, other, other; right handed system
                    if (maxallowedrad > centerdist && (Math.abs(oy - proby) < (other.collider.hheight + object.collider.hheight + 0.0001) )) {

                        //var incursionz;
                        //var incursionpoint = [ , 0.0, ];
                        ////var lineAngle = Math.atan((proby - object.matrix[y]) / (probx - object.matrix[x]));
                        ////if (probx - object.matrix[x] == 0) { lineAngle = Math.PI / 2.0; }
                        var lineAngle;
                        if (vec[0] > 0) {
                            lineAngle = Math.PI;
                        } else if (vec[0] < 0) {
                            lineAngle = 0.0;
                        } else if (vec[2] > 0) {
                            lineAngle = -Math.PI / 2.0;
                        } else if (vec[2] < 0) {
                            lineAngle = Math.PI / 2.0;
                        }
                        //var incursionpoint = [Math.abs(Math.abs(probx - ox) - Math.abs(object.collider.radius * (Math.cos(lineAngle)))), 0.0, Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle))))];
                        //var rotator = mat4.create();
                        //mat4.rotate(rotator,  // destination matrix
                        //    rotator,  // matrix to rotate
                        //    -lineAngle,   // amount to rotate in radians
                        //    [0, 1, 0]);
                        //var rotatedIncursionPoint = useYRotToGetRotatedVectors(rotator, incursionpoint);
                        //console.log(' Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle)))) ' + Math.abs(Math.abs(probz - oz) - Math.abs(object.collider.radius * (Math.sin(lineAngle)))));
                        //console.log('incursionpoint ' + incursionpoint);
                        //console.log('rotatedIncursionPoint ' + rotatedIncursionPoint);
                        var intersectionArcSin = Math.asin(-diffz / centerdist);//Math.asin(rotatedIncursionPoint[2] / other.collider.radius);
                        if (diffx < 0) { intersectionArcSin = Math.PI - intersectionArcSin; }
                        var tangentAngle = (Math.PI / 2.0) + intersectionArcSin;
                        var component = Math.cos(tangentAngle - lineAngle);
                        if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(Math.PI / 2.0 - lineAngle) < 0.0001 ) { component = -component; }

                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));
                        //console.log('bump ' + ratior + ' -- ' + diffor);

                        if (allowedmove < relativeVector[0]) {
                            //console.log('diffx : ' + diffx);
                            //console.log('tofrom: ' + (proby - object.matrix[y]) + ', ' + (probx - object.matrix[x]));
                            //console.log(component + '  ' + tangentAngle + '  ' + lineAngle + ' ' + (other.collider.radius - maxallowedrad + centerdist) + ' ++ ' + diffor + ' ++ ' + other.collider.radius);
                            //console.log('intersectionArcSin ' + Math.asin((other.collider.radius - maxallowedrad + centerdist) / other.collider.radius) + ' aka ' + intersectionArcSin);
                            //console.log('tangentAngle ' + ((Math.PI / 2.0) - intersectionArcSin) + ' aka ' + tangentAngle);
                            //console.log('lineAngle ' + Math.atan((proby - object.matrix[y]) / (probx - object.matrix[x])) + ' aka ' + lineAngle);
                            //console.log('component ' + Math.cos(tangentAngle - lineAngle) + ' aka ' + component);
                            relativeVector = [ (allowedmove - [0.00001]), -component * diffor, 0.0];
                            vec[vectorsMapToRelative[0]] = Math.sign(vec[vectorsMapToRelative[0]]) * relativeVector[0];
                            vec[vectorsMapToRelative[1]] = relativeVector[1];
                            vec[vectorsMapToRelative[2]] = relativeVector[2];
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            //console.log(vec);
                        }

                        /* //this might be needed later. PLEASE KEEAAP!!
                        if (ratior <= 1 || diffor >= Math.sqrt(movsquared)) {
                            console.log('AAAAAHHH');
                            vec[0] = 0;
                            vec[1] = 0;
                            vec[2] = 0;
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                        } else {

                            if (ratior > 100) {
                                vec[0] = 0;
                                vec[1] = 0;
                                vec[2] = 0;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            } else {

                                vec[0] = vec[0] / ratior;
                                vec[1] = vec[1] / ratior;
                                vec[2] = vec[2] / ratior;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            }
                        }*/ //as noted above, DO NOT ERASE!#!
                    }
                } if (object.collider && object.collider.type == 'rotationlesscylinder' && other.collider && other.collider.type == 'yrotbox') {//if this a cyl and that a rect

                    //not yet implemented fully, still making
                    var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
                    var movemag = Math.sqrt(movsquared);
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;

                    var lineAngle;
                    if (vec[0] > 0) { lineAngle = Math.PI; } else if (vec[0] < 0) { lineAngle = 0.0; }
                        else if (vec[2] > 0) { lineAngle = -Math.PI / 2.0; } else if (vec[2] < 0) { lineAngle = Math.PI / 2.0; }

                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                        0.0, 0.0, other.collider.hwidth,
                        -other.collider.hdepth, 0.0, other.collider.hwidth,
                        -other.collider.hdepth, 0.0, 0.0,
                        -other.collider.hdepth, 0.0, -other.collider.hwidth,
                        0.0, 0.0, -other.collider.hwidth,
                        other.collider.hdepth, 0.0, -other.collider.hwidth,
                        other.collider.hdepth, 0.0, 0.0,
                    ];
                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords);
                    var quadrantsRanges = [];
                    var positiveDiffAngle = (Math.atan2(diffz, diffx) + (Math.PI * 2.0)) % (Math.PI * 2.0);
                    var mindex = 0;
                    var minval = Math.PI * 2.0;
                    var inQuad = 0;
                    for (var cc = 0; cc < 4; cc++) {
                        var angleRadians = (Math.atan2(initialrotatedboxcoords[6 * cc + 2], initialrotatedboxcoords[6 * cc + 0]) + (Math.PI * 2.0)) % (Math.PI * 2.0);
                        quadrantsRanges.push(angleRadians);
                        if (angleRadians < minval) {
                            mindex = cc;
                            minval = angleRadians;
                        }
                    }
                    var foundInQuadGreaterThanMin = false;
                    inQuad = (mindex + 4 - 1) % 4;
                    for (var bc = 0; bc < 4; bc++) {
                        var dexy = (mindex + bc) % 4;
                        if (quadrantsRanges[dexy] < positiveDiffAngle && quadrantsRanges[(dexy + 1) % 4] > positiveDiffAngle) {
                            inQuad = dexy;
                            break;
                        }                    
                    }
                    var centerpoint = [initialrotatedboxcoords[6 * inQuad + 3 + 0], initialrotatedboxcoords[6 * inQuad + 3 + 1], initialrotatedboxcoords[6 * inQuad + 3 + 2]];
                    var distFromCenterpoint = Math.sqrt(centerpoint[0] * centerpoint[0] + centerpoint[2] * centerpoint[2]);
                    var angleFromCenterpoint = Math.abs(positiveDiffAngle - ((Math.atan2(centerpoint[2], centerpoint[0]) + (Math.PI * 2.0)) % (Math.PI * 2.0)));
                    var myradius = distFromCenterpoint * (1.0 / (Math.cos(angleFromCenterpoint)))
                    ////console.log('quaaaadd: ' + inQuad + ' from quads: ' + quadrantsRanges);
                    ////console.log('myradius: ' + myradius);
                    ////console.log('distFromCenterpoint: ' + distFromCenterpoint);
                    ////var quadrantsRanges = [Math.asin(other.matrix[2]) ]

                    var maxallowedrad = object.collider.radius + myradius;//(other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    var vectorsMapToRelative = vec[0] != 0.0 ? [0, 2, 1] : [2, 0, 1];
                    var relativeVector = [movemag, 0.0, 0.0];//main, other, other; right handed system
                    if (maxallowedrad > centerdist && (Math.abs(oy - proby) < (other.collider.hheight + object.collider.hheight + 0.0001))) {

                        //not finding a round intersection tangent its just the angle of the face
                        //var intersectionArcSin = Math.asin(-diffz / centerdist);
                        //if (diffx < 0) { intersectionArcSin = Math.PI - intersectionArcSin; }
                        var quadAngle = ((Math.atan2(initialrotatedboxcoords[6 * inQuad + 0 + 2] - centerpoint[2], initialrotatedboxcoords[6 * inQuad + 0 + 0] - centerpoint[0]) + (Math.PI * 2.0)) % (Math.PI * 2.0));
                        var tangentAngle = quadAngle;//(Math.PI / 2.0) + intersectionArcSin;
                        ////console.log('tangentAngle: ' + tangentAngle * 180.0 / Math.PI);
                        var component = Math.cos(tangentAngle - lineAngle);
                        ////console.log('component: ' + component);
                        //if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(Math.PI / 2.0 - lineAngle) < 0.0001) { component = -component; }
                        if (Math.abs(0 - lineAngle) < 0.0001 || Math.abs(-Math.PI / 2.0 - lineAngle) < 0.0001) { component = -component; }

                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));

                        if ((Math.abs(oy - object.matrix[y]) > (other.collider.hheight + object.collider.hheight - 0.0001))) {
                            if (oy < object.matrix[y]) {
                                vec[1] = -(object.matrix[y] - oy - (other.collider.hheight + object.collider.hheight + 0.0001));
                                proby = object.matrix[y] + (vec[1]);
                                object.isGrounded = true;
                                object.confirmGrounded = true;
                                object.velocity.y = 0.0;
                            } else {
                                vec[1] = other.matrix[y] - object.matrix[y] - (other.collider.hheight + object.collider.hheight + 0.0001);
                                proby = object.matrix[y] + (vec[1]);
                                //other.isGrounded = true;
                                object.velocity.y = 0.0;
                            }
                        } else if (allowedmove < relativeVector[0] && !isNaN(component)) {
                            relativeVector = [(allowedmove - [0.00001]), -component * diffor, 0.0];
                            vec[vectorsMapToRelative[0]] = Math.sign(vec[vectorsMapToRelative[0]]) * relativeVector[0];
                            vec[vectorsMapToRelative[1]] = relativeVector[1];
                            vec[vectorsMapToRelative[2]] = relativeVector[2];
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            //console.log(object.matrix[x] + ' -- ' + object.matrix[y] + ' -- ' + object.matrix[z]);
                            //console.log(vec);
                        }
                    }

                } else if (other.collider && other.collider.type == 'yrotbox' && object.collider) {
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                        -other.collider.hdepth, 0.0, other.collider.hwidth,
                        other.collider.hdepth, 0.0, -other.collider.hwidth,
                        -other.collider.hdepth, 0.0, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                        -object.collider.hdepth, 0.0, object.collider.hwidth,
                        object.collider.hdepth, 0.0, -object.collider.hwidth,
                        -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];
                    //var basisx = [boxcoords[0] - boxcoords[6], 0.0, boxcoords[2] - boxcoords[8]];
                    //var basisz = [boxcoords[0] - boxcoords[9], 0.0, boxcoords[2] - boxcoords[11]];
                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords);
                    var objectCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    //objectCoordsBeforeMove.push(object.matrix[x] - ox);
                    //objectCoordsBeforeMove.push(object.matrix[y] - oy);
                    //objectCoordsBeforeMove.push(object.matrix[z] - oz);
                    for (var irc = 0; irc < (initialrotatedboxcoords.length / 3); irc++) {
                        objectCoordsBeforeMove[irc * 3 + 0] = initialrotatedboxcoords[irc * 3 + 0] + object.matrix[x] - ox;
                        objectCoordsBeforeMove[irc * 3 + 1] = initialrotatedboxcoords[irc * 3 + 1] + object.matrix[y] - oy;
                        objectCoordsBeforeMove[irc * 3 + 2] = initialrotatedboxcoords[irc * 3 + 2] + object.matrix[z] - oz;

                        initialrotatedboxcoords[irc * 3 + 0] += probx;
                        initialrotatedboxcoords[irc * 3 + 1] += proby;
                        initialrotatedboxcoords[irc * 3 + 2] += probz;
                    }
                    for (var irc2 = 0; irc2 < (initialrotatedboxcoords.length / 3); irc2++) {
                        initialrotatedboxcoords[irc2 * 3 + 0] -= ox;
                        initialrotatedboxcoords[irc2 * 3 + 1] -= oy;
                        initialrotatedboxcoords[irc2 * 3 + 2] -= oz;
                    }
                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, initialrotatedboxcoords);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeMove);
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                        + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                console.log('clang clang ' + framenum);
                                var blocked = false;
                                console.log(rotatedPreMoveboxcoords[c * 3 + 0] + ', ' + rotatedPreMoveboxcoords[c * 3 + 1] + ', ' + rotatedPreMoveboxcoords[c * 3 + 2]);

                                if ((Math.abs(oy - object.matrix[y]) > (other.collider.hheight + object.collider.hheight - 0.0001))) {
                                    if (oy < object.matrix[y]) {
                                        vec[1] = -(object.matrix[y] - oy - (other.collider.hheight + object.collider.hheight + 0.0001));
                                        proby = object.matrix[y] + (vec[1]);
                                        object.isGrounded = true;
                                        object.confirmGrounded = true;
                                        object.velocity.y = 0.0;
                                    } else {
                                        vec[1] = other.matrix[y] - object.matrix[y] - (other.collider.hheight + object.collider.hheight + 0.0001);
                                        proby = object.matrix[y] + (vec[1]);
                                        //other.isGrounded = true;
                                        object.velocity.y = 0.0;
                                    }
                                } else {

                                    if (rotatedPreMoveboxcoords[c * 3 + 0] < (otherboxcoords[3] + .00001)) {
                                        var xincursion = rotatedboxcoords[c * 3 + 0] - otherboxcoords[3];
                                        //vec = [0, 0, 0];
                                        console.log('case 1 ' + c + ' ' + xincursion);
                                        for (var incur = 0; incur < (rotatedboxcoords.length / 3); incur++) {
                                            rotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 0] > (otherboxcoords[0] - .00001)) {
                                        var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                        var xincursion = otherboxcoords[0] - rotatedboxcoords[c * 3 + 0];
                                        var xincursion2 = otherboxcoords[0] - rotatedboxcoords[c * 3 + 2];
                                        console.log(rotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + rotatedboxcoords[c * 3 + 0] + ' eeyanda ' + rotatedboxcoords[c * 3 + 2] + ' mit ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                        console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                        for (var incur2 = 0; incur2 < (rotatedboxcoords.length / 3); incur2++) {
                                            rotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                            //rotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                        }
                                        console.log(rotatedboxcoords[c * 3 + 0] + ', ' + rotatedboxcoords[c * 3 + 1] + ', ' + rotatedboxcoords[c * 3 + 2]);
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 2] < (otherboxcoords[8] + .00001)) {
                                        var zincursion = rotatedboxcoords[c * 3 + 2] - otherboxcoords[8];
                                        //vec = [0, 0, 0];
                                        console.log('case 3');
                                        for (var incur3 = 0; incur3 < (rotatedboxcoords.length / 3); incur3++) {
                                            rotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (rotatedPreMoveboxcoords[c * 3 + 2] > (otherboxcoords[2] - .00001)) {
                                        var zincursion = otherboxcoords[2] - rotatedboxcoords[c * 3 + 2];
                                        //vec = [0, 0, 0];
                                        console.log('case 4');
                                        for (var incur4 = 0; incur4 < (rotatedboxcoords.length / 3); incur4++) {
                                            rotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                        }
                                        blocked = true;
                                    }
                                    if (!blocked) {
                                        vec = [0, 0, 0];
                                    }
                                }
                            } 
                        }
                    }


                    //do other way around
                    var otherinitialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords);
                    var otherCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    for (var irc = 0; irc < (otherinitialrotatedboxcoords.length / 3); irc++) {
                        otherCoordsBeforeMove[irc * 3 + 0] = otherinitialrotatedboxcoords[irc * 3 + 0] - object.matrix[x] + ox;
                        otherCoordsBeforeMove[irc * 3 + 1] = otherinitialrotatedboxcoords[irc * 3 + 1] - object.matrix[y] + oy;
                        otherCoordsBeforeMove[irc * 3 + 2] = otherinitialrotatedboxcoords[irc * 3 + 2] - object.matrix[z] + oz;

                        otherinitialrotatedboxcoords[irc * 3 + 0] += ox;
                        otherinitialrotatedboxcoords[irc * 3 + 1] += oy;
                        otherinitialrotatedboxcoords[irc * 3 + 2] += oz;
                    }
                    for (var irc2 = 0; irc2 < (otherinitialrotatedboxcoords.length / 3); irc2++) {
                        otherinitialrotatedboxcoords[irc2 * 3 + 0] -= probx;
                        otherinitialrotatedboxcoords[irc2 * 3 + 1] -= proby;
                        otherinitialrotatedboxcoords[irc2 * 3 + 2] -= probz;
                    }
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherinitialrotatedboxcoords);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherCoordsBeforeMove);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                console.log('kling kling'); //vec = [0, 0, 0];


                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                var blocked = false;
                                if ((Math.abs(oy - object.matrix[y]) > (other.collider.hheight + object.collider.hheight - 0.0001))) {
                                    if (oy < object.matrix[y]) {
                                        vec[1] = -(object.matrix[y] - oy - (other.collider.hheight + object.collider.hheight + 0.0001));
                                        proby = object.matrix[y] + (vec[1]);
                                        object.isGrounded = true;
                                        object.confirmGrounded = true;
                                        object.velocity.y = 0.0;
                                    } else {
                                        vec[1] = other.matrix[y] - object.matrix[y] - (other.collider.hheight + object.collider.hheight + 0.0001);
                                        proby = object.matrix[y] + (vec[1]);
                                        //other.isGrounded = true;
                                        object.velocity.y = 0.0;
                                    }
                                } else {
                                    if (orotatedPreMoveboxcoords[c * 3 + 0] < (objectboxcoords[3] + .00001)) {
                                        var xincursion = orotatedboxcoords[c * 3 + 0] - objectboxcoords[3];
                                        //vec = [0, 0, 0];
                                        console.log('case 1 ' + c + ' ' + xincursion);
                                        for (var incur = 0; incur < (orotatedboxcoords.length / 3); incur++) {
                                            orotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 0] > (objectboxcoords[0] - .00001)) {
                                        var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                        var xincursion = objectboxcoords[0] - orotatedboxcoords[c * 3 + 0];
                                        var xincursion2 = objectboxcoords[0] - orotatedboxcoords[c * 3 + 2];
                                        console.log(orotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + orotatedboxcoords[c * 3 + 0] + ' eeyanda ' + orotatedboxcoords[c * 3 + 2] + ' mit ' + orotatedPreMoveboxcoords[c * 3 + 2]);
                                        console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                        for (var incur2 = 0; incur2 < (orotatedboxcoords.length / 3); incur2++) {
                                            orotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                            //orotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                        }
                                        console.log(orotatedboxcoords[c * 3 + 0] + ', ' + orotatedboxcoords[c * 3 + 1] + ', ' + orotatedboxcoords[c * 3 + 2]);
                                        blocked = true;
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 2] < (objectboxcoords[8] + .00001)) {
                                        var zincursion = orotatedboxcoords[c * 3 + 2] - objectboxcoords[8];
                                        //vec = [0, 0, 0];
                                        console.log('case 3');
                                        for (var incur3 = 0; incur3 < (orotatedboxcoords.length / 3); incur3++) {
                                            orotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                        }
                                        blocked = true;
                                    }
                                    if (orotatedPreMoveboxcoords[c * 3 + 2] > (objectboxcoords[2] - .00001)) {
                                        var zincursion = objectboxcoords[2] - orotatedboxcoords[c * 3 + 2];
                                        //vec = [0, 0, 0];
                                        console.log('case 4');
                                        for (var incur4 = 0; incur4 < (orotatedboxcoords.length / 3); incur4++) {
                                            orotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                        }
                                        blocked = true;
                                    }
                                    if (!blocked) {
                                        vec = [0, 0, 0];
                                    }
                                }

                            }
                        }
                    }


                    var newveccoords = useYRotToGetRotatedVectors(other.matrix, rotatedboxcoords);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords[cl * 3 + 0] += ox;
                        newveccoords[cl * 3 + 1] += oy;
                        newveccoords[cl * 3 + 2] += oz;
                    }


                    var newveccoords2 = useYRotToGetRotatedVectors(object.matrix, orotatedboxcoords);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords2[cl * 3 + 0] -= ox;
                        newveccoords2[cl * 3 + 1] -= oy;
                        newveccoords2[cl * 3 + 2] -= oz;
                    }
                    //console.log(vec[0] + ' -> ' + (vec[0] - Math.sign(vec[0]) * Math.abs((initialrotatedboxcoords[0] + ox) - newveccoords[0])));
                    //console.log(vec[1] + ' -> ' + (vec[1] - Math.sign(vec[1]) * Math.abs((initialrotatedboxcoords[1] + oy) - newveccoords[1])));
                    //console.log(vec[2] + ' -> ' + (vec[2] - Math.sign(vec[2]) * Math.abs((initialrotatedboxcoords[2] + oz) - newveccoords[2])));
                    console.log(vec);
                    vec[0] = vec[0] - (1.0 || 1.0) * ((initialrotatedboxcoords[0] + ox) - newveccoords[0]);
                    vec[1] = vec[1] - (1.0 || 1.0) * ((initialrotatedboxcoords[1] + oy) - newveccoords[1]);
                    vec[2] = vec[2] - (1.0 || 1.0) * ((initialrotatedboxcoords[2] + oz) - newveccoords[2]);

                    vec[0] = vec[0] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]);
                    vec[1] = vec[1] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[1] - oy) - newveccoords2[1]);
                    vec[2] = vec[2] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[2] - oz) - newveccoords2[2]);
                    console.log(vec);
                }
            }
        }

        for(var b = 0; b < 3; b++) {
            if (Math.abs(vec[b]) < .00001) {
                vec[b] = 0.0;
            }
        }
        //mat4.translate(object.matrix,     // destination matrix
        //    object.matrix,     // matrix to translate
        //    [vec[0], vec[1], vec[2]]);
        object.matrix[x] += vec[0];
        object.matrix[y] += vec[1];
        object.matrix[z] += vec[2];
    }




    var tryMoveObjectItsCoord = function (object, vec) {
        const x = 12;
        const y = 13;
        const z = 14;

        vec = useYRotToGetRotatedVectors(object.matrix, vec);
        var probx = object.matrix[x] + vec[0];
        var proby = object.matrix[y] + vec[1];
        var probz = object.matrix[z] + vec[2];
        var movsquared = vec[0] * vec[0] + vec[2] * vec[2];
        //console.log(probx + ', ' + proby + ', ' + probz);


        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] != object && oo != 2) {
                var other = StageData.objects[oo];
                if (other.collider.type == 'rotationlesscylinder') {
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var diffx = probx - ox;
                    var diffz = probz - oz;
                    //var maxrad = (other.collider.radius + object.collider.radius);//Math.max(other.collider.radius, object.collider.radius);
                    var maxallowedrad = (other.collider.radius + object.collider.radius);
                    var maxradsquared = (other.collider.radius + object.collider.radius) * (other.collider.radius + object.collider.radius);
                    var obdistsquared = (diffx * diffx + diffz * diffz);
                    var centerdist = Math.sqrt(obdistsquared);
                    if (maxallowedrad > centerdist) {
                        //lazy way is not to find really min
                        var diffor = maxallowedrad - centerdist;//how much inside they are
                        var allowedmove = Math.sqrt(movsquared) - diffor;//how far allowed to move, newdist
                        // (thing to divide original vector by) ^ 2 = (a^2 + b^2) / (newdist ^ 2)
                        var ratior = Math.ceil(Math.sqrt(movsquared / (allowedmove * allowedmove)));
                        console.log('bump ' + ratior + ' -- ' + diffor);
                        if (ratior <= 1 || diffor >= Math.sqrt(movsquared)) {
                            console.log('AAAAAHHH');
                            vec[0] = 0;
                            vec[1] = 0;
                            vec[2] = 0;
                            probx = object.matrix[x] + (vec[0]);
                            proby = object.matrix[y] + (vec[1]);
                            probz = object.matrix[z] + (vec[2]);
                            movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                        } else {

                            if (ratior > 100) {
                                vec[0] = 0;
                                vec[1] = 0;
                                vec[2] = 0;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            } else {

                                vec[0] = vec[0] / ratior;
                                vec[1] = vec[1] / ratior;
                                vec[2] = vec[2] / ratior;
                                probx = object.matrix[x] + (vec[0]);
                                proby = object.matrix[y] + (vec[1]);
                                probz = object.matrix[z] + (vec[2]);
                                movsquared = (vec[0] * vec[0] + vec[2] * vec[2]);
                            }
                        }
                    }
                } else if (other.collider.type == 'yrotbox') {
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, other.collider.hwidth,
                    other.collider.hdepth, 0.0, -other.collider.hwidth,
                    -other.collider.hdepth, 0.0, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                    -object.collider.hdepth, 0.0, object.collider.hwidth,
                    object.collider.hdepth, 0.0, -object.collider.hwidth,
                    -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];

                    var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords);
                    var objectCoordsBeforeMove = new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (initialrotatedboxcoords.length / 3); irc++) {
                        objectCoordsBeforeMove[irc * 3 + 0] = initialrotatedboxcoords[irc * 3 + 0] + object.matrix[x] - ox;
                        objectCoordsBeforeMove[irc * 3 + 1] = initialrotatedboxcoords[irc * 3 + 1] + object.matrix[y] - oy;
                        objectCoordsBeforeMove[irc * 3 + 2] = initialrotatedboxcoords[irc * 3 + 2] + object.matrix[z] - oz;

                        initialrotatedboxcoords[irc * 3 + 0] += probx;
                        initialrotatedboxcoords[irc * 3 + 1] += proby;
                        initialrotatedboxcoords[irc * 3 + 2] += probz;
                    }
                    for (var irc2 = 0; irc2 < (initialrotatedboxcoords.length / 3); irc2++) {
                        initialrotatedboxcoords[irc2 * 3 + 0] -= ox;
                        initialrotatedboxcoords[irc2 * 3 + 1] -= oy;
                        initialrotatedboxcoords[irc2 * 3 + 2] -= oz;
                    }
                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, initialrotatedboxcoords);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeMove);
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                        + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                console.log('clang clang ' + framenum);
                                var blocked = false;
                                console.log(rotatedPreMoveboxcoords[c * 3 + 0] + ', ' + rotatedPreMoveboxcoords[c * 3 + 1] + ', ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                if (rotatedPreMoveboxcoords[c * 3 + 0] < (otherboxcoords[3] + .00001)) {
                                    var xincursion = rotatedboxcoords[c * 3 + 0] - otherboxcoords[3];
                                    //vec = [0, 0, 0];
                                    console.log('case 1 ' + c + ' ' + xincursion);
                                    for (var incur = 0; incur < (rotatedboxcoords.length / 3); incur++) {
                                        rotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 0] > (otherboxcoords[0] - .00001)) {
                                    var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                    var xincursion = otherboxcoords[0] - rotatedboxcoords[c * 3 + 0];
                                    var xincursion2 = otherboxcoords[0] - rotatedboxcoords[c * 3 + 2];
                                    console.log(rotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + rotatedboxcoords[c * 3 + 0] + ' eeyanda ' + rotatedboxcoords[c * 3 + 2] + ' mit ' + rotatedPreMoveboxcoords[c * 3 + 2]);
                                    console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                    for (var incur2 = 0; incur2 < (rotatedboxcoords.length / 3); incur2++) {
                                        rotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                        //rotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                    }
                                    console.log(rotatedboxcoords[c * 3 + 0] + ', ' + rotatedboxcoords[c * 3 + 1] + ', ' + rotatedboxcoords[c * 3 + 2]);
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 2] < (otherboxcoords[8] + .00001)) {
                                    var zincursion = rotatedboxcoords[c * 3 + 2] - otherboxcoords[8];
                                    //vec = [0, 0, 0];
                                    console.log('case 3');
                                    for (var incur3 = 0; incur3 < (rotatedboxcoords.length / 3); incur3++) {
                                        rotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (rotatedPreMoveboxcoords[c * 3 + 2] > (otherboxcoords[2] - .00001)) {
                                    var zincursion = otherboxcoords[2] - rotatedboxcoords[c * 3 + 2];
                                    //vec = [0, 0, 0];
                                    console.log('case 4');
                                    for (var incur4 = 0; incur4 < (rotatedboxcoords.length / 3); incur4++) {
                                        rotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                    }
                                    blocked = true;
                                }
                                if (!blocked) {
                                    vec = [0, 0, 0];
                                }
                            }
                        }
                    }


                    //do other way around
                    var otherinitialrotatedboxcoords = useYRotToGetRotatedVectors(other.matrix, otherboxcoords);
                    var otherCoordsBeforeMove = new Array(initialrotatedboxcoords.length);
                    for (var irc = 0; irc < (otherinitialrotatedboxcoords.length / 3); irc++) {
                        otherCoordsBeforeMove[irc * 3 + 0] = otherinitialrotatedboxcoords[irc * 3 + 0] - object.matrix[x] + ox;
                        otherCoordsBeforeMove[irc * 3 + 1] = otherinitialrotatedboxcoords[irc * 3 + 1] - object.matrix[y] + oy;
                        otherCoordsBeforeMove[irc * 3 + 2] = otherinitialrotatedboxcoords[irc * 3 + 2] - object.matrix[z] + oz;

                        otherinitialrotatedboxcoords[irc * 3 + 0] += ox;
                        otherinitialrotatedboxcoords[irc * 3 + 1] += oy;
                        otherinitialrotatedboxcoords[irc * 3 + 2] += oz;
                    }
                    for (var irc2 = 0; irc2 < (otherinitialrotatedboxcoords.length / 3); irc2++) {
                        otherinitialrotatedboxcoords[irc2 * 3 + 0] -= probx;
                        otherinitialrotatedboxcoords[irc2 * 3 + 1] -= proby;
                        otherinitialrotatedboxcoords[irc2 * 3 + 2] -= probz;
                    }
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherinitialrotatedboxcoords);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherCoordsBeforeMove);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                console.log('kling kling'); //vec = [0, 0, 0];


                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                var blocked = false;
                                if (orotatedPreMoveboxcoords[c * 3 + 0] < (objectboxcoords[3] + .00001)) {
                                    var xincursion = orotatedboxcoords[c * 3 + 0] - objectboxcoords[3];
                                    //vec = [0, 0, 0];
                                    console.log('case 1 ' + c + ' ' + xincursion);
                                    for (var incur = 0; incur < (orotatedboxcoords.length / 3); incur++) {
                                        orotatedboxcoords[incur * 3 + 0] -= xincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 0] > (objectboxcoords[0] - .00001)) {
                                    var usereverse = false;//rotatedboxcoords[c * 3 + 0] == rotatedPreMoveboxcoords[c * 3 + 0];
                                    var xincursion = objectboxcoords[0] - orotatedboxcoords[c * 3 + 0];
                                    var xincursion2 = objectboxcoords[0] - orotatedboxcoords[c * 3 + 2];
                                    console.log(orotatedPreMoveboxcoords[c * 3 + 0] + '  and  ' + orotatedboxcoords[c * 3 + 0] + ' eeyanda ' + orotatedboxcoords[c * 3 + 2] + ' mit ' + orotatedPreMoveboxcoords[c * 3 + 2]);
                                    console.log('case 2 --' + c + ' ' + xincursion); //vec = [0, 0, 0];
                                    for (var incur2 = 0; incur2 < (orotatedboxcoords.length / 3); incur2++) {
                                        orotatedboxcoords[incur2 * 3 + 0] += (xincursion + .01);
                                        //orotatedboxcoords[incur2 * 3 + 2] -= xincursion2;
                                    }
                                    console.log(orotatedboxcoords[c * 3 + 0] + ', ' + orotatedboxcoords[c * 3 + 1] + ', ' + orotatedboxcoords[c * 3 + 2]);
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 2] < (objectboxcoords[8] + .00001)) {
                                    var zincursion = orotatedboxcoords[c * 3 + 2] - objectboxcoords[8];
                                    //vec = [0, 0, 0];
                                    console.log('case 3');
                                    for (var incur3 = 0; incur3 < (orotatedboxcoords.length / 3); incur3++) {
                                        orotatedboxcoords[incur3 * 3 + 2] -= zincursion + .01;
                                    }
                                    blocked = true;
                                }
                                if (orotatedPreMoveboxcoords[c * 3 + 2] > (objectboxcoords[2] - .00001)) {
                                    var zincursion = objectboxcoords[2] - orotatedboxcoords[c * 3 + 2];
                                    //vec = [0, 0, 0];
                                    console.log('case 4');
                                    for (var incur4 = 0; incur4 < (orotatedboxcoords.length / 3); incur4++) {
                                        orotatedboxcoords[incur4 * 3 + 2] += zincursion + .01
                                    }
                                    blocked = true;
                                }
                                if (!blocked) {
                                    vec = [0, 0, 0];
                                }

                            }
                        }
                    }


                    var newveccoords = useYRotToGetRotatedVectors(other.matrix, rotatedboxcoords);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords[cl * 3 + 0] += ox;
                        newveccoords[cl * 3 + 1] += oy;
                        newveccoords[cl * 3 + 2] += oz;
                    }


                    var newveccoords2 = useYRotToGetRotatedVectors(object.matrix, orotatedboxcoords);
                    for (var cl = 0; cl < (newveccoords.length / 3); cl++) {
                        newveccoords2[cl * 3 + 0] -= ox;
                        newveccoords2[cl * 3 + 1] -= oy;
                        newveccoords2[cl * 3 + 2] -= oz;
                    }

                    console.log(vec);
                    vec[0] = vec[0] - (1.0 || 1.0) * ((initialrotatedboxcoords[0] + ox) - newveccoords[0]);
                    vec[1] = vec[1] - (1.0 || 1.0) * ((initialrotatedboxcoords[1] + oy) - newveccoords[1]);
                    vec[2] = vec[2] - (1.0 || 1.0) * ((initialrotatedboxcoords[2] + oz) - newveccoords[2]);

                    vec[0] = vec[0] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[0] - ox) - newveccoords2[0]);
                    vec[1] = vec[1] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[1] - oy) - newveccoords2[1]);
                    vec[2] = vec[2] + (1.0 || 1.0) * ((otherinitialrotatedboxcoords[2] - oz) - newveccoords2[2]);
                    console.log(vec);
                }
            }
        }

        for (var b = 0; b < 3; b++) {
            if (Math.abs(vec[b]) < .00001) {
                vec[b] = 0.0;
            }
        }
        //mat4.translate(object.matrix,     // destination matrix
        //    object.matrix,     // matrix to translate
        //    [vec[0], vec[1], vec[2]]);
        object.matrix[x] += vec[0];
        object.matrix[y] += vec[1];
        object.matrix[z] += vec[2];
    }



    var tryRotateObject = function (object, rot) {
        const x = 12;
        const y = 13;
        const z = 14;

        var probx = object.matrix[x];
        var proby = object.matrix[y];
        var probz = object.matrix[z];
        //console.log(probx + ', ' + proby + ', ' + probz);


        for (var oo = 0; oo < StageData.objects.length; oo++) {
            if (StageData.objects[oo] != object && oo != 2) {
                var other = StageData.objects[oo];
                if (other.collider && other.collider.type == 'rotationlesscylinder') {
                    
                } else if (other.collider && other.collider.type == 'yrotbox') {
                    //matrix of a y rotation
                    //credit https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
                    //remember this INCLUDES the weird gl column major system
                    //function rotateAroundYAxis(a) {
                    //    return [
                    //        cos(a), 0, sin(a), 0,
                    //        0, 1, 0, 0,
                    //        -sin(a), 0, cos(a), 0,
                    //        0, 0, 0, 1
                    //    ];
                    //}
                    var ox = other.matrix[x];
                    var oy = other.matrix[y];
                    var oz = other.matrix[z];
                    var otherboxcoords = [other.collider.hdepth, 0.0, other.collider.hwidth,
                    -other.collider.hdepth, 0.0, other.collider.hwidth,
                    other.collider.hdepth, 0.0, -other.collider.hwidth,
                    -other.collider.hdepth, 0.0, -other.collider.hwidth,
                    ];
                    var objectboxcoords = [object.collider.hdepth, 0.0, object.collider.hwidth,
                    -object.collider.hdepth, 0.0, object.collider.hwidth,
                    object.collider.hdepth, 0.0, -object.collider.hwidth,
                    -object.collider.hdepth, 0.0, -object.collider.hwidth,
                    ];

                    var rotatedMatrix = mat4.create();
                    mat4.rotate(rotatedMatrix,  // destination matrix
                        object.matrix,  // matrix to rotate
                        rot,   // amount to rotate in radians
                        [0, 1, 0]);

                    //var initialrotatedboxcoords = useYRotToGetRotatedVectors(object.matrix, objectboxcoords);
                    var objectCoordsPostRotation = useYRotToGetRotatedVectors(rotatedMatrix, objectboxcoords);
                    var objectCoordsBeforeRotation = useYRotToGetRotatedVectors(object.matrix, objectboxcoords);//new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (objectCoordsPostRotation.length / 3); irc++) {
                        objectCoordsBeforeRotation[irc * 3 + 0] += object.matrix[x] - ox;
                        objectCoordsBeforeRotation[irc * 3 + 1] += object.matrix[y] - oy;
                        objectCoordsBeforeRotation[irc * 3 + 2] += object.matrix[z] - oz;

                        objectCoordsPostRotation[irc * 3 + 0] += object.matrix[x] - ox;
                        objectCoordsPostRotation[irc * 3 + 1] += object.matrix[y] - oy;
                        objectCoordsPostRotation[irc * 3 + 2] += object.matrix[z] - oz;
                    }

                    var rotatedboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsPostRotation);
                    var rotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(other.matrix, objectCoordsBeforeRotation);
                    //console.log(rotatedboxcoords + ' $$ ' + framenum)
                    //console.log(rotatedboxcoords[3 + 0] + ', ' + rotatedboxcoords[3 + 1] + ', ' + rotatedboxcoords[3 + 2] + ' ---- ' + rotatedPreMoveboxcoords[3 + 0] + ', '
                    //    + rotatedPreMoveboxcoords[3 + 1] + ', ' + rotatedPreMoveboxcoords[3 + 2] + ';;' + framenum);
                    for (var c = 0; c < rotatedboxcoords.length / 3; c++) {
                        //console.log(rotatedboxcoords + ' $$ ' + framenum)
                        if (rotatedboxcoords[c * 3 + 0] >= (otherboxcoords[3] - .00001) && rotatedboxcoords[c * 3 + 0] <= (otherboxcoords[0] + .00001)) {
                            if (rotatedboxcoords[c * 3 + 2] >= (otherboxcoords[8] - .00001) && rotatedboxcoords[c * 3 + 2] <= (otherboxcoords[2] + .00001)) {
                                console.log('clang clang ' + framenum);
                                var blocked = false;
                                
                                if (!blocked) {
                                    rot = 0;
                                }
                            }
                        }
                    }


                    //do other way around
                    var otherCoordsPostRotation = useYRotToGetRotatedVectors(other.matrix, otherboxcoords);
                    var otherCoordsBeforeRotation = useYRotToGetRotatedVectors(other.matrix, otherboxcoords);//new Array(initialrotatedboxcoords.length);

                    for (var irc = 0; irc < (otherCoordsPostRotation.length / 3); irc++) {
                        otherCoordsBeforeRotation[irc * 3 + 0] += -object.matrix[x] + ox;
                        otherCoordsBeforeRotation[irc * 3 + 1] += -object.matrix[y] + oy;
                        otherCoordsBeforeRotation[irc * 3 + 2] += -object.matrix[z] + oz;

                        otherCoordsPostRotation[irc * 3 + 0] += -object.matrix[x] + ox;
                        otherCoordsPostRotation[irc * 3 + 1] += -object.matrix[y] + oy;
                        otherCoordsPostRotation[irc * 3 + 2] += -object.matrix[z] + oz;
                    }
                    console.log(ox + ', ' + object.matrix[x] + ', ' + oz + '== '  + otherCoordsPostRotation);
                    var orotatedboxcoords = useYRotToGetInverseRotatedVectors(rotatedMatrix, otherCoordsPostRotation);
                    var orotatedPreMoveboxcoords = useYRotToGetInverseRotatedVectors(object.matrix, otherCoordsBeforeRotation);
                    //console.log(objectboxcoords);
                    for (var c = 0; c < orotatedboxcoords.length / 3; c++) {
                        if (orotatedboxcoords[c * 3 + 0] >= objectboxcoords[3] && orotatedboxcoords[c * 3 + 0] <= objectboxcoords[0]) {
                            if (orotatedboxcoords[c * 3 + 2] >= objectboxcoords[8] && orotatedboxcoords[c * 3 + 2] <= objectboxcoords[2]) {
                                console.log('kling kling'); //vec = [0, 0, 0];


                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
                                var blocked = false;
                                
                                if (!blocked) {
                                    rot = 0;
                                }

                            }
                        }
                    }

                }
            }
        }

        //for (var b = 0; b < 3; b++) {
        //    if (Math.abs(vec[b]) < .00001) {
        //        vec[b] = 0.0;
        //    }
        //}
        mat4.rotate(object.matrix,  // destination matrix
            object.matrix,  // matrix to rotate
            rot,   // amount to rotate in radians
            [0, 1, 0]);
    }

    var applyVeleocity = function () {
        const x = 12;
        const y = 13;
        const z = 14;
        for (var c = 0; c < StageData.objects.length; c++) {
            var object = StageData.objects[c];

            if (object.matrix && object.velocity) {
                //object.matrix[y] += object.velocity.y;
                tryMoveObject(object, [0.0, object.velocity.y, 0.0]);
            }
        }
    }

    var applyGravityAndGround = function () {
        var ground = StageData.objects[2];
        const x = 12;
        const y = 13;
        const z = 14;

        for (var i = 0; i < StageData.objects.length; i++) {
            if (i == 2) { continue; }

            var object = StageData.objects[i];


            var obx = object.matrix[x];
            var oby = object.matrix[y];
            var obz = object.matrix[z];
            var objectFoot = { x: obx, y: oby, z: obz };
            var floorheight = 1000.0;
            for (var f = 0; f < ground.positions.length / 3; f++) {
                var result = IsPointInTriangleIncludeY(objectFoot,
                    {
                        a: { x: ground.positions[ground.indices[f * 3 + 0] * 3 + 0], y: ground.positions[ground.indices[f * 3 + 0] * 3 + 1], z: ground.positions[ground.indices[f * 3 + 0] * 3 + 2] },
                        b: { x: ground.positions[ground.indices[f * 3 + 1] * 3 + 0], y: ground.positions[ground.indices[f * 3 + 1] * 3 + 1], z: ground.positions[ground.indices[f * 3 + 1] * 3 + 2] },
                        c: { x: ground.positions[ground.indices[f * 3 + 2] * 3 + 0], y: ground.positions[ground.indices[f * 3 + 2] * 3 + 1], z: ground.positions[ground.indices[f * 3 + 2] * 3 + 2] },
                    });
                if (result.didHit) {

                    floorheight = result.hity;
                    //console.log(floorheight);
                }
            }
            if (!object.confirmGrounded) { object.confirmGrounded = true; object.isGrounded = false; }
            if (Math.abs(floorheight - object.matrix[y]) > 0.0001) {
                if (object.matrix[y] <= floorheight + 0.0001) {
                    //console.log('o dear itsa ' + floorheight);
                    if (floorheight < 1000) {
                        object.matrix[y] = floorheight;
                    }
                    object.isGrounded = true;
                    object.velocity.y = 0; //console.log('sayw ' + object.matrix[x] + ', ' + object.matrix[y] + ', '  + object.matrix[z]);
                } else if (object.isGrounded && Math.abs(floorheight - object.matrix[y]) < 0.1) {
                    object.matrix[y] = floorheight;
                    //console.log('your grunded at ' + floorheight);
                } else {
                    object.velocity.y -= 0.004;
                    object.confirmGrounded = false;
                }
            } else if (!object.isGrounded) {
                 object.velocity.y -= 0.004;
            }
            //console.log('sayw ' + object.matrix[y]);
        }
    }

    var tryJump = function(object) {
        if (object.isGrounded) {
            object.isGrounded = false;
            object.velocity.y += 0.24;
        }
    }


    //credit to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    var useYRotToGetRotatedVectors = function (mat, vec3sarray) {
        var psize = vec3sarray.length / 3;
        var transformedArray = new Array(vec3sarray.length);

        for (var i = 0; i < psize; i++) {
            var vstart = i * 3;
            var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * mat[8] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 1.0 + vec3sarray[vstart + 2] * 0.0 + 0.0,
            vec3sarray[vstart] * mat[2] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * mat[10] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * 0.0 + 1.0];
            //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
            transformedArray[i * 3] = (rez[0]);
            transformedArray[i * 3 + 1] = (rez[1]);
            transformedArray[i * 3 + 2] = (rez[2]);// + rect.top;//why is the +top even there?
        }
        //console.log('eet: ' + transformedArray);
        return transformedArray;
    }

    //credit to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    var useYRotToGetInverseRotatedVectors = function (mat, vec3sarray) {
        var psize = vec3sarray.length / 3;
        var transformedArray = new Array(vec3sarray.length);

        for (var i = 0; i < psize; i++) {
            var vstart = i * 3;
            var rez = [vec3sarray[vstart] * mat[0] + vec3sarray[vstart + 1] * 0.0 + (-1.0 * vec3sarray[vstart + 2]) * mat[8] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 1.0 + vec3sarray[vstart + 2] * 0.0 + 0.0,
            (-1.0 * vec3sarray[vstart]) * mat[2] + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * mat[10] + 0.0,
            vec3sarray[vstart] * 0.0 + vec3sarray[vstart + 1] * 0.0 + vec3sarray[vstart + 2] * 0.0 + 1.0];
            //console.log( (320 + 320 * rez[0]) + ' ,' + (240 + 240 * rez[1]));
            transformedArray[i * 3] = (rez[0]);
            transformedArray[i * 3 + 1] = (rez[1]);
            transformedArray[i * 3 + 2] = (rez[2]);// + rect.top;//why is the +top even there?
        }
        //console.log('eet: ' + transformedArray);
        return transformedArray;
    }

    var IsPointInTriangleIncludeZ = function(point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
        var px = point.x;
        var py = point.y;
        var ax = tri.a.x || tri.a[0];
        var ay = tri.a.y || tri.a[1];
        var bx = tri.b.x || tri.b[0];
        var by = tri.b.y || tri.b[1];
        var cx = tri.c.x || tri.c[0];
        var cy = tri.c.y || tri.c[1];
        //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
        //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

        var v0 = [cx - ax, cy - ay];
        var v1 = [bx - ax, by - ay];
        var v2 = [px - ax, py - ay];

        var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
        var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
        var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
        var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        result = {};
        result.didHit = ((u >= 0) && (v >= 0) && (u + v <= 1));
        if (!result.didHit) {
            return result;
        } else {
            var startz = tri.a.z;
            var cmag = dot00;//Math.sqrt(dot00);
            var cproj = dot02 / cmag;
            var bmag = dot11;//Math.sqrt(dot11);
            var bproj = dot12 / bmag;
            result.hitz = bproj * (tri.b.z - startz) + cproj * (tri.c.z - startz) + startz; //console.log(result.hitz)
            return result;
        }
    }

    var IsPointInTriangleIncludeY = function (point, tri)/*(px, py, ax, ay, bx, by, cx, cy)*/ {
        var px = point.x;
        var py = point.z;
        var ax = tri.a.x || tri.a[0];
        var ay = tri.a.z || tri.a[2];
        var bx = tri.b.x || tri.b[0];
        var by = tri.b.z || tri.b[2];
        var cx = tri.c.x || tri.c[0];
        var cy = tri.c.z || tri.c[2];
        //credit: http://www.blackpawn.com/texts/pointinpoly/default.html
        //and https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/

        var v0 = [cx - ax, cy - ay];
        var v1 = [bx - ax, by - ay];
        var v2 = [px - ax, py - ay];

        var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
        var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
        var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
        var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        result = {};
        result.didHit = ((u >= 0) && (v >= 0) && (u + v <= 1));
        if (!result.didHit) {
            return result;
        } else {
            //credit https://math.stackexchange.com/questions/28043/finding-the-z-value-on-a-plane-with-x-y-values
            var cvec = [cx - ax, cy - ay, tri.c.y - tri.a.y];
            var bvec = [bx - ax, by - ay, tri.b.y - tri.a.y];
            var cxb = [cvec[1] * bvec[2] - cvec[2] * bvec[1], cvec[2] * bvec[0] - cvec[0] * bvec[2], cvec[0] * bvec[1] - cvec[1] * bvec[0]];
            var k = cxb[0] * tri.a.x + cxb[1] * tri.a.z + cxb[2] * tri.a.y;
            try {
                result.hity = (k - (cxb[0] * px + cxb[1] * py)) / cxb[2];
            }
            catch { result.hity = tri.a.y; }
            if (isNaN(result.hity)) {
                result.hity = tri.a.y;
            }

            /*
            //var cdotb = [cvec[0] * bvec[0], cvec[1] * bvec[1], cvec[2] * bvec[2]];
            var cdotb = cvec[0] * bvec[0] + cvec[1] * bvec[1] + cvec[2] * bvec[2];
            var cfulldot = cvec[0] * cvec[0] + cvec[1] * cvec[1] + cvec[2] * cvec[2];
            var bfulldot = bvec[0] * bvec[0] + bvec[1] * bvec[1] + bvec[2] * bvec[2];
            var corth = [cvec[0] - ((cdotb) * bvec[0]) / bfulldot, cvec[1] - ((cdotb) * bvec[1]) / bfulldot, cvec[2] - ((cdotb) * bvec[2]) / bfulldot];

            var starty = tri.a.y;
            var cmag = dot00;//Math.sqrt(dot00);
            var cproj = dot02 / cmag;
            var bmag = dot11;//Math.sqrt(dot11);
            var bproj = dot12 / bmag;
            //var corth = [v0[0] - (dot01) * v1[0], v0[1] - (dot01) * v1[1], ];
            var corthproj = (corth[0] * v2[0] + corth[1] * v2[1]) / (corth[0] * corth[0] + corth[1] * corth[1]);
            result.hity = corthproj * (corth[2]) + cproj * (tri.c.y - starty) + starty; //console.log(corth)*/

            return result;
        }
    }


    return {
        keystates: keystates,
        onFrame: onFrame,
        spaceWasDown: spaceWasDown
    }
})();

