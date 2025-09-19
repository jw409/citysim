import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace urbansynth. */
export namespace urbansynth {

    /** Properties of a City. */
    interface ICity {

        /** City name */
        name?: (string|null);

        /** City bounds */
        bounds?: (urbansynth.IBoundingBox|null);

        /** City zones */
        zones?: (urbansynth.IZone[]|null);

        /** City roads */
        roads?: (urbansynth.IRoad[]|null);

        /** City pois */
        pois?: (urbansynth.IPOI[]|null);

        /** City buildings */
        buildings?: (urbansynth.IBuilding[]|null);

        /** City metadata */
        metadata?: (urbansynth.ICityMetadata|null);
    }

    /** Represents a City. */
    class City implements ICity {

        /**
         * Constructs a new City.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.ICity);

        /** City name. */
        public name: string;

        /** City bounds. */
        public bounds?: (urbansynth.IBoundingBox|null);

        /** City zones. */
        public zones: urbansynth.IZone[];

        /** City roads. */
        public roads: urbansynth.IRoad[];

        /** City pois. */
        public pois: urbansynth.IPOI[];

        /** City buildings. */
        public buildings: urbansynth.IBuilding[];

        /** City metadata. */
        public metadata?: (urbansynth.ICityMetadata|null);

        /**
         * Creates a new City instance using the specified properties.
         * @param [properties] Properties to set
         * @returns City instance
         */
        public static create(properties?: urbansynth.ICity): urbansynth.City;

        /**
         * Encodes the specified City message. Does not implicitly {@link urbansynth.City.verify|verify} messages.
         * @param message City message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.ICity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified City message, length delimited. Does not implicitly {@link urbansynth.City.verify|verify} messages.
         * @param message City message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.ICity, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a City message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns City
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.City;

        /**
         * Decodes a City message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns City
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.City;

        /**
         * Verifies a City message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a City message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns City
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.City;

        /**
         * Creates a plain object from a City message. Also converts values to other types if specified.
         * @param message City
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.City, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this City to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for City
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a BoundingBox. */
    interface IBoundingBox {

        /** BoundingBox minX */
        minX?: (number|null);

        /** BoundingBox minY */
        minY?: (number|null);

        /** BoundingBox maxX */
        maxX?: (number|null);

        /** BoundingBox maxY */
        maxY?: (number|null);
    }

    /** Represents a BoundingBox. */
    class BoundingBox implements IBoundingBox {

        /**
         * Constructs a new BoundingBox.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IBoundingBox);

        /** BoundingBox minX. */
        public minX: number;

        /** BoundingBox minY. */
        public minY: number;

        /** BoundingBox maxX. */
        public maxX: number;

        /** BoundingBox maxY. */
        public maxY: number;

        /**
         * Creates a new BoundingBox instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BoundingBox instance
         */
        public static create(properties?: urbansynth.IBoundingBox): urbansynth.BoundingBox;

        /**
         * Encodes the specified BoundingBox message. Does not implicitly {@link urbansynth.BoundingBox.verify|verify} messages.
         * @param message BoundingBox message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IBoundingBox, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BoundingBox message, length delimited. Does not implicitly {@link urbansynth.BoundingBox.verify|verify} messages.
         * @param message BoundingBox message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IBoundingBox, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BoundingBox message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.BoundingBox;

        /**
         * Decodes a BoundingBox message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.BoundingBox;

        /**
         * Verifies a BoundingBox message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BoundingBox message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BoundingBox
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.BoundingBox;

        /**
         * Creates a plain object from a BoundingBox message. Also converts values to other types if specified.
         * @param message BoundingBox
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.BoundingBox, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BoundingBox to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for BoundingBox
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Zone. */
    interface IZone {

        /** Zone id */
        id?: (string|null);

        /** Zone type */
        type?: (urbansynth.ZoneType|null);

        /** Zone boundary */
        boundary?: (urbansynth.IPoint2D[]|null);

        /** Zone density */
        density?: (number|null);

        /** Zone properties */
        properties?: (urbansynth.IZoneProperties|null);
    }

    /** Represents a Zone. */
    class Zone implements IZone {

        /**
         * Constructs a new Zone.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IZone);

        /** Zone id. */
        public id: string;

        /** Zone type. */
        public type: urbansynth.ZoneType;

        /** Zone boundary. */
        public boundary: urbansynth.IPoint2D[];

