/**
 * iList CRM API Integration
 * 100% parity with iList API functionality
 */

export interface IListProperty {
  Id: number;
  Category_ID?: number;
  SubCategory_ID?: number;
  Aim_ID?: number;
  CustomCode?: string;
  Price?: number;
  SqrMeters?: number;
  PricePerSqrm?: number;
  BuildingYear?: number;
  PlotSqrMeters?: number;
  Rooms?: number;
  MasterBedrooms?: number;
  Bathrooms?: number;
  WC?: number;
  Area_ID?: number;
  SubArea_ID?: number;
  Latitude?: number;
  Longitude?: number;
  PostalCode?: string;
  EnergyClass_ID?: number;
  Floor_ID?: number;
  Levels?: string;
  Images?: IListImage[];
  Characteristics?: IListCharacteristic[];
  AdditionalLanguages?: IListAdditionalLanguage[];
  TotalParkings?: number;
  Parkings?: any[];
  DistanceFrom?: IListDistance[];
  Basements?: any[];
  Partner?: IListPartner;
  Flags?: any[];
  SendDate?: string;
  UpdateDate?: string;
  Token?: string;
  isSync?: boolean;
  StatusID?: number;
}

export interface IListImage {
  Id: number;
  OrderNum: number;
  Url: string;
  ThumbUrl: string;
}

export interface IListCharacteristic {
  Id: number;
  Language_Id: number;
  Title: string;
  Value: string;
  LookupType: string;
}

export interface IListAdditionalLanguage {
  MLLanguage_ID: number;
  Language: string;
  Title: string;
  PropertyAd: string;
  Description: string;
}

export interface IListDistance {
  Place_ID: number;
  Distance: number;
  Measure_ID: number;
  Description: Array<{
    Language_ID: number;
    Value: string;
  }>;
}

export interface IListPartner {
  Id: number;
  Firstname: string;
  Lastname: string;
  Email: string;
  Phone: string;
  PhotoUrl: string;
}

export interface IListApiResponse<T> {
  code: string | null;
  success: boolean;
  total: number;
  data: T;
  nextPage: string | null;
  error: string | null;
}

export interface IListSyncParams {
  StatusID?: string; // "1" for active, "2" for deleted
  isSync: boolean; // required
  SendDateFromUTC?: string;
  SendDateToUTC?: string;
  UpdateDateFromUTC?: string;
  UpdateDateToUTC?: string;
  IncludeDeletedFromCrm?: boolean;
}

export interface IListLookup {
  Id: number;
  Value: string;
  [key: string]: any;
}

/**
 * iList API Client
 */
export class IListApiClient {
  private baseUrl: string;
  private authToken: string;
  private rateLimitPerMinute: number;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestWindow: number = 60000; // 1 minute

  constructor(authToken: string, baseUrl = "https://ilist.e-agents.gr") {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.rateLimitPerMinute = 10; // iList API limit
  }

  /**
   * Rate limiting to respect iList API limits
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.requestWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check if we've hit the rate limit
    if (this.requestCount >= this.rateLimitPerMinute) {
      const waitTime = this.requestWindow - (now - this.lastRequestTime);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Create headers for API requests
   */
  private createHeaders(
    additionalHeaders: Record<string, string> = {},
  ): HeadersInit {
    return {
      "Content-Type": "application/json",
      authorization: this.authToken,
      ...additionalHeaders,
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.rateLimit();

      const response = await fetch(`${this.baseUrl}/api/properties`, {
        method: "GET",
        headers: this.createHeaders(),
      });

      const data: IListApiResponse<boolean> = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Error testing iList API connection:", error);
      return false;
    }
  }

