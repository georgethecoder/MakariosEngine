// JavaScript source code
// Now create an array of positions for the square.
const StageData = (function () {
    var objects = [];
    var options = {};
    var ticks = 0;
    var vticks = 0;
    var timedelta = 0;
    var skybox = null;

    var firstAvailableIndex = 0;

    var createAvailabilityObject = function () {

        return {
            availabilityChain: { 'first': null },
            firstAvailableIndex : 0
        };
    };



    var globalAvailabilityContainer = createAvailabilityObject();//{ 'first': null };
    var setNextAvailableIndex = function (holderObj) {
        var avail;
        var theHeld;
        if (!holderObj) {
            avail = globalAvailabilityContainer;
            theHeld = objects;
        } else {
            avail = holderObj.availabilityContainer;
            theHeld = holderObj.children;
        }
        var chainToUse = avail.availabilityChain;
        var oldFirst = avail.firstAvailableIndex;
        var newFirst = theHeld.length;

        if (chainToUse.first && chainToUse.first.val < newFirst) {
            newFirst = chainToUse.first.val;
            chainToUse.first = chainToUse.first.next;
        }

        avail.firstAvailableIndex = newFirst;
    };
    var finalizeInstantiation = function (newItem, parent) {
        var avail;
        var objArray;
        if (!parent) {
            avail = globalAvailabilityContainer;
            objArray = objects;
        } else {
            avail = parent.availabilityContainer;
            objArray = parent.children;
            //console.log(objArray);
            //console.log(avail.firstAvailableIndex);
            //newItem.bla = 'effemall' + Date.now();
            //console.log('!!!!!!!!!!!!!!!!!!!!!!! WOOALERT FOR New child ' + newItem.bla);
        }
        //console.log('now its a loggin time!!');

        newItem.id = avail.firstAvailableIndex;
        objArray[avail.firstAvailableIndex] = newItem;

        //console.log(avail.firstAvailableIndex);
        //console.log(objArray[avail.firstAvailableIndex]);
        //console.log(newItem);
        //console.log(objArray);
        //console.log(objArray[0]);
        //console.log('lets get numbers');
        //console.log(objArray[avail.firstAvailableIndex].positions.length);
        //console.log(newItem.positions.length);

        //console.log(objArray);
        setNextAvailableIndex(parent);
    };
    var destroy = function (inst) {
        var avail;
        if (!inst.parent) {
            avail = globalAvailabilityContainer;
        } else {
            avail = parent.availabilityContainer;
        }
        var chainToUse = avail.availabilityChain;

        var oldindex = inst.id;
        objects[oldindex] = null;
        if (!chainToUse.first || chainToUse.first.val > oldindex) {
            chainToUse.first = { 'val': oldindex, 'next': chainToUse.first };
            firstAvailableIndex = oldindex;
        } else {
            var searching = true;
            var currentLink = chainToUse.first;
            while (searching) {
                if (!currentLink.next) {
                    searching = false;
                    currentLink.next = { 'val': oldindex, 'next': null };
                } else if (currentLink.next.val > oldindex) {
                    searching = false;
                    currentLink.next = { 'val': oldindex, 'next': currentLink.next };
                }
                currentLink = currentLink.next;
            }
        }

        //extra leaning to avoid memory leaks eg circular dependency issues
        //will need to make some things recursive. dont need that today. todo!
        inst.parent = null;
        inst.availabilityContainer = null;
        inst.ObjectOnFrame = null;
        inst.customprops = null;
        inst.matrix = null;
        inst.children = null;
    };

    var setupObject = function (prim, textureUrl, objectOnFrame, customprops) {
        var newInst = {};
        if (!prim.isComposite) {
            newInst.positions = new Array(prim.positions.length).fill().map(function (x, ind) { return prim.positions[ind]; });
            newInst.textureCoordinates = new Array(prim.textureCoordinates.length).fill().map(function (x, ind) { return prim.textureCoordinates[ind]; });
            newInst.indices = new Array(prim.indices.length).fill().map(function (x, ind) { return prim.indices[ind]; });
            newInst.vertexNormals = new Array(Primitives.getVertextNormals(prim).length).fill().map(function (x, ind) { return Primitives.getVertextNormals(prim)[ind]; });
        } else {
            newInst.positions = new Array();
            newInst.textureCoordinates = new Array();
            newInst.indices = new Array();
            newInst.vertexNormals = new Array();

            for (var i = 0; i < prim.components.length; i++) {
                var compMat = mat4.create();
                glMatrix.mat4.rotate(compMat,  // destination matrix
                    compMat,  // matrix to rotate
                    3.14 * i,   // amount to rotate in radians
                    [0, 0, 1]);
                glMatrix.mat4.rotate(compMat,  // destination matrix
                    compMat,  // matrix to rotate
                    3.14 * i,   // amount to rotate in radians
                    [0, 1, 0]);
                //glMatrix.mat4.translate(compMat,     // destination matrix
                //    compMat,     // matrix to translate
                //    [0.0, 0.0, 0.0]);
                //console.log(prim.components[i].type);
                newInst.positions = newInst.positions.concat(linTransform(compMat, Primitives.shapes[prim.components[i].type].positions));
                newInst.textureCoordinates = newInst.textureCoordinates.concat(Primitives.shapes[prim.components[i].type].textureCoordinates);
                newInst.indices = newInst.indices.concat(Primitives.shapes[prim.components[i].type].indices.map(function (x, ind) { return Primitives.shapes[prim.components[i].type].indices[ind] + newInst.indices.length; }));
                newInst.vertexNormals = newInst.vertexNormals.concat(Primitives.getVertextNormals(Primitives.shapes[prim.components[i].type]));//(linTransform(compMat, Primitives.getVertextNormals(Primitives.shapes[prim.components[i].type])));
            }
            //console.log(newInst.indices);
        }

        //newInst.useParentMatrix = new Array(newInst.positions.length / 3).fill().map(x => 0.0);
        newInst.matrix = mat4.create();
        newInst.children = [];
        newInst.availabilityContainer = createAvailabilityObject();
        if (prim.animations) {
            newInst.animations = prim.animations.slice(0);
        }

        newInst.isGrounded = true,
            newInst.confirmGrounded = true,
            newInst.velocity = {
                y: 0.0
            };
        newInst.textureUrl = textureUrl;
        newInst.textureImage = null;

        newInst.ObjectOnFrame = objectOnFrame;
        newInst.customprops = customprops;

        return newInst;
    };

    var instantiate = function (prim, textureUrl, objectOnFrame, customprops) {

        var newInst = setupObject(prim, textureUrl, objectOnFrame, customprops);
        newInst.rootID = 0;
        newInst.rootchildren = [];
        newInst.useParentMatrix = new Array(newInst.positions.length / 3).fill().map(function (x, ind) { return 0.0 });

        if (prim.children) {
            for (var i = 0; i < prim.children.length; i++) {
                //may eventually need precise onframe on customs for children... todo yo
                instantiateChild(newInst, prim.children[i], textureUrl, null, {}, newInst)
                //console.log(newInst.children[i]);
            }
        }

        finalizeInstantiation(newInst);
        //console.log('number in array: ' + objects.length)
        return newInst;
    };




    var instantiateChild = function (parent, prim, textureUrl, objectOnFrame, customprops, rootnode) {

        var newInst = setupObject(prim, textureUrl, objectOnFrame, customprops);
        if (!rootnode) {
            var recparent = parent;
            while (recparent.parent) {
                recparent = recparent.parent;
            }
            rootnode = recparent;
        }

        newInst.rootID = prim.rootID || rootnode.rootchildren.length;
        rootnode.rootchildren[newInst.rootID] = newInst;
        newInst.customprops = customprops;
        newInst.useParentMatrix = new Array(newInst.positions.length / 3).fill().map(function (x, ind) { return 1.0 });

        newInst.parent = parent;

        if (prim.children) {
            for (var i = 0; i < prim.children.length; i++) {
                //may eventually need precise onframe on customs for children... todo yo
                instantiateChild(newInst, prim.children[i], textureUrl, null, {}, rootnode)
            }
        }

        //parent.children.push(newInst);
        //newInst.
        finalizeInstantiation(newInst, newInst.parent);
        
        return newInst;
    };

    return {
        'objects': objects,
        'options': options,
        'instantiate': instantiate,
        'instantiateChild': instantiateChild,
        'destroy': destroy,
        'ticks': ticks,
        'vticks': vticks,
        'timedelta': timedelta,
        'skybox': skybox
    };
})();