        /** Zone density. */
        public density: number;

        /** Zone properties. */
        public properties?: (urbansynth.IZoneProperties|null);

        /**
         * Creates a new Zone instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Zone instance
         */
        public static create(properties?: urbansynth.IZone): urbansynth.Zone;

        /**
         * Encodes the specified Zone message. Does not implicitly {@link urbansynth.Zone.verify|verify} messages.
         * @param message Zone message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IZone, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Zone message, length delimited. Does not implicitly {@link urbansynth.Zone.verify|verify} messages.
         * @param message Zone message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IZone, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Zone message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Zone
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.Zone;

        /**
         * Decodes a Zone message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Zone
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.Zone;

        /**
         * Verifies a Zone message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Zone message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Zone
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.Zone;

        /**
         * Creates a plain object from a Zone message. Also converts values to other types if specified.
         * @param message Zone
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.Zone, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Zone to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Zone
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Road. */
    interface IRoad {

        /** Road id */
        id?: (string|null);

        /** Road type */
        type?: (urbansynth.RoadType|null);

        /** Road path */
        path?: (urbansynth.IPoint2D[]|null);

        /** Road width */
        width?: (number|null);

        /** Road lanes */
        lanes?: (number|null);

        /** Road speedLimit */
        speedLimit?: (number|null);
    }

    /** Represents a Road. */
    class Road implements IRoad {

        /**
         * Constructs a new Road.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IRoad);

        /** Road id. */
        public id: string;

        /** Road type. */
        public type: urbansynth.RoadType;

        /** Road path. */
        public path: urbansynth.IPoint2D[];

        /** Road width. */
        public width: number;

        /** Road lanes. */
        public lanes: number;

        /** Road speedLimit. */
        public speedLimit: number;

        /**
         * Creates a new Road instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Road instance
         */
        public static create(properties?: urbansynth.IRoad): urbansynth.Road;

        /**
         * Encodes the specified Road message. Does not implicitly {@link urbansynth.Road.verify|verify} messages.
         * @param message Road message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IRoad, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Road message, length delimited. Does not implicitly {@link urbansynth.Road.verify|verify} messages.
         * @param message Road message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IRoad, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Road message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Road
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.Road;

        /**
         * Decodes a Road message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Road
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.Road;

        /**
         * Verifies a Road message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Road message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Road
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.Road;

        /**
         * Creates a plain object from a Road message. Also converts values to other types if specified.
         * @param message Road
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.Road, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Road to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Road
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a POI. */
    interface IPOI {

        /** POI id */
        id?: (string|null);

        /** POI type */
        type?: (urbansynth.POIType|null);

        /** POI position */
        position?: (urbansynth.IPoint2D|null);

        /** POI zoneId */
        zoneId?: (string|null);

        /** POI capacity */
        capacity?: (number|null);

        /** POI properties */
        properties?: (urbansynth.IPOIProperties|null);
    }

    /** Represents a POI. */
    class POI implements IPOI {

        /**
         * Constructs a new POI.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IPOI);

        /** POI id. */
        public id: string;

        /** POI type. */
        public type: urbansynth.POIType;

        /** POI position. */
        public position?: (urbansynth.IPoint2D|null);

        /** POI zoneId. */
        public zoneId: string;

        /** POI capacity. */
        public capacity: number;

        /** POI properties. */
        public properties?: (urbansynth.IPOIProperties|null);

        /**
         * Creates a new POI instance using the specified properties.
         * @param [properties] Properties to set
         * @returns POI instance
         */
        public static create(properties?: urbansynth.IPOI): urbansynth.POI;

        /**
         * Encodes the specified POI message. Does not implicitly {@link urbansynth.POI.verify|verify} messages.
         * @param message POI message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IPOI, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified POI message, length delimited. Does not implicitly {@link urbansynth.POI.verify|verify} messages.
         * @param message POI message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IPOI, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a POI message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns POI
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.POI;

        /**
         * Decodes a POI message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns POI
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.POI;

        /**
         * Verifies a POI message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a POI message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns POI
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.POI;

        /**
         * Creates a plain object from a POI message. Also converts values to other types if specified.
         * @param message POI
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.POI, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this POI to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for POI
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Building. */
    interface IBuilding {

        /** Building id */
        id?: (string|null);

        /** Building footprint */
        footprint?: (urbansynth.IPoint2D[]|null);

