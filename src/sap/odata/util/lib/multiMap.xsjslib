/**
 * TupelList[sic]-like map implementation of a MultiMap that integrates nicely
 * with TupelLists, Arrays and Objects. Can hold several values per key.
 *
 * This implementation is case sensitive.
 *
 */
function MultiMap() {
	Object.defineProperty(this, 'values', {
		value: [],
		writable: true
	});
}

/**
 * Creates a new MultiMap from the provided source object. The source object may
 * be a plain object, another MultiMap or an array of objects conforming to the internal
 * MultiMap format ({key: any, value: any}).
 * 
 * @parameter source {MultiMap|Object|{key: any, value: any}[]} 
 */
MultiMap.from = function(source) {
	var map = new MultiMap();
	if(MultiMap.isTupleList(source)) map.populateFromTupleList(source);
	else if(source instanceof MultiMap) map.populateFromMultiMap(source);
	else if(source instanceof Array) map.populateFromArray(source);
	else if(source) map.populateFromObject(source);
	return map;
}

/**
 * Tells if the supplied object is (likely to be) a TupelList[sic].
 *
 * This is a heuristic guess, since instanceof does not work on XSJS default classes.
 *
 * @parameter source {any}
 */
MultiMap.isTupleList = function(source) {
	return source.get !== undefined &&
		source.length !== undefined &&
		source.set !== undefined &&
		source.remove !== undefined;
}

/**
 * Populate this instance from the specified tuple list, adding all of its entries.
 *
 * @parameter tupleList {TupelList} 
 */
MultiMap.prototype.populateFromTupleList = function(tupleList) {
	for(var i = 0; i < tupleList.length; i++) {
		this.add(tupleList[i].name, tupleList[i].value);
	}
}

/**
 * Populate this instance from the specified multimap, adding all of its entries.
 *
 * @parameter map {MultiMap}
 */
MultiMap.prototype.populateFromMultiMap = function(map) {
	map.values.forEach(function(entry) {
		this.add(entry.key, entry.value);
	}.bind(this));
}

/**
 * Populate this instance from the specified multimap value array, adding all of its entries.
 *
 * @parameter array {{key: any, value: any}[]} 
 */
MultiMap.prototype.populateFromArray = function(array) {
	array.forEach(this.add.bind(this));
}

/**
 * Populate this instance from the specified object, adding all of its key-value-pairs.
 *
 * @parameter object {object} 
 */
MultiMap.prototype.populateFromObject = function(object) {
	Object.getOwnPropertyNames(object).forEach(function(propertyName) {
		this.add(propertyName, object[propertyName]);
	}.bind(this));
}

/**
 * Adds the specified key-value-pair.
 */
MultiMap.prototype.add = function(key, value) {
	this.values.push({key: key, value: value});
}

/**
 * Removes all entries with the specified key.
 */
MultiMap.prototype.remove = function(key) {
	this.values = this.values.filter(function(entry) { return entry.key !== key; });
}

/**
 * Sets the specified key-value-pair. If the key is already contained, any one of the
 * existing entries is updated. Otherwise a new entry is created.
 */
MultiMap.prototype.set = function(key, value) {
	if(this.contains(key)) this._find(key).value = value;
	else this.add(key, value);
}

/**
 * Returns a list of entries matching the supplied keys. This method is case insensitive.
 */
MultiMap.prototype._find = function(key) {
	return this.values.find(function(entry) { return entry.key.toUpperCase() === key.toUpperCase(); });
}

/**
 * Retrieves the value of one of the entries matching the specified key.
 */
MultiMap.prototype.get = function(key) {
	return (this._find(key) || {}).value;
}

/**
 * Tells if this map contains the specified key.
 */
MultiMap.prototype.contains = function(key) {
	return !!this.get(key);
}

/**
 * Iterates over all entries in this map, calling the callback for each entry.
 *
 * @parameter callback {function({key: any, value: any})} Callback function
 */
MultiMap.prototype.forEach = function() {
	this.values.forEach.apply(this.values, arguments);
}

/**
 * Iterates over all entries in this map, calling the callback for each entry,
 * and returns an array of values returned by the callback.
 *
 * @parameter callback {function({key: any, value: any}): void} Transformation function
 */
MultiMap.prototype.map = function() {
	return this.values.map.apply(this.values, arguments);
}

/**
 * Filters this map using the supplied filter function.
 *
 * @parameter callback {function({key: any, value: any}): boolean} Filter function
 */
MultiMap.prototype.filter = function() {
	return MultiMap.from(this.values.filter.apply(this.values, arguments));
}

/**
 * Copies all key-value-pairs in this multi map to the supplied tuple list.
 *
 * @parameter tupleList {TupelList}
 */
MultiMap.prototype.copyToTupleList = function(tupleList) {
	this.forEach(function(entry) {
		tupleList.set(entry.key + '', entry.value + '');
	});
}

MultiMap.prototype.toString = function() {
	return '[MultiMap object]';
}