  /**
   * Fetch properties from iList API
   */
  async fetchProperties(
    params: IListSyncParams = { isSync: true, StatusID: "1" },
    detailed = false,
  ): Promise<IListApiResponse<IListProperty[]>> {
    try {
      await this.rateLimit();

      const defaultParams: IListSyncParams = {
        StatusID: "1", // 1-active, 2-deleted
        isSync: true,
        IncludeDeletedFromCrm: false,
      };

      const requestParams = {
        ...defaultParams,
        ...params,
      };

      const response = await fetch(`${this.baseUrl}/api/properties`, {
        method: "POST",
        headers: this.createHeaders({
          Details: detailed ? "Full" : "Basic",
        }),
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IListApiResponse<IListProperty[]> = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching properties from iList:", error);
      throw error;
    }
  }

  /**
   * Fetch a single property by ID with full details
   */
  async fetchPropertyById(propertyId: number): Promise<IListProperty | null> {
    try {
      await this.rateLimit();

      const response = await fetch(
        `${this.baseUrl}/api/properties/${propertyId}`,
        {
          method: "GET",
          headers: this.createHeaders({
            Details: "Full",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IListApiResponse<IListProperty> = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`Error fetching property ${propertyId} from iList:`, error);
      throw error;
    }
  }

  /**
   * Fetch lookup data from iList API
   */
  async fetchLookupData(
    lookupType: string,
    languageId = 4, // Greek
  ): Promise<IListLookup[]> {
    try {
      await this.rateLimit();

      const response = await fetch(
        `${this.baseUrl}/api/lookups/${lookupType}`,
        {
          method: "GET",
          headers: this.createHeaders({
            Language: languageId.toString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IListApiResponse<IListLookup[]> = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error(
        `Error fetching ${lookupType} lookup data from iList:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetch all available lookup types
   */
  async fetchAllLookups(
    languageId = 4,
  ): Promise<Record<string, IListLookup[]>> {
    const lookupTypes = [
      "PropertyAmenities",
      "PropertySecurity",
      "HeatingType",
      "PropertySpecialFeatures",
      "PropertyUniqueFeatures",
      "NearTo",
      "ImageTypes",
      "Geography",
      "propertycategories",
      "propertysubcategories",
      "floors",
      "places",
      "FramesTypes",
      "GlazedWindows",
      "EstateStatus",
      "View",
      "Orientation",
      "SuitableFor",
      "PropertyAdvantages",
    ];

    const lookups: Record<string, IListLookup[]> = {};

    for (const lookupType of lookupTypes) {
      try {
        lookups[lookupType] = await this.fetchLookupData(
          lookupType,
          languageId,
        );
        // Small delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch ${lookupType}:`, error);
        lookups[lookupType] = [];
      }
    }

    return lookups;
  }

  /**
   * Incremental sync - fetch properties updated since last sync
   */
  async incrementalSync(
    lastSyncDate: Date,
  ): Promise<IListApiResponse<IListProperty[]>> {
    const params: IListSyncParams = {
      StatusID: "1",
      isSync: true,
      UpdateDateFromUTC: lastSyncDate.toISOString(),
      IncludeDeletedFromCrm: false,
    };

    return this.fetchProperties(params, true);
  }

  /**
   * Full sync - fetch all active properties
   */
  async fullSync(): Promise<IListApiResponse<IListProperty[]>> {
    const params: IListSyncParams = {
      StatusID: "1",
      isSync: true,
      IncludeDeletedFromCrm: false,
    };

    return this.fetchProperties(params, true);
  }

  /**
   * Sync deleted properties
   */
  async syncDeletedProperties(
    lastSyncDate?: Date,
  ): Promise<IListApiResponse<IListProperty[]>> {
    const params: IListSyncParams = {
      StatusID: "2", // Deleted properties
      isSync: true,
      IncludeDeletedFromCrm: true,
      ...(lastSyncDate && { UpdateDateFromUTC: lastSyncDate.toISOString() }),
    };

    return this.fetchProperties(params, true);
  }
}

/**
 * Create an iList API client instance
 */
export function createIListClient(authToken: string): IListApiClient {
  return new IListApiClient(authToken);
}

/**
 * Helper function to extract Greek text from characteristics
 */
export function extractGreekText(
  characteristics: IListCharacteristic[],
  titleKey: string,
): string {
  const characteristic = characteristics.find(
    (c) => c.Title === titleKey && c.Language_Id === 4,
  );
  return characteristic?.Value || "";
}

/**
 * Helper function to get property title in Greek
 */
export function getPropertyTitle(property: IListProperty): string {
  if (!property.Characteristics) return "";
  return extractGreekText(property.Characteristics, "Τίτλος");
}

/**
 * Helper function to get property description in Greek
 */
export function getPropertyDescription(property: IListProperty): string {
  if (!property.Characteristics) return "";
  return extractGreekText(property.Characteristics, "Επιπλέον κείμενο (ΧΕ)");
}

/**
 * Helper function to get property ad text in Greek
 */
export function getPropertyAdText(property: IListProperty): string {
  if (!property.Characteristics) return "";
  return extractGreekText(property.Characteristics, "Αγγελία");
}

/**
 * Helper function to get primary image URL
 */
export function getPrimaryImageUrl(property: IListProperty): string {
  if (!property.Images || property.Images.length === 0) return "";

  // Sort by OrderNum and get the first one
  const sortedImages = [...property.Images].sort(
    (a, b) => a.OrderNum - b.OrderNum,
  );
  return sortedImages[0]?.Url || "";
}

/**
 * Helper function to format partner name
 */
export function getPartnerName(partner: IListPartner): string {
  return `${partner.Firstname || ""} ${partner.Lastname || ""}`.trim();
}