        /** Building height */
        height?: (number|null);

        /** Building zoneId */
        zoneId?: (string|null);

        /** Building type */
        type?: (urbansynth.BuildingType|null);
    }

    /** Represents a Building. */
    class Building implements IBuilding {

        /**
         * Constructs a new Building.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IBuilding);

        /** Building id. */
        public id: string;

        /** Building footprint. */
        public footprint: urbansynth.IPoint2D[];

        /** Building height. */
        public height: number;

        /** Building zoneId. */
        public zoneId: string;

        /** Building type. */
        public type: urbansynth.BuildingType;

        /**
         * Creates a new Building instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Building instance
         */
        public static create(properties?: urbansynth.IBuilding): urbansynth.Building;

        /**
         * Encodes the specified Building message. Does not implicitly {@link urbansynth.Building.verify|verify} messages.
         * @param message Building message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IBuilding, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Building message, length delimited. Does not implicitly {@link urbansynth.Building.verify|verify} messages.
         * @param message Building message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IBuilding, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Building message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Building
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.Building;

        /**
         * Decodes a Building message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Building
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.Building;

        /**
         * Verifies a Building message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Building message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Building
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.Building;

        /**
         * Creates a plain object from a Building message. Also converts values to other types if specified.
         * @param message Building
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.Building, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Building to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Building
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Point2D. */
    interface IPoint2D {

        /** Point2D x */
        x?: (number|null);

        /** Point2D y */
        y?: (number|null);
    }

    /** Represents a Point2D. */
    class Point2D implements IPoint2D {

        /**
         * Constructs a new Point2D.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IPoint2D);

        /** Point2D x. */
        public x: number;

        /** Point2D y. */
        public y: number;

        /**
         * Creates a new Point2D instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Point2D instance
         */
        public static create(properties?: urbansynth.IPoint2D): urbansynth.Point2D;

        /**
         * Encodes the specified Point2D message. Does not implicitly {@link urbansynth.Point2D.verify|verify} messages.
         * @param message Point2D message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IPoint2D, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Point2D message, length delimited. Does not implicitly {@link urbansynth.Point2D.verify|verify} messages.
         * @param message Point2D message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IPoint2D, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Point2D message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Point2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.Point2D;

        /**
         * Decodes a Point2D message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Point2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.Point2D;

        /**
         * Verifies a Point2D message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Point2D message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Point2D
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.Point2D;

        /**
         * Creates a plain object from a Point2D message. Also converts values to other types if specified.
         * @param message Point2D
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.Point2D, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Point2D to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Point2D
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ZoneProperties. */
    interface IZoneProperties {

        /** ZoneProperties residentialDensity */
        residentialDensity?: (number|null);

        /** ZoneProperties commercialDensity */
        commercialDensity?: (number|null);

        /** ZoneProperties officeDensity */
        officeDensity?: (number|null);
    }

    /** Represents a ZoneProperties. */
    class ZoneProperties implements IZoneProperties {

        /**
         * Constructs a new ZoneProperties.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IZoneProperties);

        /** ZoneProperties residentialDensity. */
        public residentialDensity: number;

        /** ZoneProperties commercialDensity. */
        public commercialDensity: number;

        /** ZoneProperties officeDensity. */
        public officeDensity: number;

        /**
         * Creates a new ZoneProperties instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ZoneProperties instance
         */
        public static create(properties?: urbansynth.IZoneProperties): urbansynth.ZoneProperties;

        /**
         * Encodes the specified ZoneProperties message. Does not implicitly {@link urbansynth.ZoneProperties.verify|verify} messages.
         * @param message ZoneProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IZoneProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ZoneProperties message, length delimited. Does not implicitly {@link urbansynth.ZoneProperties.verify|verify} messages.
         * @param message ZoneProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IZoneProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ZoneProperties message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ZoneProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.ZoneProperties;

        /**
         * Decodes a ZoneProperties message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ZoneProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.ZoneProperties;

        /**
         * Verifies a ZoneProperties message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ZoneProperties message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ZoneProperties
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.ZoneProperties;

        /**
         * Creates a plain object from a ZoneProperties message. Also converts values to other types if specified.
         * @param message ZoneProperties
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.ZoneProperties, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ZoneProperties to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ZoneProperties
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a POIProperties. */
    interface IPOIProperties {

