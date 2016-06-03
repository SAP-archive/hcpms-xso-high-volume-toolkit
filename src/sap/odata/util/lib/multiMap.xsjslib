function MultiMap() {
	Object.defineProperty(this, 'values', {
		value: [],
		writable: true
	});
}

MultiMap.from = function(source) {
	var map = new MultiMap();
	if(MultiMap.isTupleList(source)) map.populateFromTupleList(source);
	else if(source instanceof MultiMap) map.populateFromMultiMap(source);
	else if(source instanceof Array) map.populateFromArray(source);
	else if(source) map.populateFromObject(source);
	return map;
}

MultiMap.isTupleList = function(source) {
	return source.get !== undefined &&
		source.length !== undefined &&
		source.set !== undefined &&
		source.remove !== undefined;
}

MultiMap.prototype.populateFromTupleList = function(tupleList) {
	for(var i = 0; i < tupleList.length; i++) {
		this.add(tupleList[i].name, tupleList[i].value);
	}
}

MultiMap.prototype.populateFromMultiMap = function(map) {
	map.values.forEach(function(entry) {
		this.add(entry.key, entry.value);
	}.bind(this));
}

MultiMap.prototype.populateFromArray = function(array) {
	array.forEach(this.add.bind(this));
}

MultiMap.prototype.populateFromObject = function(object) {
	Object.getOwnPropertyNames(object).forEach(function(propertyName) {
		this.add(propertyName, object[propertyName]);
	}.bind(this));
}

MultiMap.prototype.add = function(key, value) {
	this.values.push({key: key, value: value});
}

MultiMap.prototype.remove = function(key) {
	this.values = this.values.filter(function(entry) { return entry.key !== key; });
}

MultiMap.prototype.set = function(key, value) {
	if(this.contains(key)) this.get(key).value = value;
	else this.add(key, value);
}

MultiMap.prototype.get = function(key) {
	return (this.values.find(function(entry) { return entry.key === key; }) || {}).value;
}

MultiMap.prototype.contains = function(key) {
	return !!this.get(key);
}

MultiMap.prototype.forEach = function() {
	this.values.forEach.apply(this.values, arguments);
}

MultiMap.prototype.map = function() {
	return this.values.map.apply(this.values, arguments);
}

MultiMap.prototype.filter = function() {
	return MultiMap.from(this.values.filter.apply(this.values, arguments));
}

MultiMap.prototype.copyToTupleList = function(tupleList) {
	this.forEach(function(entry) {
		tupleList.set(entry.key + '', entry.value + '');
	});
}

MultiMap.prototype.toString = function() {
	return '[MultiMap object]';
}
