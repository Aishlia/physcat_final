(function(){

 var draggableClass = 'draggable';

 this.DraggableSVG = function(config, polygon, container) {
 this._class = "DraggableSVG";
 this.container = container;

 // Element
 this.units = config.units || 'px';
 this.tag = config.tag || 'rect';
 this.element = null;

 // Element attributes (move to attributes object?)
 // this.class = (draggableClass + " " + (config.class || "")).trim();
 // this.fill = config.fill || 'red';
 // this.width = config.width || 100;
 // this.height = config.height || 100;

 // Element Coordinates
 this.x = config.x || 0;
 this.y = config.y || 0;
 this.previousClientY = this.x;
 this.previousClientX = this.y;

 // Bind Event Listeners
 this.select = this.select.bind(this);
 this.drag = this.drag.bind(this);
 this.drop = this.drop.bind(this);

 this.create(polygon);

 }

 this.DraggableSVG.prototype.create = function(polygon) {
 this.element = this.element || this.createSVGElement('svg');
 console.log(polygon)
 // this.element.appendChild(polygon);

 // this.container.appendChild(this.element);
  this.container.appendChild(polygon);
 this.initializeEventListeners();
 this.render();
 }

 this.DraggableSVG.prototype.createSVGElement = function(el) {
 return document.createElementNS('http://www.w3.org/2000/svg', el)
 }

 this.DraggableSVG.prototype.initializeEventListeners = function() {
 this.element.addEventListener('mousedown', this.select);
 }

 this.DraggableSVG.prototype.render = function() {
 this.setAttributes();
 this.setCoords();
 }

 this.DraggableSVG.prototype.setAttributes = function() {
 // this.element.setAttribute('class', this.class);
 // this.element.setAttribute('width', this.width + this.units);
 // this.element.setAttribute('height', this.height + this.units);
 // this.element.setAttribute('fill', this.fill);
 }

 this.DraggableSVG.prototype.setCoords = function() {
  // this.element.setAttribute('transform', "translate(" +
  //     this.x + ", " +
  //     this.y + ")");
 // this.element.setAttribute('x', this.x);
 // this.element.setAttribute('y', this.y);
 }

 this.DraggableSVG.prototype.select = function(evt) {
 this.container.appendChild(this.element);
 this.previousClientX = Number(evt.clientX);
 this.previousClientY = Number(evt.clientY);
 document.addEventListener("mousemove", this.drag);
 document.addEventListener("mouseup", this.drop);
 }

 this.DraggableSVG.prototype.drag = function(evt) {
 // opportunity here to stop drag for any reason
 this.move(evt);
 }

 this.DraggableSVG.prototype.move = function(evt) {
 var dx = Number(evt.clientX) - this.previousClientX;
 var dy = Number(evt.clientY) - this.previousClientY;
 this.x = Number(this.x) + dx;
 this.y = Number(this.y) + dy;
 this.previousClientX = evt.clientX;
 this.previousClientY = evt.clientY;
 this.setCoords();
 }

 this.DraggableSVG.prototype.drop = function(evt) {
 document.removeEventListener("mouseup", this.drop)
 document.removeEventListener("mousemove", this.drag)
 }

 this.DraggableSVG.prototype.printProps = function(prefix) {
 prefix = prefix || this._class;
 for (var i in this) {
 if (this.hasOwnProperty(i)) {
 var propStr = prefix + '.' + i + ' =';
 console.log(propStr, this[i])
 }
 }
 }

})();