        /** POIProperties name */
        name?: (string|null);

        /** POIProperties tags */
        tags?: (string[]|null);
    }

    /** Represents a POIProperties. */
    class POIProperties implements IPOIProperties {

        /**
         * Constructs a new POIProperties.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.IPOIProperties);

        /** POIProperties name. */
        public name: string;

        /** POIProperties tags. */
        public tags: string[];

        /**
         * Creates a new POIProperties instance using the specified properties.
         * @param [properties] Properties to set
         * @returns POIProperties instance
         */
        public static create(properties?: urbansynth.IPOIProperties): urbansynth.POIProperties;

        /**
         * Encodes the specified POIProperties message. Does not implicitly {@link urbansynth.POIProperties.verify|verify} messages.
         * @param message POIProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.IPOIProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified POIProperties message, length delimited. Does not implicitly {@link urbansynth.POIProperties.verify|verify} messages.
         * @param message POIProperties message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.IPOIProperties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a POIProperties message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns POIProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.POIProperties;

        /**
         * Decodes a POIProperties message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns POIProperties
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.POIProperties;

        /**
         * Verifies a POIProperties message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a POIProperties message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns POIProperties
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.POIProperties;

        /**
         * Creates a plain object from a POIProperties message. Also converts values to other types if specified.
         * @param message POIProperties
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.POIProperties, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this POIProperties to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for POIProperties
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CityMetadata. */
    interface ICityMetadata {

        /** CityMetadata generationTimestamp */
        generationTimestamp?: (number|Long|null);

        /** CityMetadata generationSeed */
        generationSeed?: (string|null);

        /** CityMetadata totalPopulation */
        totalPopulation?: (number|null);

        /** CityMetadata totalArea */
        totalArea?: (number|null);
    }

    /** Represents a CityMetadata. */
    class CityMetadata implements ICityMetadata {

        /**
         * Constructs a new CityMetadata.
         * @param [properties] Properties to set
         */
        constructor(properties?: urbansynth.ICityMetadata);

        /** CityMetadata generationTimestamp. */
        public generationTimestamp: (number|Long);

        /** CityMetadata generationSeed. */
        public generationSeed: string;

        /** CityMetadata totalPopulation. */
        public totalPopulation: number;

        /** CityMetadata totalArea. */
        public totalArea: number;

        /**
         * Creates a new CityMetadata instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CityMetadata instance
         */
        public static create(properties?: urbansynth.ICityMetadata): urbansynth.CityMetadata;

        /**
         * Encodes the specified CityMetadata message. Does not implicitly {@link urbansynth.CityMetadata.verify|verify} messages.
         * @param message CityMetadata message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: urbansynth.ICityMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CityMetadata message, length delimited. Does not implicitly {@link urbansynth.CityMetadata.verify|verify} messages.
         * @param message CityMetadata message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: urbansynth.ICityMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CityMetadata message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CityMetadata
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): urbansynth.CityMetadata;

        /**
         * Decodes a CityMetadata message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CityMetadata
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): urbansynth.CityMetadata;

        /**
         * Verifies a CityMetadata message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CityMetadata message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CityMetadata
         */
        public static fromObject(object: { [k: string]: any }): urbansynth.CityMetadata;

        /**
         * Creates a plain object from a CityMetadata message. Also converts values to other types if specified.
         * @param message CityMetadata
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: urbansynth.CityMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CityMetadata to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for CityMetadata
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** ZoneType enum. */
    enum ZoneType {
        RESIDENTIAL = 0,
        COMMERCIAL = 1,
        INDUSTRIAL = 2,
        DOWNTOWN = 3,
        PARK = 4,
        WATER = 5
    }

    /** RoadType enum. */
    enum RoadType {
        HIGHWAY = 0,
        ARTERIAL = 1,
        COLLECTOR = 2,
        LOCAL = 3
    }

    /** POIType enum. */
    enum POIType {
        HOME = 0,
        OFFICE = 1,
        SHOP = 2,
        RESTAURANT = 3,
        SCHOOL = 4,
        HOSPITAL = 5,
        PARK_POI = 6,
        FACTORY = 7
    }

    /** BuildingType enum. */
    enum BuildingType {
        HOUSE = 0,
        APARTMENT = 1,
        OFFICE_BUILDING = 2,
        STORE = 3,
        WAREHOUSE = 4
    }
}
