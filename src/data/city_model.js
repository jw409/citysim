/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const urbansynth = $root.urbansynth = (() => {

    /**
     * Namespace urbansynth.
     * @exports urbansynth
     * @namespace
     */
    const urbansynth = {};

    urbansynth.City = (function() {

        /**
         * Properties of a City.
         * @memberof urbansynth
         * @interface ICity
         * @property {string|null} [name] City name
         * @property {urbansynth.IBoundingBox|null} [bounds] City bounds
         * @property {Array.<urbansynth.IZone>|null} [zones] City zones
         * @property {Array.<urbansynth.IRoad>|null} [roads] City roads
         * @property {Array.<urbansynth.IPOI>|null} [pois] City pois
         * @property {Array.<urbansynth.IBuilding>|null} [buildings] City buildings
         * @property {urbansynth.ICityMetadata|null} [metadata] City metadata
         */

        /**
         * Constructs a new City.
         * @memberof urbansynth
         * @classdesc Represents a City.
         * @implements ICity
         * @constructor
         * @param {urbansynth.ICity=} [properties] Properties to set
         */
        function City(properties) {
            this.zones = [];
            this.roads = [];
            this.pois = [];
            this.buildings = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * City name.
         * @member {string} name
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.name = "";

        /**
         * City bounds.
         * @member {urbansynth.IBoundingBox|null|undefined} bounds
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.bounds = null;

        /**
         * City zones.
         * @member {Array.<urbansynth.IZone>} zones
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.zones = $util.emptyArray;

        /**
         * City roads.
         * @member {Array.<urbansynth.IRoad>} roads
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.roads = $util.emptyArray;

        /**
         * City pois.
         * @member {Array.<urbansynth.IPOI>} pois
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.pois = $util.emptyArray;

        /**
         * City buildings.
         * @member {Array.<urbansynth.IBuilding>} buildings
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.buildings = $util.emptyArray;

        /**
         * City metadata.
         * @member {urbansynth.ICityMetadata|null|undefined} metadata
         * @memberof urbansynth.City
         * @instance
         */
        City.prototype.metadata = null;

        /**
         * Creates a new City instance using the specified properties.
         * @function create
         * @memberof urbansynth.City
         * @static
         * @param {urbansynth.ICity=} [properties] Properties to set
         * @returns {urbansynth.City} City instance
         */
        City.create = function create(properties) {
            return new City(properties);
        };

        /**
         * Encodes the specified City message. Does not implicitly {@link urbansynth.City.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.City
         * @static
         * @param {urbansynth.ICity} message City message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        City.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.bounds != null && Object.hasOwnProperty.call(message, "bounds"))
                $root.urbansynth.BoundingBox.encode(message.bounds, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.zones != null && message.zones.length)
                for (let i = 0; i < message.zones.length; ++i)
                    $root.urbansynth.Zone.encode(message.zones[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.roads != null && message.roads.length)
                for (let i = 0; i < message.roads.length; ++i)
                    $root.urbansynth.Road.encode(message.roads[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.pois != null && message.pois.length)
                for (let i = 0; i < message.pois.length; ++i)
                    $root.urbansynth.POI.encode(message.pois[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.buildings != null && message.buildings.length)
                for (let i = 0; i < message.buildings.length; ++i)
                    $root.urbansynth.Building.encode(message.buildings[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                $root.urbansynth.CityMetadata.encode(message.metadata, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified City message, length delimited. Does not implicitly {@link urbansynth.City.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.City
         * @static
         * @param {urbansynth.ICity} message City message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        City.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a City message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.City
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.City} City
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        City.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.City();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.name = reader.string();
                        break;
                    }
                case 2: {
                        message.bounds = $root.urbansynth.BoundingBox.decode(reader, reader.uint32());
                        break;
                    }
                case 3: {
                        if (!(message.zones && message.zones.length))
                            message.zones = [];
                        message.zones.push($root.urbansynth.Zone.decode(reader, reader.uint32()));
                        break;
                    }
                case 4: {
                        if (!(message.roads && message.roads.length))
                            message.roads = [];
                        message.roads.push($root.urbansynth.Road.decode(reader, reader.uint32()));
                        break;
                    }
                case 5: {
                        if (!(message.pois && message.pois.length))
                            message.pois = [];
                        message.pois.push($root.urbansynth.POI.decode(reader, reader.uint32()));
                        break;
                    }
                case 6: {
                        if (!(message.buildings && message.buildings.length))
                            message.buildings = [];
                        message.buildings.push($root.urbansynth.Building.decode(reader, reader.uint32()));
                        break;
                    }
                case 7: {
                        message.metadata = $root.urbansynth.CityMetadata.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a City message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.City
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.City} City
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        City.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a City message.
         * @function verify
         * @memberof urbansynth.City
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        City.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.bounds != null && message.hasOwnProperty("bounds")) {
                let error = $root.urbansynth.BoundingBox.verify(message.bounds);
                if (error)
                    return "bounds." + error;
            }
            if (message.zones != null && message.hasOwnProperty("zones")) {
                if (!Array.isArray(message.zones))
                    return "zones: array expected";
                for (let i = 0; i < message.zones.length; ++i) {
                    let error = $root.urbansynth.Zone.verify(message.zones[i]);
                    if (error)
                        return "zones." + error;
                }
            }
            if (message.roads != null && message.hasOwnProperty("roads")) {
                if (!Array.isArray(message.roads))
                    return "roads: array expected";
                for (let i = 0; i < message.roads.length; ++i) {
                    let error = $root.urbansynth.Road.verify(message.roads[i]);
                    if (error)
                        return "roads." + error;
                }
            }
            if (message.pois != null && message.hasOwnProperty("pois")) {
                if (!Array.isArray(message.pois))
                    return "pois: array expected";
                for (let i = 0; i < message.pois.length; ++i) {
                    let error = $root.urbansynth.POI.verify(message.pois[i]);
                    if (error)
                        return "pois." + error;
                }
            }
            if (message.buildings != null && message.hasOwnProperty("buildings")) {
                if (!Array.isArray(message.buildings))
                    return "buildings: array expected";
                for (let i = 0; i < message.buildings.length; ++i) {
                    let error = $root.urbansynth.Building.verify(message.buildings[i]);
                    if (error)
                        return "buildings." + error;
                }
            }
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                let error = $root.urbansynth.CityMetadata.verify(message.metadata);
                if (error)
                    return "metadata." + error;
            }
            return null;
        };

        /**
         * Creates a City message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.City
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.City} City
         */
        City.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.City)
                return object;
            let message = new $root.urbansynth.City();
            if (object.name != null)
                message.name = String(object.name);
            if (object.bounds != null) {
                if (typeof object.bounds !== "object")
                    throw TypeError(".urbansynth.City.bounds: object expected");
                message.bounds = $root.urbansynth.BoundingBox.fromObject(object.bounds);
            }
            if (object.zones) {
                if (!Array.isArray(object.zones))
                    throw TypeError(".urbansynth.City.zones: array expected");
                message.zones = [];
                for (let i = 0; i < object.zones.length; ++i) {
                    if (typeof object.zones[i] !== "object")
                        throw TypeError(".urbansynth.City.zones: object expected");
                    message.zones[i] = $root.urbansynth.Zone.fromObject(object.zones[i]);
                }
            }
            if (object.roads) {
                if (!Array.isArray(object.roads))
                    throw TypeError(".urbansynth.City.roads: array expected");
                message.roads = [];
                for (let i = 0; i < object.roads.length; ++i) {
                    if (typeof object.roads[i] !== "object")
                        throw TypeError(".urbansynth.City.roads: object expected");
                    message.roads[i] = $root.urbansynth.Road.fromObject(object.roads[i]);
                }
            }
            if (object.pois) {
                if (!Array.isArray(object.pois))
                    throw TypeError(".urbansynth.City.pois: array expected");
                message.pois = [];
                for (let i = 0; i < object.pois.length; ++i) {
                    if (typeof object.pois[i] !== "object")
                        throw TypeError(".urbansynth.City.pois: object expected");
                    message.pois[i] = $root.urbansynth.POI.fromObject(object.pois[i]);
                }
            }
            if (object.buildings) {
                if (!Array.isArray(object.buildings))
                    throw TypeError(".urbansynth.City.buildings: array expected");
                message.buildings = [];
                for (let i = 0; i < object.buildings.length; ++i) {
                    if (typeof object.buildings[i] !== "object")
                        throw TypeError(".urbansynth.City.buildings: object expected");
                    message.buildings[i] = $root.urbansynth.Building.fromObject(object.buildings[i]);
                }
            }
            if (object.metadata != null) {
                if (typeof object.metadata !== "object")
                    throw TypeError(".urbansynth.City.metadata: object expected");
                message.metadata = $root.urbansynth.CityMetadata.fromObject(object.metadata);
            }
            return message;
        };

        /**
         * Creates a plain object from a City message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.City
         * @static
         * @param {urbansynth.City} message City
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        City.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.zones = [];
                object.roads = [];
                object.pois = [];
                object.buildings = [];
            }
            if (options.defaults) {
                object.name = "";
                object.bounds = null;
                object.metadata = null;
            }
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.bounds != null && message.hasOwnProperty("bounds"))
                object.bounds = $root.urbansynth.BoundingBox.toObject(message.bounds, options);
            if (message.zones && message.zones.length) {
                object.zones = [];
                for (let j = 0; j < message.zones.length; ++j)
                    object.zones[j] = $root.urbansynth.Zone.toObject(message.zones[j], options);
            }
            if (message.roads && message.roads.length) {
                object.roads = [];
                for (let j = 0; j < message.roads.length; ++j)
                    object.roads[j] = $root.urbansynth.Road.toObject(message.roads[j], options);
            }
            if (message.pois && message.pois.length) {
                object.pois = [];
                for (let j = 0; j < message.pois.length; ++j)
                    object.pois[j] = $root.urbansynth.POI.toObject(message.pois[j], options);
            }
            if (message.buildings && message.buildings.length) {
                object.buildings = [];
                for (let j = 0; j < message.buildings.length; ++j)
                    object.buildings[j] = $root.urbansynth.Building.toObject(message.buildings[j], options);
            }
            if (message.metadata != null && message.hasOwnProperty("metadata"))
                object.metadata = $root.urbansynth.CityMetadata.toObject(message.metadata, options);
            return object;
        };

        /**
         * Converts this City to JSON.
         * @function toJSON
         * @memberof urbansynth.City
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        City.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for City
         * @function getTypeUrl
         * @memberof urbansynth.City
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        City.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.City";
        };

        return City;
    })();

    urbansynth.BoundingBox = (function() {

        /**
         * Properties of a BoundingBox.
         * @memberof urbansynth
         * @interface IBoundingBox
         * @property {number|null} [minX] BoundingBox minX
         * @property {number|null} [minY] BoundingBox minY
         * @property {number|null} [maxX] BoundingBox maxX
         * @property {number|null} [maxY] BoundingBox maxY
         */

        /**
         * Constructs a new BoundingBox.
         * @memberof urbansynth
         * @classdesc Represents a BoundingBox.
         * @implements IBoundingBox
         * @constructor
         * @param {urbansynth.IBoundingBox=} [properties] Properties to set
         */
        function BoundingBox(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BoundingBox minX.
         * @member {number} minX
         * @memberof urbansynth.BoundingBox
         * @instance
         */
        BoundingBox.prototype.minX = 0;

        /**
         * BoundingBox minY.
         * @member {number} minY
         * @memberof urbansynth.BoundingBox
         * @instance
         */
        BoundingBox.prototype.minY = 0;

        /**
         * BoundingBox maxX.
         * @member {number} maxX
         * @memberof urbansynth.BoundingBox
         * @instance
         */
        BoundingBox.prototype.maxX = 0;

        /**
         * BoundingBox maxY.
         * @member {number} maxY
         * @memberof urbansynth.BoundingBox
         * @instance
         */
        BoundingBox.prototype.maxY = 0;

        /**
         * Creates a new BoundingBox instance using the specified properties.
         * @function create
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {urbansynth.IBoundingBox=} [properties] Properties to set
         * @returns {urbansynth.BoundingBox} BoundingBox instance
         */
        BoundingBox.create = function create(properties) {
            return new BoundingBox(properties);
        };

        /**
         * Encodes the specified BoundingBox message. Does not implicitly {@link urbansynth.BoundingBox.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {urbansynth.IBoundingBox} message BoundingBox message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BoundingBox.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.minX != null && Object.hasOwnProperty.call(message, "minX"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.minX);
            if (message.minY != null && Object.hasOwnProperty.call(message, "minY"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.minY);
            if (message.maxX != null && Object.hasOwnProperty.call(message, "maxX"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.maxX);
            if (message.maxY != null && Object.hasOwnProperty.call(message, "maxY"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.maxY);
            return writer;
        };

        /**
         * Encodes the specified BoundingBox message, length delimited. Does not implicitly {@link urbansynth.BoundingBox.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {urbansynth.IBoundingBox} message BoundingBox message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BoundingBox.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BoundingBox message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.BoundingBox} BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BoundingBox.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.BoundingBox();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.minX = reader.float();
                        break;
                    }
                case 2: {
                        message.minY = reader.float();
                        break;
                    }
                case 3: {
                        message.maxX = reader.float();
                        break;
                    }
                case 4: {
                        message.maxY = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BoundingBox message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.BoundingBox} BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BoundingBox.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BoundingBox message.
         * @function verify
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BoundingBox.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.minX != null && message.hasOwnProperty("minX"))
                if (typeof message.minX !== "number")
                    return "minX: number expected";
            if (message.minY != null && message.hasOwnProperty("minY"))
                if (typeof message.minY !== "number")
                    return "minY: number expected";
            if (message.maxX != null && message.hasOwnProperty("maxX"))
                if (typeof message.maxX !== "number")
                    return "maxX: number expected";
            if (message.maxY != null && message.hasOwnProperty("maxY"))
                if (typeof message.maxY !== "number")
                    return "maxY: number expected";
            return null;
        };

        /**
         * Creates a BoundingBox message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.BoundingBox} BoundingBox
         */
        BoundingBox.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.BoundingBox)
                return object;
            let message = new $root.urbansynth.BoundingBox();
            if (object.minX != null)
                message.minX = Number(object.minX);
            if (object.minY != null)
                message.minY = Number(object.minY);
            if (object.maxX != null)
                message.maxX = Number(object.maxX);
            if (object.maxY != null)
                message.maxY = Number(object.maxY);
            return message;
        };

        /**
         * Creates a plain object from a BoundingBox message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {urbansynth.BoundingBox} message BoundingBox
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BoundingBox.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.minX = 0;
                object.minY = 0;
                object.maxX = 0;
                object.maxY = 0;
            }
            if (message.minX != null && message.hasOwnProperty("minX"))
                object.minX = options.json && !isFinite(message.minX) ? String(message.minX) : message.minX;
            if (message.minY != null && message.hasOwnProperty("minY"))
                object.minY = options.json && !isFinite(message.minY) ? String(message.minY) : message.minY;
            if (message.maxX != null && message.hasOwnProperty("maxX"))
                object.maxX = options.json && !isFinite(message.maxX) ? String(message.maxX) : message.maxX;
            if (message.maxY != null && message.hasOwnProperty("maxY"))
                object.maxY = options.json && !isFinite(message.maxY) ? String(message.maxY) : message.maxY;
            return object;
        };

        /**
         * Converts this BoundingBox to JSON.
         * @function toJSON
         * @memberof urbansynth.BoundingBox
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BoundingBox.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for BoundingBox
         * @function getTypeUrl
         * @memberof urbansynth.BoundingBox
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        BoundingBox.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.BoundingBox";
        };

        return BoundingBox;
    })();

    urbansynth.Zone = (function() {

        /**
         * Properties of a Zone.
         * @memberof urbansynth
         * @interface IZone
         * @property {string|null} [id] Zone id
         * @property {urbansynth.ZoneType|null} [type] Zone type
         * @property {Array.<urbansynth.IPoint2D>|null} [boundary] Zone boundary
         * @property {number|null} [density] Zone density
         * @property {urbansynth.IZoneProperties|null} [properties] Zone properties
         */

        /**
         * Constructs a new Zone.
         * @memberof urbansynth
         * @classdesc Represents a Zone.
         * @implements IZone
         * @constructor
         * @param {urbansynth.IZone=} [properties] Properties to set
         */
        function Zone(properties) {
            this.boundary = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Zone id.
         * @member {string} id
         * @memberof urbansynth.Zone
         * @instance
         */
        Zone.prototype.id = "";

        /**
         * Zone type.
         * @member {urbansynth.ZoneType} type
         * @memberof urbansynth.Zone
         * @instance
         */
        Zone.prototype.type = 0;

        /**
         * Zone boundary.
         * @member {Array.<urbansynth.IPoint2D>} boundary
         * @memberof urbansynth.Zone
         * @instance
         */
        Zone.prototype.boundary = $util.emptyArray;

        /**
         * Zone density.
         * @member {number} density
         * @memberof urbansynth.Zone
         * @instance
         */
        Zone.prototype.density = 0;

        /**
         * Zone properties.
         * @member {urbansynth.IZoneProperties|null|undefined} properties
         * @memberof urbansynth.Zone
         * @instance
         */
        Zone.prototype.properties = null;

        /**
         * Creates a new Zone instance using the specified properties.
         * @function create
         * @memberof urbansynth.Zone
         * @static
         * @param {urbansynth.IZone=} [properties] Properties to set
         * @returns {urbansynth.Zone} Zone instance
         */
        Zone.create = function create(properties) {
            return new Zone(properties);
        };

        /**
         * Encodes the specified Zone message. Does not implicitly {@link urbansynth.Zone.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.Zone
         * @static
         * @param {urbansynth.IZone} message Zone message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Zone.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.boundary != null && message.boundary.length)
                for (let i = 0; i < message.boundary.length; ++i)
                    $root.urbansynth.Point2D.encode(message.boundary[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.density != null && Object.hasOwnProperty.call(message, "density"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.density);
            if (message.properties != null && Object.hasOwnProperty.call(message, "properties"))
                $root.urbansynth.ZoneProperties.encode(message.properties, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Zone message, length delimited. Does not implicitly {@link urbansynth.Zone.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.Zone
         * @static
         * @param {urbansynth.IZone} message Zone message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Zone.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Zone message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.Zone
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.Zone} Zone
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Zone.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.Zone();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.type = reader.int32();
                        break;
                    }
                case 3: {
                        if (!(message.boundary && message.boundary.length))
                            message.boundary = [];
                        message.boundary.push($root.urbansynth.Point2D.decode(reader, reader.uint32()));
                        break;
                    }
                case 4: {
                        message.density = reader.float();
                        break;
                    }
                case 5: {
                        message.properties = $root.urbansynth.ZoneProperties.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Zone message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.Zone
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.Zone} Zone
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Zone.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Zone message.
         * @function verify
         * @memberof urbansynth.Zone
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Zone.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                }
            if (message.boundary != null && message.hasOwnProperty("boundary")) {
                if (!Array.isArray(message.boundary))
                    return "boundary: array expected";
                for (let i = 0; i < message.boundary.length; ++i) {
                    let error = $root.urbansynth.Point2D.verify(message.boundary[i]);
                    if (error)
                        return "boundary." + error;
                }
            }
            if (message.density != null && message.hasOwnProperty("density"))
                if (typeof message.density !== "number")
                    return "density: number expected";
            if (message.properties != null && message.hasOwnProperty("properties")) {
                let error = $root.urbansynth.ZoneProperties.verify(message.properties);
                if (error)
                    return "properties." + error;
            }
            return null;
        };

        /**
         * Creates a Zone message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.Zone
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.Zone} Zone
         */
        Zone.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.Zone)
                return object;
            let message = new $root.urbansynth.Zone();
            if (object.id != null)
                message.id = String(object.id);
            switch (object.type) {
            default:
                if (typeof object.type === "number") {
                    message.type = object.type;
                    break;
                }
                break;
            case "RESIDENTIAL":
            case 0:
                message.type = 0;
                break;
            case "COMMERCIAL":
            case 1:
                message.type = 1;
                break;
            case "INDUSTRIAL":
            case 2:
                message.type = 2;
                break;
            case "DOWNTOWN":
            case 3:
                message.type = 3;
                break;
            case "PARK":
            case 4:
                message.type = 4;
                break;
            case "WATER":
            case 5:
                message.type = 5;
                break;
            }
            if (object.boundary) {
                if (!Array.isArray(object.boundary))
                    throw TypeError(".urbansynth.Zone.boundary: array expected");
                message.boundary = [];
                for (let i = 0; i < object.boundary.length; ++i) {
                    if (typeof object.boundary[i] !== "object")
                        throw TypeError(".urbansynth.Zone.boundary: object expected");
                    message.boundary[i] = $root.urbansynth.Point2D.fromObject(object.boundary[i]);
                }
            }
            if (object.density != null)
                message.density = Number(object.density);
            if (object.properties != null) {
                if (typeof object.properties !== "object")
                    throw TypeError(".urbansynth.Zone.properties: object expected");
                message.properties = $root.urbansynth.ZoneProperties.fromObject(object.properties);
            }
            return message;
        };

        /**
         * Creates a plain object from a Zone message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.Zone
         * @static
         * @param {urbansynth.Zone} message Zone
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Zone.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.boundary = [];
            if (options.defaults) {
                object.id = "";
                object.type = options.enums === String ? "RESIDENTIAL" : 0;
                object.density = 0;
                object.properties = null;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.urbansynth.ZoneType[message.type] === undefined ? message.type : $root.urbansynth.ZoneType[message.type] : message.type;
            if (message.boundary && message.boundary.length) {
                object.boundary = [];
                for (let j = 0; j < message.boundary.length; ++j)
                    object.boundary[j] = $root.urbansynth.Point2D.toObject(message.boundary[j], options);
            }
            if (message.density != null && message.hasOwnProperty("density"))
                object.density = options.json && !isFinite(message.density) ? String(message.density) : message.density;
            if (message.properties != null && message.hasOwnProperty("properties"))
                object.properties = $root.urbansynth.ZoneProperties.toObject(message.properties, options);
            return object;
        };

        /**
         * Converts this Zone to JSON.
         * @function toJSON
         * @memberof urbansynth.Zone
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Zone.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Zone
         * @function getTypeUrl
         * @memberof urbansynth.Zone
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Zone.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.Zone";
        };

        return Zone;
    })();

    urbansynth.Road = (function() {

        /**
         * Properties of a Road.
         * @memberof urbansynth
         * @interface IRoad
         * @property {string|null} [id] Road id
         * @property {urbansynth.RoadType|null} [type] Road type
         * @property {Array.<urbansynth.IPoint2D>|null} [path] Road path
         * @property {number|null} [width] Road width
         * @property {number|null} [lanes] Road lanes
         * @property {number|null} [speedLimit] Road speedLimit
         */

        /**
         * Constructs a new Road.
         * @memberof urbansynth
         * @classdesc Represents a Road.
         * @implements IRoad
         * @constructor
         * @param {urbansynth.IRoad=} [properties] Properties to set
         */
        function Road(properties) {
            this.path = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Road id.
         * @member {string} id
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.id = "";

        /**
         * Road type.
         * @member {urbansynth.RoadType} type
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.type = 0;

        /**
         * Road path.
         * @member {Array.<urbansynth.IPoint2D>} path
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.path = $util.emptyArray;

        /**
         * Road width.
         * @member {number} width
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.width = 0;

        /**
         * Road lanes.
         * @member {number} lanes
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.lanes = 0;

        /**
         * Road speedLimit.
         * @member {number} speedLimit
         * @memberof urbansynth.Road
         * @instance
         */
        Road.prototype.speedLimit = 0;

        /**
         * Creates a new Road instance using the specified properties.
         * @function create
         * @memberof urbansynth.Road
         * @static
         * @param {urbansynth.IRoad=} [properties] Properties to set
         * @returns {urbansynth.Road} Road instance
         */
        Road.create = function create(properties) {
            return new Road(properties);
        };

        /**
         * Encodes the specified Road message. Does not implicitly {@link urbansynth.Road.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.Road
         * @static
         * @param {urbansynth.IRoad} message Road message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Road.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.path != null && message.path.length)
                for (let i = 0; i < message.path.length; ++i)
                    $root.urbansynth.Point2D.encode(message.path[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.width != null && Object.hasOwnProperty.call(message, "width"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.width);
            if (message.lanes != null && Object.hasOwnProperty.call(message, "lanes"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.lanes);
            if (message.speedLimit != null && Object.hasOwnProperty.call(message, "speedLimit"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.speedLimit);
            return writer;
        };

        /**
         * Encodes the specified Road message, length delimited. Does not implicitly {@link urbansynth.Road.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.Road
         * @static
         * @param {urbansynth.IRoad} message Road message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Road.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Road message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.Road
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.Road} Road
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Road.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.Road();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.type = reader.int32();
                        break;
                    }
                case 3: {
                        if (!(message.path && message.path.length))
                            message.path = [];
                        message.path.push($root.urbansynth.Point2D.decode(reader, reader.uint32()));
                        break;
                    }
                case 4: {
                        message.width = reader.float();
                        break;
                    }
                case 5: {
                        message.lanes = reader.int32();
                        break;
                    }
                case 6: {
                        message.speedLimit = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Road message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.Road
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.Road} Road
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Road.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Road message.
         * @function verify
         * @memberof urbansynth.Road
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Road.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            if (message.path != null && message.hasOwnProperty("path")) {
                if (!Array.isArray(message.path))
                    return "path: array expected";
                for (let i = 0; i < message.path.length; ++i) {
                    let error = $root.urbansynth.Point2D.verify(message.path[i]);
                    if (error)
                        return "path." + error;
                }
            }
            if (message.width != null && message.hasOwnProperty("width"))
                if (typeof message.width !== "number")
                    return "width: number expected";
            if (message.lanes != null && message.hasOwnProperty("lanes"))
                if (!$util.isInteger(message.lanes))
                    return "lanes: integer expected";
            if (message.speedLimit != null && message.hasOwnProperty("speedLimit"))
                if (typeof message.speedLimit !== "number")
                    return "speedLimit: number expected";
            return null;
        };

        /**
         * Creates a Road message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.Road
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.Road} Road
         */
        Road.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.Road)
                return object;
            let message = new $root.urbansynth.Road();
            if (object.id != null)
                message.id = String(object.id);
            switch (object.type) {
            default:
                if (typeof object.type === "number") {
                    message.type = object.type;
                    break;
                }
                break;
            case "HIGHWAY":
            case 0:
                message.type = 0;
                break;
            case "ARTERIAL":
            case 1:
                message.type = 1;
                break;
            case "COLLECTOR":
            case 2:
                message.type = 2;
                break;
            case "LOCAL":
            case 3:
                message.type = 3;
                break;
            }
            if (object.path) {
                if (!Array.isArray(object.path))
                    throw TypeError(".urbansynth.Road.path: array expected");
                message.path = [];
                for (let i = 0; i < object.path.length; ++i) {
                    if (typeof object.path[i] !== "object")
                        throw TypeError(".urbansynth.Road.path: object expected");
                    message.path[i] = $root.urbansynth.Point2D.fromObject(object.path[i]);
                }
            }
            if (object.width != null)
                message.width = Number(object.width);
            if (object.lanes != null)
                message.lanes = object.lanes | 0;
            if (object.speedLimit != null)
                message.speedLimit = Number(object.speedLimit);
            return message;
        };

        /**
         * Creates a plain object from a Road message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.Road
         * @static
         * @param {urbansynth.Road} message Road
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Road.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.path = [];
            if (options.defaults) {
                object.id = "";
                object.type = options.enums === String ? "HIGHWAY" : 0;
                object.width = 0;
                object.lanes = 0;
                object.speedLimit = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.urbansynth.RoadType[message.type] === undefined ? message.type : $root.urbansynth.RoadType[message.type] : message.type;
            if (message.path && message.path.length) {
                object.path = [];
                for (let j = 0; j < message.path.length; ++j)
                    object.path[j] = $root.urbansynth.Point2D.toObject(message.path[j], options);
            }
            if (message.width != null && message.hasOwnProperty("width"))
                object.width = options.json && !isFinite(message.width) ? String(message.width) : message.width;
            if (message.lanes != null && message.hasOwnProperty("lanes"))
                object.lanes = message.lanes;
            if (message.speedLimit != null && message.hasOwnProperty("speedLimit"))
                object.speedLimit = options.json && !isFinite(message.speedLimit) ? String(message.speedLimit) : message.speedLimit;
            return object;
        };

        /**
         * Converts this Road to JSON.
         * @function toJSON
         * @memberof urbansynth.Road
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Road.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Road
         * @function getTypeUrl
         * @memberof urbansynth.Road
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Road.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.Road";
        };

        return Road;
    })();

    urbansynth.POI = (function() {

        /**
         * Properties of a POI.
         * @memberof urbansynth
         * @interface IPOI
         * @property {string|null} [id] POI id
         * @property {urbansynth.POIType|null} [type] POI type
         * @property {urbansynth.IPoint2D|null} [position] POI position
         * @property {string|null} [zoneId] POI zoneId
         * @property {number|null} [capacity] POI capacity
         * @property {urbansynth.IPOIProperties|null} [properties] POI properties
         */

        /**
         * Constructs a new POI.
         * @memberof urbansynth
         * @classdesc Represents a POI.
         * @implements IPOI
         * @constructor
         * @param {urbansynth.IPOI=} [properties] Properties to set
         */
        function POI(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * POI id.
         * @member {string} id
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.id = "";

        /**
         * POI type.
         * @member {urbansynth.POIType} type
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.type = 0;

        /**
         * POI position.
         * @member {urbansynth.IPoint2D|null|undefined} position
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.position = null;

        /**
         * POI zoneId.
         * @member {string} zoneId
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.zoneId = "";

        /**
         * POI capacity.
         * @member {number} capacity
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.capacity = 0;

        /**
         * POI properties.
         * @member {urbansynth.IPOIProperties|null|undefined} properties
         * @memberof urbansynth.POI
         * @instance
         */
        POI.prototype.properties = null;

        /**
         * Creates a new POI instance using the specified properties.
         * @function create
         * @memberof urbansynth.POI
         * @static
         * @param {urbansynth.IPOI=} [properties] Properties to set
         * @returns {urbansynth.POI} POI instance
         */
        POI.create = function create(properties) {
            return new POI(properties);
        };

        /**
         * Encodes the specified POI message. Does not implicitly {@link urbansynth.POI.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.POI
         * @static
         * @param {urbansynth.IPOI} message POI message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        POI.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.position != null && Object.hasOwnProperty.call(message, "position"))
                $root.urbansynth.Point2D.encode(message.position, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.zoneId != null && Object.hasOwnProperty.call(message, "zoneId"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.zoneId);
            if (message.capacity != null && Object.hasOwnProperty.call(message, "capacity"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.capacity);
            if (message.properties != null && Object.hasOwnProperty.call(message, "properties"))
                $root.urbansynth.POIProperties.encode(message.properties, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified POI message, length delimited. Does not implicitly {@link urbansynth.POI.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.POI
         * @static
         * @param {urbansynth.IPOI} message POI message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        POI.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a POI message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.POI
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.POI} POI
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        POI.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.POI();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.type = reader.int32();
                        break;
                    }
                case 3: {
                        message.position = $root.urbansynth.Point2D.decode(reader, reader.uint32());
                        break;
                    }
                case 4: {
                        message.zoneId = reader.string();
                        break;
                    }
                case 5: {
                        message.capacity = reader.int32();
                        break;
                    }
                case 6: {
                        message.properties = $root.urbansynth.POIProperties.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a POI message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.POI
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.POI} POI
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        POI.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a POI message.
         * @function verify
         * @memberof urbansynth.POI
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        POI.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    break;
                }
            if (message.position != null && message.hasOwnProperty("position")) {
                let error = $root.urbansynth.Point2D.verify(message.position);
                if (error)
                    return "position." + error;
            }
            if (message.zoneId != null && message.hasOwnProperty("zoneId"))
                if (!$util.isString(message.zoneId))
                    return "zoneId: string expected";
            if (message.capacity != null && message.hasOwnProperty("capacity"))
                if (!$util.isInteger(message.capacity))
                    return "capacity: integer expected";
            if (message.properties != null && message.hasOwnProperty("properties")) {
                let error = $root.urbansynth.POIProperties.verify(message.properties);
                if (error)
                    return "properties." + error;
            }
            return null;
        };

        /**
         * Creates a POI message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.POI
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.POI} POI
         */
        POI.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.POI)
                return object;
            let message = new $root.urbansynth.POI();
            if (object.id != null)
                message.id = String(object.id);
            switch (object.type) {
            default:
                if (typeof object.type === "number") {
                    message.type = object.type;
                    break;
                }
                break;
            case "HOME":
            case 0:
                message.type = 0;
                break;
            case "OFFICE":
            case 1:
                message.type = 1;
                break;
            case "SHOP":
            case 2:
                message.type = 2;
                break;
            case "RESTAURANT":
            case 3:
                message.type = 3;
                break;
            case "SCHOOL":
            case 4:
                message.type = 4;
                break;
            case "HOSPITAL":
            case 5:
                message.type = 5;
                break;
            case "PARK_POI":
            case 6:
                message.type = 6;
                break;
            case "FACTORY":
            case 7:
                message.type = 7;
                break;
            }
            if (object.position != null) {
                if (typeof object.position !== "object")
                    throw TypeError(".urbansynth.POI.position: object expected");
                message.position = $root.urbansynth.Point2D.fromObject(object.position);
            }
            if (object.zoneId != null)
                message.zoneId = String(object.zoneId);
            if (object.capacity != null)
                message.capacity = object.capacity | 0;
            if (object.properties != null) {
                if (typeof object.properties !== "object")
                    throw TypeError(".urbansynth.POI.properties: object expected");
                message.properties = $root.urbansynth.POIProperties.fromObject(object.properties);
            }
            return message;
        };

        /**
         * Creates a plain object from a POI message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.POI
         * @static
         * @param {urbansynth.POI} message POI
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        POI.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = "";
                object.type = options.enums === String ? "HOME" : 0;
                object.position = null;
                object.zoneId = "";
                object.capacity = 0;
                object.properties = null;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.urbansynth.POIType[message.type] === undefined ? message.type : $root.urbansynth.POIType[message.type] : message.type;
            if (message.position != null && message.hasOwnProperty("position"))
                object.position = $root.urbansynth.Point2D.toObject(message.position, options);
            if (message.zoneId != null && message.hasOwnProperty("zoneId"))
                object.zoneId = message.zoneId;
            if (message.capacity != null && message.hasOwnProperty("capacity"))
                object.capacity = message.capacity;
            if (message.properties != null && message.hasOwnProperty("properties"))
                object.properties = $root.urbansynth.POIProperties.toObject(message.properties, options);
            return object;
        };

        /**
         * Converts this POI to JSON.
         * @function toJSON
         * @memberof urbansynth.POI
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        POI.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for POI
         * @function getTypeUrl
         * @memberof urbansynth.POI
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        POI.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.POI";
        };

        return POI;
    })();

    urbansynth.Building = (function() {

        /**
         * Properties of a Building.
         * @memberof urbansynth
         * @interface IBuilding
         * @property {string|null} [id] Building id
         * @property {Array.<urbansynth.IPoint2D>|null} [footprint] Building footprint
         * @property {number|null} [height] Building height
         * @property {string|null} [zoneId] Building zoneId
         * @property {urbansynth.BuildingType|null} [type] Building type
         */

        /**
         * Constructs a new Building.
         * @memberof urbansynth
         * @classdesc Represents a Building.
         * @implements IBuilding
         * @constructor
         * @param {urbansynth.IBuilding=} [properties] Properties to set
         */
        function Building(properties) {
            this.footprint = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Building id.
         * @member {string} id
         * @memberof urbansynth.Building
         * @instance
         */
        Building.prototype.id = "";

        /**
         * Building footprint.
         * @member {Array.<urbansynth.IPoint2D>} footprint
         * @memberof urbansynth.Building
         * @instance
         */
        Building.prototype.footprint = $util.emptyArray;

        /**
         * Building height.
         * @member {number} height
         * @memberof urbansynth.Building
         * @instance
         */
        Building.prototype.height = 0;

        /**
         * Building zoneId.
         * @member {string} zoneId
         * @memberof urbansynth.Building
         * @instance
         */
        Building.prototype.zoneId = "";

        /**
         * Building type.
         * @member {urbansynth.BuildingType} type
         * @memberof urbansynth.Building
         * @instance
         */
        Building.prototype.type = 0;

        /**
         * Creates a new Building instance using the specified properties.
         * @function create
         * @memberof urbansynth.Building
         * @static
         * @param {urbansynth.IBuilding=} [properties] Properties to set
         * @returns {urbansynth.Building} Building instance
         */
        Building.create = function create(properties) {
            return new Building(properties);
        };

        /**
         * Encodes the specified Building message. Does not implicitly {@link urbansynth.Building.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.Building
         * @static
         * @param {urbansynth.IBuilding} message Building message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Building.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.footprint != null && message.footprint.length)
                for (let i = 0; i < message.footprint.length; ++i)
                    $root.urbansynth.Point2D.encode(message.footprint[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.height);
            if (message.zoneId != null && Object.hasOwnProperty.call(message, "zoneId"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.zoneId);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified Building message, length delimited. Does not implicitly {@link urbansynth.Building.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.Building
         * @static
         * @param {urbansynth.IBuilding} message Building message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Building.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Building message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.Building
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.Building} Building
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Building.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.Building();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        if (!(message.footprint && message.footprint.length))
                            message.footprint = [];
                        message.footprint.push($root.urbansynth.Point2D.decode(reader, reader.uint32()));
                        break;
                    }
                case 3: {
                        message.height = reader.float();
                        break;
                    }
                case 4: {
                        message.zoneId = reader.string();
                        break;
                    }
                case 5: {
                        message.type = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Building message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.Building
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.Building} Building
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Building.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Building message.
         * @function verify
         * @memberof urbansynth.Building
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Building.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.footprint != null && message.hasOwnProperty("footprint")) {
                if (!Array.isArray(message.footprint))
                    return "footprint: array expected";
                for (let i = 0; i < message.footprint.length; ++i) {
                    let error = $root.urbansynth.Point2D.verify(message.footprint[i]);
                    if (error)
                        return "footprint." + error;
                }
            }
            if (message.height != null && message.hasOwnProperty("height"))
                if (typeof message.height !== "number")
                    return "height: number expected";
            if (message.zoneId != null && message.hasOwnProperty("zoneId"))
                if (!$util.isString(message.zoneId))
                    return "zoneId: string expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            return null;
        };

        /**
         * Creates a Building message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.Building
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.Building} Building
         */
        Building.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.Building)
                return object;
            let message = new $root.urbansynth.Building();
            if (object.id != null)
                message.id = String(object.id);
            if (object.footprint) {
                if (!Array.isArray(object.footprint))
                    throw TypeError(".urbansynth.Building.footprint: array expected");
                message.footprint = [];
                for (let i = 0; i < object.footprint.length; ++i) {
                    if (typeof object.footprint[i] !== "object")
                        throw TypeError(".urbansynth.Building.footprint: object expected");
                    message.footprint[i] = $root.urbansynth.Point2D.fromObject(object.footprint[i]);
                }
            }
            if (object.height != null)
                message.height = Number(object.height);
            if (object.zoneId != null)
                message.zoneId = String(object.zoneId);
            switch (object.type) {
            default:
                if (typeof object.type === "number") {
                    message.type = object.type;
                    break;
                }
                break;
            case "HOUSE":
            case 0:
                message.type = 0;
                break;
            case "APARTMENT":
            case 1:
                message.type = 1;
                break;
            case "OFFICE_BUILDING":
            case 2:
                message.type = 2;
                break;
            case "STORE":
            case 3:
                message.type = 3;
                break;
            case "WAREHOUSE":
            case 4:
                message.type = 4;
                break;
            }
            return message;
        };

        /**
         * Creates a plain object from a Building message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.Building
         * @static
         * @param {urbansynth.Building} message Building
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Building.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.footprint = [];
            if (options.defaults) {
                object.id = "";
                object.height = 0;
                object.zoneId = "";
                object.type = options.enums === String ? "HOUSE" : 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.footprint && message.footprint.length) {
                object.footprint = [];
                for (let j = 0; j < message.footprint.length; ++j)
                    object.footprint[j] = $root.urbansynth.Point2D.toObject(message.footprint[j], options);
            }
            if (message.height != null && message.hasOwnProperty("height"))
                object.height = options.json && !isFinite(message.height) ? String(message.height) : message.height;
            if (message.zoneId != null && message.hasOwnProperty("zoneId"))
                object.zoneId = message.zoneId;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.urbansynth.BuildingType[message.type] === undefined ? message.type : $root.urbansynth.BuildingType[message.type] : message.type;
            return object;
        };

        /**
         * Converts this Building to JSON.
         * @function toJSON
         * @memberof urbansynth.Building
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Building.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Building
         * @function getTypeUrl
         * @memberof urbansynth.Building
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Building.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.Building";
        };

        return Building;
    })();

    urbansynth.Point2D = (function() {

        /**
         * Properties of a Point2D.
         * @memberof urbansynth
         * @interface IPoint2D
         * @property {number|null} [x] Point2D x
         * @property {number|null} [y] Point2D y
         */

        /**
         * Constructs a new Point2D.
         * @memberof urbansynth
         * @classdesc Represents a Point2D.
         * @implements IPoint2D
         * @constructor
         * @param {urbansynth.IPoint2D=} [properties] Properties to set
         */
        function Point2D(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Point2D x.
         * @member {number} x
         * @memberof urbansynth.Point2D
         * @instance
         */
        Point2D.prototype.x = 0;

        /**
         * Point2D y.
         * @member {number} y
         * @memberof urbansynth.Point2D
         * @instance
         */
        Point2D.prototype.y = 0;

        /**
         * Creates a new Point2D instance using the specified properties.
         * @function create
         * @memberof urbansynth.Point2D
         * @static
         * @param {urbansynth.IPoint2D=} [properties] Properties to set
         * @returns {urbansynth.Point2D} Point2D instance
         */
        Point2D.create = function create(properties) {
            return new Point2D(properties);
        };

        /**
         * Encodes the specified Point2D message. Does not implicitly {@link urbansynth.Point2D.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.Point2D
         * @static
         * @param {urbansynth.IPoint2D} message Point2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Point2D.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.x);
            if (message.y != null && Object.hasOwnProperty.call(message, "y"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.y);
            return writer;
        };

        /**
         * Encodes the specified Point2D message, length delimited. Does not implicitly {@link urbansynth.Point2D.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.Point2D
         * @static
         * @param {urbansynth.IPoint2D} message Point2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Point2D.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Point2D message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.Point2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.Point2D} Point2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Point2D.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.Point2D();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.x = reader.float();
                        break;
                    }
                case 2: {
                        message.y = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Point2D message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.Point2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.Point2D} Point2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Point2D.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Point2D message.
         * @function verify
         * @memberof urbansynth.Point2D
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Point2D.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            return null;
        };

        /**
         * Creates a Point2D message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.Point2D
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.Point2D} Point2D
         */
        Point2D.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.Point2D)
                return object;
            let message = new $root.urbansynth.Point2D();
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            return message;
        };

        /**
         * Creates a plain object from a Point2D message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.Point2D
         * @static
         * @param {urbansynth.Point2D} message Point2D
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Point2D.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.x = 0;
                object.y = 0;
            }
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            return object;
        };

        /**
         * Converts this Point2D to JSON.
         * @function toJSON
         * @memberof urbansynth.Point2D
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Point2D.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Point2D
         * @function getTypeUrl
         * @memberof urbansynth.Point2D
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Point2D.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.Point2D";
        };

        return Point2D;
    })();

    urbansynth.ZoneProperties = (function() {

        /**
         * Properties of a ZoneProperties.
         * @memberof urbansynth
         * @interface IZoneProperties
         * @property {number|null} [residentialDensity] ZoneProperties residentialDensity
         * @property {number|null} [commercialDensity] ZoneProperties commercialDensity
         * @property {number|null} [officeDensity] ZoneProperties officeDensity
         */

        /**
         * Constructs a new ZoneProperties.
         * @memberof urbansynth
         * @classdesc Represents a ZoneProperties.
         * @implements IZoneProperties
         * @constructor
         * @param {urbansynth.IZoneProperties=} [properties] Properties to set
         */
        function ZoneProperties(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ZoneProperties residentialDensity.
         * @member {number} residentialDensity
         * @memberof urbansynth.ZoneProperties
         * @instance
         */
        ZoneProperties.prototype.residentialDensity = 0;

        /**
         * ZoneProperties commercialDensity.
         * @member {number} commercialDensity
         * @memberof urbansynth.ZoneProperties
         * @instance
         */
        ZoneProperties.prototype.commercialDensity = 0;

        /**
         * ZoneProperties officeDensity.
         * @member {number} officeDensity
         * @memberof urbansynth.ZoneProperties
         * @instance
         */
        ZoneProperties.prototype.officeDensity = 0;

        /**
         * Creates a new ZoneProperties instance using the specified properties.
         * @function create
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {urbansynth.IZoneProperties=} [properties] Properties to set
         * @returns {urbansynth.ZoneProperties} ZoneProperties instance
         */
        ZoneProperties.create = function create(properties) {
            return new ZoneProperties(properties);
        };

        /**
         * Encodes the specified ZoneProperties message. Does not implicitly {@link urbansynth.ZoneProperties.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {urbansynth.IZoneProperties} message ZoneProperties message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ZoneProperties.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.residentialDensity != null && Object.hasOwnProperty.call(message, "residentialDensity"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.residentialDensity);
            if (message.commercialDensity != null && Object.hasOwnProperty.call(message, "commercialDensity"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.commercialDensity);
            if (message.officeDensity != null && Object.hasOwnProperty.call(message, "officeDensity"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.officeDensity);
            return writer;
        };

        /**
         * Encodes the specified ZoneProperties message, length delimited. Does not implicitly {@link urbansynth.ZoneProperties.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {urbansynth.IZoneProperties} message ZoneProperties message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ZoneProperties.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ZoneProperties message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.ZoneProperties} ZoneProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ZoneProperties.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.ZoneProperties();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.residentialDensity = reader.float();
                        break;
                    }
                case 2: {
                        message.commercialDensity = reader.float();
                        break;
                    }
                case 3: {
                        message.officeDensity = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ZoneProperties message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.ZoneProperties} ZoneProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ZoneProperties.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ZoneProperties message.
         * @function verify
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ZoneProperties.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.residentialDensity != null && message.hasOwnProperty("residentialDensity"))
                if (typeof message.residentialDensity !== "number")
                    return "residentialDensity: number expected";
            if (message.commercialDensity != null && message.hasOwnProperty("commercialDensity"))
                if (typeof message.commercialDensity !== "number")
                    return "commercialDensity: number expected";
            if (message.officeDensity != null && message.hasOwnProperty("officeDensity"))
                if (typeof message.officeDensity !== "number")
                    return "officeDensity: number expected";
            return null;
        };

        /**
         * Creates a ZoneProperties message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.ZoneProperties} ZoneProperties
         */
        ZoneProperties.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.ZoneProperties)
                return object;
            let message = new $root.urbansynth.ZoneProperties();
            if (object.residentialDensity != null)
                message.residentialDensity = Number(object.residentialDensity);
            if (object.commercialDensity != null)
                message.commercialDensity = Number(object.commercialDensity);
            if (object.officeDensity != null)
                message.officeDensity = Number(object.officeDensity);
            return message;
        };

        /**
         * Creates a plain object from a ZoneProperties message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {urbansynth.ZoneProperties} message ZoneProperties
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ZoneProperties.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.residentialDensity = 0;
                object.commercialDensity = 0;
                object.officeDensity = 0;
            }
            if (message.residentialDensity != null && message.hasOwnProperty("residentialDensity"))
                object.residentialDensity = options.json && !isFinite(message.residentialDensity) ? String(message.residentialDensity) : message.residentialDensity;
            if (message.commercialDensity != null && message.hasOwnProperty("commercialDensity"))
                object.commercialDensity = options.json && !isFinite(message.commercialDensity) ? String(message.commercialDensity) : message.commercialDensity;
            if (message.officeDensity != null && message.hasOwnProperty("officeDensity"))
                object.officeDensity = options.json && !isFinite(message.officeDensity) ? String(message.officeDensity) : message.officeDensity;
            return object;
        };

        /**
         * Converts this ZoneProperties to JSON.
         * @function toJSON
         * @memberof urbansynth.ZoneProperties
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ZoneProperties.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ZoneProperties
         * @function getTypeUrl
         * @memberof urbansynth.ZoneProperties
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ZoneProperties.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.ZoneProperties";
        };

        return ZoneProperties;
    })();

    urbansynth.POIProperties = (function() {

        /**
         * Properties of a POIProperties.
         * @memberof urbansynth
         * @interface IPOIProperties
         * @property {string|null} [name] POIProperties name
         * @property {Array.<string>|null} [tags] POIProperties tags
         */

        /**
         * Constructs a new POIProperties.
         * @memberof urbansynth
         * @classdesc Represents a POIProperties.
         * @implements IPOIProperties
         * @constructor
         * @param {urbansynth.IPOIProperties=} [properties] Properties to set
         */
        function POIProperties(properties) {
            this.tags = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * POIProperties name.
         * @member {string} name
         * @memberof urbansynth.POIProperties
         * @instance
         */
        POIProperties.prototype.name = "";

        /**
         * POIProperties tags.
         * @member {Array.<string>} tags
         * @memberof urbansynth.POIProperties
         * @instance
         */
        POIProperties.prototype.tags = $util.emptyArray;

        /**
         * Creates a new POIProperties instance using the specified properties.
         * @function create
         * @memberof urbansynth.POIProperties
         * @static
         * @param {urbansynth.IPOIProperties=} [properties] Properties to set
         * @returns {urbansynth.POIProperties} POIProperties instance
         */
        POIProperties.create = function create(properties) {
            return new POIProperties(properties);
        };

        /**
         * Encodes the specified POIProperties message. Does not implicitly {@link urbansynth.POIProperties.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.POIProperties
         * @static
         * @param {urbansynth.IPOIProperties} message POIProperties message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        POIProperties.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.tags != null && message.tags.length)
                for (let i = 0; i < message.tags.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.tags[i]);
            return writer;
        };

        /**
         * Encodes the specified POIProperties message, length delimited. Does not implicitly {@link urbansynth.POIProperties.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.POIProperties
         * @static
         * @param {urbansynth.IPOIProperties} message POIProperties message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        POIProperties.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a POIProperties message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.POIProperties
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.POIProperties} POIProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        POIProperties.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.POIProperties();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.name = reader.string();
                        break;
                    }
                case 2: {
                        if (!(message.tags && message.tags.length))
                            message.tags = [];
                        message.tags.push(reader.string());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a POIProperties message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.POIProperties
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.POIProperties} POIProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        POIProperties.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a POIProperties message.
         * @function verify
         * @memberof urbansynth.POIProperties
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        POIProperties.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.tags != null && message.hasOwnProperty("tags")) {
                if (!Array.isArray(message.tags))
                    return "tags: array expected";
                for (let i = 0; i < message.tags.length; ++i)
                    if (!$util.isString(message.tags[i]))
                        return "tags: string[] expected";
            }
            return null;
        };

        /**
         * Creates a POIProperties message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.POIProperties
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.POIProperties} POIProperties
         */
        POIProperties.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.POIProperties)
                return object;
            let message = new $root.urbansynth.POIProperties();
            if (object.name != null)
                message.name = String(object.name);
            if (object.tags) {
                if (!Array.isArray(object.tags))
                    throw TypeError(".urbansynth.POIProperties.tags: array expected");
                message.tags = [];
                for (let i = 0; i < object.tags.length; ++i)
                    message.tags[i] = String(object.tags[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a POIProperties message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.POIProperties
         * @static
         * @param {urbansynth.POIProperties} message POIProperties
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        POIProperties.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.tags = [];
            if (options.defaults)
                object.name = "";
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.tags && message.tags.length) {
                object.tags = [];
                for (let j = 0; j < message.tags.length; ++j)
                    object.tags[j] = message.tags[j];
            }
            return object;
        };

        /**
         * Converts this POIProperties to JSON.
         * @function toJSON
         * @memberof urbansynth.POIProperties
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        POIProperties.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for POIProperties
         * @function getTypeUrl
         * @memberof urbansynth.POIProperties
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        POIProperties.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.POIProperties";
        };

        return POIProperties;
    })();

    urbansynth.CityMetadata = (function() {

        /**
         * Properties of a CityMetadata.
         * @memberof urbansynth
         * @interface ICityMetadata
         * @property {number|Long|null} [generationTimestamp] CityMetadata generationTimestamp
         * @property {string|null} [generationSeed] CityMetadata generationSeed
         * @property {number|null} [totalPopulation] CityMetadata totalPopulation
         * @property {number|null} [totalArea] CityMetadata totalArea
         */

        /**
         * Constructs a new CityMetadata.
         * @memberof urbansynth
         * @classdesc Represents a CityMetadata.
         * @implements ICityMetadata
         * @constructor
         * @param {urbansynth.ICityMetadata=} [properties] Properties to set
         */
        function CityMetadata(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CityMetadata generationTimestamp.
         * @member {number|Long} generationTimestamp
         * @memberof urbansynth.CityMetadata
         * @instance
         */
        CityMetadata.prototype.generationTimestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * CityMetadata generationSeed.
         * @member {string} generationSeed
         * @memberof urbansynth.CityMetadata
         * @instance
         */
        CityMetadata.prototype.generationSeed = "";

        /**
         * CityMetadata totalPopulation.
         * @member {number} totalPopulation
         * @memberof urbansynth.CityMetadata
         * @instance
         */
        CityMetadata.prototype.totalPopulation = 0;

        /**
         * CityMetadata totalArea.
         * @member {number} totalArea
         * @memberof urbansynth.CityMetadata
         * @instance
         */
        CityMetadata.prototype.totalArea = 0;

        /**
         * Creates a new CityMetadata instance using the specified properties.
         * @function create
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {urbansynth.ICityMetadata=} [properties] Properties to set
         * @returns {urbansynth.CityMetadata} CityMetadata instance
         */
        CityMetadata.create = function create(properties) {
            return new CityMetadata(properties);
        };

        /**
         * Encodes the specified CityMetadata message. Does not implicitly {@link urbansynth.CityMetadata.verify|verify} messages.
         * @function encode
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {urbansynth.ICityMetadata} message CityMetadata message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CityMetadata.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.generationTimestamp != null && Object.hasOwnProperty.call(message, "generationTimestamp"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.generationTimestamp);
            if (message.generationSeed != null && Object.hasOwnProperty.call(message, "generationSeed"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.generationSeed);
            if (message.totalPopulation != null && Object.hasOwnProperty.call(message, "totalPopulation"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.totalPopulation);
            if (message.totalArea != null && Object.hasOwnProperty.call(message, "totalArea"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.totalArea);
            return writer;
        };

        /**
         * Encodes the specified CityMetadata message, length delimited. Does not implicitly {@link urbansynth.CityMetadata.verify|verify} messages.
         * @function encodeDelimited
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {urbansynth.ICityMetadata} message CityMetadata message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CityMetadata.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CityMetadata message from the specified reader or buffer.
         * @function decode
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {urbansynth.CityMetadata} CityMetadata
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CityMetadata.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.urbansynth.CityMetadata();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.generationTimestamp = reader.int64();
                        break;
                    }
                case 2: {
                        message.generationSeed = reader.string();
                        break;
                    }
                case 3: {
                        message.totalPopulation = reader.int32();
                        break;
                    }
                case 4: {
                        message.totalArea = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CityMetadata message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {urbansynth.CityMetadata} CityMetadata
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CityMetadata.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CityMetadata message.
         * @function verify
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CityMetadata.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.generationTimestamp != null && message.hasOwnProperty("generationTimestamp"))
                if (!$util.isInteger(message.generationTimestamp) && !(message.generationTimestamp && $util.isInteger(message.generationTimestamp.low) && $util.isInteger(message.generationTimestamp.high)))
                    return "generationTimestamp: integer|Long expected";
            if (message.generationSeed != null && message.hasOwnProperty("generationSeed"))
                if (!$util.isString(message.generationSeed))
                    return "generationSeed: string expected";
            if (message.totalPopulation != null && message.hasOwnProperty("totalPopulation"))
                if (!$util.isInteger(message.totalPopulation))
                    return "totalPopulation: integer expected";
            if (message.totalArea != null && message.hasOwnProperty("totalArea"))
                if (typeof message.totalArea !== "number")
                    return "totalArea: number expected";
            return null;
        };

        /**
         * Creates a CityMetadata message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {urbansynth.CityMetadata} CityMetadata
         */
        CityMetadata.fromObject = function fromObject(object) {
            if (object instanceof $root.urbansynth.CityMetadata)
                return object;
            let message = new $root.urbansynth.CityMetadata();
            if (object.generationTimestamp != null)
                if ($util.Long)
                    (message.generationTimestamp = $util.Long.fromValue(object.generationTimestamp)).unsigned = false;
                else if (typeof object.generationTimestamp === "string")
                    message.generationTimestamp = parseInt(object.generationTimestamp, 10);
                else if (typeof object.generationTimestamp === "number")
                    message.generationTimestamp = object.generationTimestamp;
                else if (typeof object.generationTimestamp === "object")
                    message.generationTimestamp = new $util.LongBits(object.generationTimestamp.low >>> 0, object.generationTimestamp.high >>> 0).toNumber();
            if (object.generationSeed != null)
                message.generationSeed = String(object.generationSeed);
            if (object.totalPopulation != null)
                message.totalPopulation = object.totalPopulation | 0;
            if (object.totalArea != null)
                message.totalArea = Number(object.totalArea);
            return message;
        };

        /**
         * Creates a plain object from a CityMetadata message. Also converts values to other types if specified.
         * @function toObject
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {urbansynth.CityMetadata} message CityMetadata
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CityMetadata.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.generationTimestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.generationTimestamp = options.longs === String ? "0" : 0;
                object.generationSeed = "";
                object.totalPopulation = 0;
                object.totalArea = 0;
            }
            if (message.generationTimestamp != null && message.hasOwnProperty("generationTimestamp"))
                if (typeof message.generationTimestamp === "number")
                    object.generationTimestamp = options.longs === String ? String(message.generationTimestamp) : message.generationTimestamp;
                else
                    object.generationTimestamp = options.longs === String ? $util.Long.prototype.toString.call(message.generationTimestamp) : options.longs === Number ? new $util.LongBits(message.generationTimestamp.low >>> 0, message.generationTimestamp.high >>> 0).toNumber() : message.generationTimestamp;
            if (message.generationSeed != null && message.hasOwnProperty("generationSeed"))
                object.generationSeed = message.generationSeed;
            if (message.totalPopulation != null && message.hasOwnProperty("totalPopulation"))
                object.totalPopulation = message.totalPopulation;
            if (message.totalArea != null && message.hasOwnProperty("totalArea"))
                object.totalArea = options.json && !isFinite(message.totalArea) ? String(message.totalArea) : message.totalArea;
            return object;
        };

        /**
         * Converts this CityMetadata to JSON.
         * @function toJSON
         * @memberof urbansynth.CityMetadata
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CityMetadata.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for CityMetadata
         * @function getTypeUrl
         * @memberof urbansynth.CityMetadata
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        CityMetadata.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/urbansynth.CityMetadata";
        };

        return CityMetadata;
    })();

    /**
     * ZoneType enum.
     * @name urbansynth.ZoneType
     * @enum {number}
     * @property {number} RESIDENTIAL=0 RESIDENTIAL value
     * @property {number} COMMERCIAL=1 COMMERCIAL value
     * @property {number} INDUSTRIAL=2 INDUSTRIAL value
     * @property {number} DOWNTOWN=3 DOWNTOWN value
     * @property {number} PARK=4 PARK value
     * @property {number} WATER=5 WATER value
     */
    urbansynth.ZoneType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "RESIDENTIAL"] = 0;
        values[valuesById[1] = "COMMERCIAL"] = 1;
        values[valuesById[2] = "INDUSTRIAL"] = 2;
        values[valuesById[3] = "DOWNTOWN"] = 3;
        values[valuesById[4] = "PARK"] = 4;
        values[valuesById[5] = "WATER"] = 5;
        return values;
    })();

    /**
     * RoadType enum.
     * @name urbansynth.RoadType
     * @enum {number}
     * @property {number} HIGHWAY=0 HIGHWAY value
     * @property {number} ARTERIAL=1 ARTERIAL value
     * @property {number} COLLECTOR=2 COLLECTOR value
     * @property {number} LOCAL=3 LOCAL value
     */
    urbansynth.RoadType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "HIGHWAY"] = 0;
        values[valuesById[1] = "ARTERIAL"] = 1;
        values[valuesById[2] = "COLLECTOR"] = 2;
        values[valuesById[3] = "LOCAL"] = 3;
        return values;
    })();

    /**
     * POIType enum.
     * @name urbansynth.POIType
     * @enum {number}
     * @property {number} HOME=0 HOME value
     * @property {number} OFFICE=1 OFFICE value
     * @property {number} SHOP=2 SHOP value
     * @property {number} RESTAURANT=3 RESTAURANT value
     * @property {number} SCHOOL=4 SCHOOL value
     * @property {number} HOSPITAL=5 HOSPITAL value
     * @property {number} PARK_POI=6 PARK_POI value
     * @property {number} FACTORY=7 FACTORY value
     */
    urbansynth.POIType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "HOME"] = 0;
        values[valuesById[1] = "OFFICE"] = 1;
        values[valuesById[2] = "SHOP"] = 2;
        values[valuesById[3] = "RESTAURANT"] = 3;
        values[valuesById[4] = "SCHOOL"] = 4;
        values[valuesById[5] = "HOSPITAL"] = 5;
        values[valuesById[6] = "PARK_POI"] = 6;
        values[valuesById[7] = "FACTORY"] = 7;
        return values;
    })();

    /**
     * BuildingType enum.
     * @name urbansynth.BuildingType
     * @enum {number}
     * @property {number} HOUSE=0 HOUSE value
     * @property {number} APARTMENT=1 APARTMENT value
     * @property {number} OFFICE_BUILDING=2 OFFICE_BUILDING value
     * @property {number} STORE=3 STORE value
     * @property {number} WAREHOUSE=4 WAREHOUSE value
     */
    urbansynth.BuildingType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "HOUSE"] = 0;
        values[valuesById[1] = "APARTMENT"] = 1;
        values[valuesById[2] = "OFFICE_BUILDING"] = 2;
        values[valuesById[3] = "STORE"] = 3;
        values[valuesById[4] = "WAREHOUSE"] = 4;
        return values;
    })();

    return urbansynth;
})();

export { $root as default };
