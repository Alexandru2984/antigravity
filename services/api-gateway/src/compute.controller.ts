import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { Public } from './auth/auth.guard';

const INTERNAL_SERVICE_TOKEN_HEADER = 'x-internal-service-token';
const DEFAULT_MAX_CONCURRENT_TRANSACTIONS = 2;
const MAX_STRING_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_IMAGE_IDS = 10;
const MAX_ATTRIBUTES_BYTES = 4096;

const SERVICE_URL_DEFAULTS = {
  contractValidator: {
    env: 'CONTRACT_VALIDATOR_URL',
    url: 'http://contract-validator:4035',
  },
  prolog: { env: 'PROLOG_SERVICE_URL', url: 'http://prolog-service:4055' },
  julia: { env: 'JULIA_SERVICE_URL', url: 'http://julia-service:4054' },
  r: { env: 'R_SERVICE_URL', url: 'http://r-service:4060' },
  ml: { env: 'ML_SERVICE_URL', url: 'http://ml-service:4028' },
  cobol: { env: 'COBOL_SERVICE_URL', url: 'http://cobol-service:4022' },
  assembly: {
    env: 'ASSEMBLY_SERVICE_URL',
    url: 'http://assembly-service:4021',
  },
  zig: { env: 'ZIG_SERVICE_URL', url: 'http://zig-service:4062' },
  brainfuck: {
    env: 'BRAINFUCK_SERVICE_URL',
    url: 'http://brainfuck-service:4020',
  },
};

type ServiceUrlKey = keyof typeof SERVICE_URL_DEFAULTS;

interface MeshTransactionRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  sellerId?: string;
  location?: string;
  currency?: string;
  subcategory?: string;
  county?: string;
  lat?: number;
  lng?: number;
  imageIds?: string[];
  attributes?: Record<string, unknown>;
}

@Public()
@Controller('api/v1/polyglot-mesh')
export class ComputeController {
  private activeTransactions = 0;

  @Get('nodes')
  async getMeshNodes() {
    return [
      {
        name: 'Rust-Core',
        language: 'Rust',
        port: 4002,
        description: 'Core CRUD Operations & MongoDB Interface',
      },
      {
        name: 'C++-Images',
        language: 'C++',
        port: 4004,
        description: 'High-speed image processing & metadata extraction',
      },
      {
        name: 'Go-Feed',
        language: 'Go',
        port: 4008,
        description: 'High-throughput social activity streams & caching',
      },
      {
        name: 'PHP-Reviews',
        language: 'PHP',
        port: 4009,
        description: 'Customer reviews & feedback tracking',
      },
      {
        name: 'Python-ML',
        language: 'Python',
        port: 4028,
        description: 'Neo4j-powered recommendations',
      },
      {
        name: 'Haskell-Validator',
        language: 'Haskell',
        port: 4035,
        description: 'Formal mathematical contract verification',
      },
      {
        name: 'Brainfuck-Crypt',
        language: 'Brainfuck',
        port: 4050,
        description: 'Esoteric security hash Generation',
      },
      {
        name: 'Assembly-Fibo',
        language: 'Assembly',
        port: 4051,
        description: 'Hyper-optimized hardware signature matching',
      },
      {
        name: 'COBOL-Ledger',
        language: 'COBOL',
        port: 4052,
        description: 'Legacy mainframe merchant financial tracking',
      },
      {
        name: 'Clojure-Rules',
        language: 'Clojure',
        port: 4053,
        description: 'Functional marketing rules compiler',
      },
      {
        name: 'Julia-Stats',
        language: 'Julia',
        port: 4054,
        description: 'Pricing analysis & real-time standard deviation',
      },
      {
        name: 'Prolog-Fraud',
        language: 'Prolog',
        port: 4055,
        description: 'Logical expert system for fraud screening',
      },
      {
        name: 'Elixir-Broker',
        language: 'Elixir',
        port: 4057,
        description: 'Real-time WebSocket event dispatching',
      },
      {
        name: 'Scala-Stream',
        language: 'Scala',
        port: 4058,
        description: 'Kafka event broker stream processor',
      },
      {
        name: 'Lua-Customizer',
        language: 'Lua',
        port: 4059,
        description: 'Dynamic UI rendering rules processor',
      },
      {
        name: 'R-Regression',
        language: 'R',
        port: 4060,
        description: 'Statistical linear pricing regression & forecasting',
      },
      {
        name: 'Zig-Crypto',
        language: 'Zig',
        port: 4062,
        description: 'Zero-dependency binary cryptographic hashing',
      },
      {
        name: 'Swift-Mobile',
        language: 'Swift',
        port: 4063,
        description: 'Mobile listing payload payload parsing',
      },
      {
        name: 'Nim-Optimizer',
        language: 'Nim',
        port: 4064,
        description: 'Static description text normalization',
      },
    ];
  }

  @Post('transaction')
  async executeTransaction(@Body() body: unknown) {
    if (!this.isMeshEnabled()) {
      throw new ServiceUnavailableException('Polyglot mesh is disabled');
    }

    const releaseSlot = this.acquireTransactionSlot();
    try {
      return await this.executeTransactionCore(this.normalizeBody(body));
    } finally {
      releaseSlot();
    }
  }

  private async executeTransactionCore(body: MeshTransactionRequest) {
    // Ensure sellerId is a valid UUID, generate a deterministic one if not
    let sellerId = body.sellerId || '00000000-0000-0000-0000-000000000100';
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sellerId)) {
      if (sellerId.includes('vendor') || sellerId.includes('premium')) {
        sellerId = '11111111-1111-1111-1111-111111111111';
      } else if (sellerId.includes('seller') || sellerId.includes('100')) {
        sellerId = '22222222-2222-2222-2222-222222222222';
      } else {
        sellerId = '00000000-0000-0000-0000-000000000100';
      }
    }

    const listing = {
      title: body.title || 'Demo Listing Item',
      price: Number(body.price) || 250,
      category: body.category || 'electronics',
      seller_id: sellerId,
      location: body.location || 'Bucuresti',
    };

    const startTime = Date.now();
    const reports: any[] = [];

    // Step 1: Haskell Contract Validation (Formal validation)
    const haskellReport = {
      service: 'Haskell-Validator',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('contractValidator')}/validate`,
        {
          payload: listing,
          schemaName: 'listing',
        },
        { timeout: 1500 },
      );
      haskellReport.status = 'online';
      haskellReport.data = res.data;
    } catch (e) {
      haskellReport.data = { error: e.message };
    }
    reports.push(haskellReport);

    // Step 2: Prolog Fraud Screening
    const prologReport = {
      service: 'Prolog-Fraud',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('prolog')}/check_fraud`,
        {
          price: listing.price,
          category: listing.category,
        },
        { timeout: 1500 },
      );
      prologReport.status = 'online';
      prologReport.data = res.data;
    } catch (e) {
      prologReport.data = { error: e.message };
    }
    reports.push(prologReport);

    // Step 3: Julia Statistics Analysis
    const juliaReport = {
      service: 'Julia-Stats',
      status: 'offline',
      data: null as any,
    };
    try {
      const prices = [
        listing.price,
        Math.round(listing.price * 0.9),
        Math.round(listing.price * 1.15),
        Math.round(listing.price * 0.85),
      ];
      const res = await axios.post(
        this.serviceUrl('julia'),
        { data: prices },
        { timeout: 1500 },
      );
      juliaReport.status = 'online';
      juliaReport.data = res.data;
    } catch (e) {
      juliaReport.data = { error: e.message };
    }
    reports.push(juliaReport);

    // Step 4: R Statistical Linear Regression & Forecast
    const rReport = {
      service: 'R-Regression',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('r'), { timeout: 1500 });
      rReport.status = 'online';
      rReport.data = res.data;
    } catch (e) {
      rReport.data = { error: e.message };
    }
    reports.push(rReport);

    // Step 5: Python ML Recommendation Engine
    const pythonReport = {
      service: 'Python-ML',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(`${this.serviceUrl('ml')}/recommend`, {
        timeout: 1500,
      });
      pythonReport.status = 'online';
      pythonReport.data = res.data;
    } catch (e) {
      pythonReport.data = { error: e.message };
    }
    reports.push(pythonReport);

    // Step 6: COBOL Mainframe Billing Posting
    const cobolReport = {
      service: 'COBOL-Ledger',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('cobol'), {
        timeout: 1500,
      });
      cobolReport.status = 'online';
      cobolReport.data = { message: res.data.trim() };
    } catch (e) {
      cobolReport.data = { error: e.message };
    }
    reports.push(cobolReport);

    // Step 7: Assembly hyper-optimized mathematical payload validation
    const assemblyReport = {
      service: 'Assembly-Fibo',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('assembly'), {
        timeout: 1500,
      });
      assemblyReport.status = 'online';
      assemblyReport.data = { message: res.data.trim() };
    } catch (e) {
      assemblyReport.data = { error: e.message };
    }
    reports.push(assemblyReport);

    // Step 8: Zig High-performance cryptographic checksumming
    const zigReport = {
      service: 'Zig-Crypto',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('zig'), { timeout: 1500 });
      zigReport.status = 'online';
      zigReport.data = { message: res.data.trim() };
    } catch (e) {
      zigReport.data = { error: e.message };
    }
    reports.push(zigReport);

    // Step 9: Brainfuck esoteric verification signature
    const bfReport = {
      service: 'Brainfuck-Crypt',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('brainfuck'), {
        timeout: 1500,
      });
      bfReport.status = 'online';
      bfReport.data = { signature: res.data.trim() };
    } catch (e) {
      bfReport.data = { error: e.message };
    }
    reports.push(bfReport);

    // Step 10: Call Rust Listing service to persist in MongoDB and publish to Kafka
    const rustReport = {
      service: 'Rust-Persist-Core',
      status: 'offline',
      data: null as any,
    };
    const isContractValid =
      haskellReport.status === 'online' && haskellReport.data?.valid === true;

    if (isContractValid) {
      try {
        const listingServiceUrl =
          process.env.LISTING_SERVICE_URL || 'http://listing-service:4022';
        const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
        if (!internalServiceToken) {
          throw new Error('INTERNAL_SERVICE_TOKEN is not configured');
        }
        const rustRes = await axios.post(
          `${listingServiceUrl}/listings`,
          {
            title: listing.title,
            description:
              body.description ||
              `Mesh validated transaction. Timestamp: ${new Date().toISOString()}`,
            price: Math.round(listing.price * 100), // convert to cents/bani
            currency: body.currency || 'RON',
            category: listing.category,
            subcategory: body.subcategory || 'general',
            location: {
              city: listing.location,
              county: body.county || 'Bucuresti',
              lat: body.lat ? Number(body.lat) : 44.4268,
              lng: body.lng ? Number(body.lng) : 26.1025,
            },
            image_ids: body.imageIds || [],
            attributes: this.withMeshAttributes(body.attributes, reports),
          },
          {
            headers: {
              'x-user-id': sellerId,
              [INTERNAL_SERVICE_TOKEN_HEADER]: internalServiceToken,
              'Content-Type': 'application/json',
            },
            timeout: 3000,
          },
        );
        rustReport.status = 'online';
        rustReport.data = rustRes.data;
      } catch (e: any) {
        rustReport.status = 'error';
        rustReport.data = {
          error: e.message,
          details: e.response?.data || null,
        };
      }
      reports.push(rustReport);
    }

    const duration = Date.now() - startTime;

    return {
      status:
        rustReport.status === 'online'
          ? 'SUCCESS_PERSISTED'
          : 'PARTIAL_SUCCESS',
      timestamp: new Date().toISOString(),
      transactionDetails: {
        ...listing,
        mongo_id: rustReport.data?.id || null,
      },
      durationMs: duration,
      nodeReports: reports,
    };
  }

  private isMeshEnabled(): boolean {
    return process.env.POLYGLOT_MESH_ENABLED === 'true';
  }

  private serviceUrl(key: ServiceUrlKey): string {
    const service = SERVICE_URL_DEFAULTS[key];
    return process.env[service.env] || service.url;
  }

  private withMeshAttributes(
    attributes: Record<string, unknown> | undefined,
    reports: any[],
  ): Record<string, unknown> {
    return {
      ...(attributes || {}),
      polyglot_mesh: {
        version: 1,
        evaluated_at: new Date().toISOString(),
        online_nodes: reports
          .filter((report) => report.status === 'online')
          .map((report) => report.service),
        reports: reports.reduce<Record<string, unknown>>((acc, report) => {
          acc[report.service] = {
            status: report.status,
            data: report.data,
          };
          return acc;
        }, {}),
      },
    };
  }

  private acquireTransactionSlot(): () => void {
    const maxConcurrent = this.maxConcurrentTransactions();
    if (this.activeTransactions >= maxConcurrent) {
      throw new ServiceUnavailableException('Polyglot mesh is busy');
    }

    this.activeTransactions += 1;
    return () => {
      this.activeTransactions = Math.max(0, this.activeTransactions - 1);
    };
  }

  private maxConcurrentTransactions(): number {
    const raw = Number(process.env.POLYGLOT_MESH_MAX_CONCURRENCY);
    if (!Number.isInteger(raw) || raw < 1) {
      return DEFAULT_MAX_CONCURRENT_TRANSACTIONS;
    }

    return Math.min(raw, 10);
  }

  private normalizeBody(body: unknown): MeshTransactionRequest {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Request body must be a JSON object');
    }

    const input = body as Record<string, unknown>;
    const normalized: MeshTransactionRequest = {
      title: this.optionalString(input.title, 'title', MAX_STRING_LENGTH),
      description: this.optionalString(
        input.description,
        'description',
        MAX_DESCRIPTION_LENGTH,
      ),
      price: this.optionalPrice(input.price),
      category: this.optionalString(input.category, 'category', 64),
      sellerId: this.optionalString(input.sellerId, 'sellerId', 80),
      location: this.optionalString(input.location, 'location', 80),
      currency: this.optionalString(input.currency, 'currency', 8),
      subcategory: this.optionalString(input.subcategory, 'subcategory', 64),
      county: this.optionalString(input.county, 'county', 80),
      lat: this.optionalCoordinate(input.lat, 'lat', -90, 90),
      lng: this.optionalCoordinate(input.lng, 'lng', -180, 180),
      imageIds: this.optionalStringArray(input.imageIds, 'imageIds'),
      attributes: this.optionalAttributes(input.attributes),
    };

    return normalized;
  }

  private optionalString(
    value: unknown,
    field: string,
    maxLength: number,
  ): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string`);
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      throw new BadRequestException(`${field} is too long`);
    }

    return trimmed;
  }

  private optionalPrice(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const price = Number(value);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
      throw new BadRequestException('price must be between 0 and 1000000');
    }

    return price;
  }

  private optionalCoordinate(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const coordinate = Number(value);
    if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
      throw new BadRequestException(`${field} is out of range`);
    }

    return coordinate;
  }

  private optionalStringArray(
    value: unknown,
    field: string,
  ): string[] | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Array.isArray(value) || value.length > MAX_IMAGE_IDS) {
      throw new BadRequestException(`${field} must be a small string array`);
    }

    return value.map((item) => {
      if (typeof item !== 'string' || item.length > MAX_STRING_LENGTH) {
        throw new BadRequestException(`${field} contains an invalid item`);
      }
      return item;
    });
  }

  private optionalAttributes(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('attributes must be an object');
    }

    if (JSON.stringify(value).length > MAX_ATTRIBUTES_BYTES) {
      throw new BadRequestException('attributes payload is too large');
    }

    return value as Record<string, unknown>;
  }
}
